/**
 * SharePlayBridge.swift
 * Feature: 047-shareplay
 *
 * Expo Module wrapping the GroupActivities framework. JS surface
 * mirrors `src/native/shareplay.ts`. Manages a single active
 * `GroupSession<ShowcaseGroupActivity>`, observes participants,
 * and routes a tiny Counter payload through
 * `GroupSessionMessenger`.
 *
 * NOTE: The file compiles on every iOS deployment target — the
 * GroupActivities-specific code is gated behind
 * `#if canImport(GroupActivities)` and the `@available(iOS 15.0)`
 * marker. On older targets every async function throws.
 */

import ExpoModulesCore
import Combine
#if canImport(GroupActivities)
import GroupActivities
#endif

private struct CounterMessage: Codable {
  let value: Int
}

@available(iOS 15.0, *)
public class SharePlayBridge: Module {
  #if canImport(GroupActivities)
  private var session: GroupSession<ShowcaseGroupActivity>?
  private var messenger: GroupSessionMessenger?
  private var subscriptions: Set<AnyCancellable> = []
  private var tasks: [Task<Void, Never>] = []
  #endif

  private var status: String = "none"
  private var counter: Int = 0
  private var activityType: String = ""
  private var activityTitle: String = ""
  private var participantNames: [[String: Any?]] = []

  public func definition() -> ModuleDefinition {
    Name("SharePlayBridge")

    Events("onStateChange")

    Function("isAvailable") { () -> Bool in
      #if canImport(GroupActivities)
      return true
      #else
      return false
      #endif
    }

    Function("getState") { () -> [String: Any] in
      return self.snapshot()
    }

    AsyncFunction("startActivity") { (config: [String: Any]) -> Void in
      #if canImport(GroupActivities)
      let type = config["type"] as? String ?? "counter"
      let title = config["title"] as? String ?? "Showcase Activity"
      self.activityType = type
      self.activityTitle = title
      self.status = "preparing"
      self.emitState()

      let activity = ShowcaseGroupActivity(activityType: type, displayTitle: title)
      _ = await activity.activate()
      // The OS will create the session on the FaceTime side; we
      // observe `GroupActivities.shared.sessions` to pick it up.
      self.observeSessions()
      #else
      throw NSError(domain: "SharePlayBridge", code: -1)
      #endif
    }

    AsyncFunction("endActivity") { () -> Void in
      #if canImport(GroupActivities)
      self.session?.end()
      self.session = nil
      self.messenger = nil
      self.status = "ended"
      self.participantNames = []
      self.emitState()
      #else
      throw NSError(domain: "SharePlayBridge", code: -1)
      #endif
    }

    AsyncFunction("sendCounter") { (value: Int) -> Void in
      #if canImport(GroupActivities)
      self.counter = value
      self.emitState()
      guard let messenger = self.messenger else { return }
      try await messenger.send(CounterMessage(value: value))
      #else
      throw NSError(domain: "SharePlayBridge", code: -1)
      #endif
    }
  }

  private func snapshot() -> [String: Any] {
    return [
      "status": status,
      "activity": activityType.isEmpty ? NSNull() : [
        "type": activityType,
        "title": activityTitle,
      ] as [String: Any],
      "participants": participantNames,
      "counter": counter,
    ]
  }

  private func emitState() {
    sendEvent("onStateChange", snapshot())
  }

  #if canImport(GroupActivities)
  private func observeSessions() {
    let task = Task { [weak self] in
      guard let self else { return }
      for await session in ShowcaseGroupActivity.sessions() {
        self.bind(session: session)
      }
    }
    tasks.append(task)
  }

  private func bind(session: GroupSession<ShowcaseGroupActivity>) {
    self.session = session
    self.status = "active"
    let messenger = GroupSessionMessenger(session: session)
    self.messenger = messenger
    session.activeParticipants.publisher
      .sink { [weak self] participants in
        guard let self else { return }
        self.participantNames = participants.map { p in
          [
            "id": p.id.uuidString,
            "displayName": NSNull(),
          ]
        }
        self.emitState()
      }
      .store(in: &subscriptions)

    session.$state.sink { [weak self] state in
      guard let self else { return }
      switch state {
      case .joined: self.status = "active"
      case .waiting: self.status = "preparing"
      case .invalidated: self.status = "ended"
      @unknown default: break
      }
      self.emitState()
    }
    .store(in: &subscriptions)

    Task { [weak self, messenger] in
      for await (msg, _) in messenger.messages(of: CounterMessage.self) {
        guard let self else { return }
        self.counter = msg.value
        self.emitState()
      }
    }

    session.join()
  }
  #endif
}
