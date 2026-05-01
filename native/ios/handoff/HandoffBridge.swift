//
//  HandoffBridge.swift
//  spot — feature 040
//
//  iOS 8+ NSUserActivity / Handoff bridge.
//  Authored on Windows; verified on-device per
//  `specs/040-handoff-continuity/quickstart.md` (Constitution V exemption).
//
//  Responsibilities (FR-006..009 / FR-014..015):
//    - Construct NSUserActivity from an ActivityDefinitionRecord and call
//      becomeCurrent() on the receiving end of `setCurrent`.
//    - Track the currently-current activity so `resignCurrent` can call
//      `resignCurrent()` + `invalidate()` and release the reference.
//    - Read `UIApplication.shared.userActivity` on `getCurrent` and convert
//      back to a record (debug-only).
//    - Emit `onContinue` events (see HandoffActivityHandler.swift).
//
//  Exposed to JS via `requireNativeModule('Handoff')` —
//  see `src/native/handoff.ts`.
//

import ExpoModulesCore
import Foundation
import UIKit

public class HandoffBridge: Module {
  /// Retained so `resignCurrent` can invalidate the same instance.
  private var current: NSUserActivity?

  public func definition() -> ModuleDefinition {
    Name("Handoff")

    Constants([
      "isAvailable": true
    ])

    Events("onContinue")

    AsyncFunction("setCurrent") { (definition: ActivityDefinitionRecord) -> Void in
      // If an activity is already current, invalidate it first.
      if let prior = self.current {
        prior.resignCurrent()
        prior.invalidate()
        self.current = nil
      }

      let activity = NSUserActivity(activityType: definition.activityType)
      activity.title = definition.title

      if let urlString = definition.webpageURL,
         let url = URL(string: urlString) {
        activity.webpageURL = url
      }

      activity.userInfo = definition.userInfo as [AnyHashable: Any]
      activity.requiredUserInfoKeys = Set(definition.requiredUserInfoKeys)

      activity.isEligibleForHandoff = definition.isEligibleForHandoff
      activity.isEligibleForSearch = definition.isEligibleForSearch
      if #available(iOS 12.0, *) {
        activity.isEligibleForPrediction = definition.isEligibleForPrediction
      }

      activity.becomeCurrent()
      self.current = activity
    }

    AsyncFunction("resignCurrent") { () -> Void in
      guard let activity = self.current else { return }
      activity.resignCurrent()
      activity.invalidate()
      self.current = nil
    }

    AsyncFunction("getCurrent") { () -> ActivityDefinitionRecord? in
      // Reads the application's user activity. Returns nil if none.
      // Note: this is a best-effort debug surface — the OS may surface a
      // different activity than the one this bridge most recently set.
      let activity: NSUserActivity?
      if let appActivity = UIApplication.shared.userActivity {
        activity = appActivity
      } else {
        activity = self.current
      }
      guard let activity = activity else { return nil }
      return Self.recordFrom(activity: activity)
    }
  }

  /// Convert an NSUserActivity to the JS record DTO.
  private static func recordFrom(activity: NSUserActivity) -> ActivityDefinitionRecord {
    let record = ActivityDefinitionRecord()
    record.activityType = activity.activityType
    record.title = activity.title ?? ""
    record.webpageURL = activity.webpageURL?.absoluteString
    var userInfo: [String: String] = [:]
    if let raw = activity.userInfo {
      for (k, v) in raw {
        if let key = k as? String {
          userInfo[key] = String(describing: v)
        }
      }
    }
    record.userInfo = userInfo
    record.requiredUserInfoKeys = Array(activity.requiredUserInfoKeys ?? Set<String>()).sorted()
    record.isEligibleForHandoff = activity.isEligibleForHandoff
    record.isEligibleForSearch = activity.isEligibleForSearch
    if #available(iOS 12.0, *) {
      record.isEligibleForPrediction = activity.isEligibleForPrediction
    } else {
      record.isEligibleForPrediction = false
    }
    return record
  }
}

// MARK: - DTOs

/// Mirror of the JS `ActivityDefinition` interface.
public final class ActivityDefinitionRecord: Record {
  @Field public var activityType: String = ""
  @Field public var title: String = ""
  @Field public var webpageURL: String?
  @Field public var userInfo: [String: String] = [:]
  @Field public var requiredUserInfoKeys: [String] = []
  @Field public var isEligibleForHandoff: Bool = true
  @Field public var isEligibleForSearch: Bool = true
  @Field public var isEligibleForPrediction: Bool = true

  public required init() {}
}
