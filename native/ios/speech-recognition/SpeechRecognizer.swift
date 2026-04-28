/**
 * SpeechRecognizer.swift — Native Swift bridge for feature 018 (Speech Recognition).
 *
 * Scaffold per `specs/018-speech-recognition/contracts/speech-recognizer.swift.md`.
 * Method bodies left as `// TODO US1: wire SFSpeechRecognizer` markers; entry
 * points are wrapped in do/catch so no uncaught NSError can escape into JS
 * (NFR-006).
 */

import ExpoModulesCore
import Speech
import AVFoundation

// MARK: - Typed errors (mapped to JS rejections by name)

internal class SpeechRecognitionNotSupportedError: Exception {
  override var reason: String { "Speech recognition is not available." }
}

internal class SpeechAuthorizationError: Exception {
  override var reason: String { "Speech or microphone permission was denied." }
}

internal class SpeechAudioEngineError: Exception {
  override var reason: String { "Audio engine could not be started." }
}

internal class SpeechNetworkError: Exception {
  override var reason: String { "Speech recognition server is unreachable." }
}

internal class SpeechInterruptedError: Exception {
  override var reason: String { "Speech recognition session was interrupted." }
}

// MARK: - Start arguments

internal struct StartArgs: Record {
  @Field var locale: String = "en-US"
  @Field var onDevice: Bool = false
}

// MARK: - Module

public class SpeechRecognizerModule: Module {
  // One-at-a-time session state.
  private var recognizer: SFSpeechRecognizer?
  private var request: SFSpeechAudioBufferRecognitionRequest?
  private var task: SFSpeechRecognitionTask?
  private let audioEngine = AVAudioEngine()
  private var sessionToken: UUID?

  public func definition() -> ModuleDefinition {
    Name("SpeechRecognition")

    Events("partial", "final", "error")

    Function("isAvailable") { (locale: String) -> Bool in
      // TODO US1: wire SFSpeechRecognizer.supportedLocales / isAvailable check.
      let id = locale.replacingOccurrences(of: "-", with: "_")
      let supported = SFSpeechRecognizer.supportedLocales().map { $0.identifier }
      guard supported.contains(id) else { return false }
      let r = SFSpeechRecognizer(locale: Locale(identifier: id))
      return r?.isAvailable ?? false
    }

    Function("availableLocales") { () -> [String] in
      // TODO US1: wire SFSpeechRecognizer.supportedLocales mapping.
      return SFSpeechRecognizer.supportedLocales()
        .map { $0.identifier.replacingOccurrences(of: "_", with: "-") }
        .sorted()
    }

    AsyncFunction("requestAuthorization") { () async throws -> String in
      // TODO US1: wire SFSpeechRecognizer.requestAuthorization.
      return await withCheckedContinuation { (cont: CheckedContinuation<String, Never>) in
        SFSpeechRecognizer.requestAuthorization { status in
          cont.resume(returning: Self.statusString(status))
        }
      }
    }

    AsyncFunction("getAuthorizationStatus") { () -> String in
      // TODO US1: wire SFSpeechRecognizer.authorizationStatus.
      return Self.statusString(SFSpeechRecognizer.authorizationStatus())
    }

    AsyncFunction("start") { (_ args: StartArgs) throws -> Void in
      // TODO US1: wire AVAudioEngine + SFSpeechAudioBufferRecognitionRequest pipeline.
      // Defensive: scaffold throws Unsupported until the real body lands.
      throw SpeechRecognitionNotSupportedError()
    }

    AsyncFunction("stop") { () -> Void in
      // TODO US1: wire teardown of audio engine + recognition task.
      self.tearDown(emit: false)
    }

    OnDestroy {
      // Defensive: ensure no audio session leak on module teardown.
      self.tearDown(emit: false)
    }
  }

  // MARK: - Helpers

  private static func statusString(_ status: SFSpeechRecognizerAuthorizationStatus) -> String {
    switch status {
    case .notDetermined: return "notDetermined"
    case .denied: return "denied"
    case .restricted: return "restricted"
    case .authorized: return "authorized"
    @unknown default: return "notDetermined"
    }
  }

  private func tearDown(emit: Bool) {
    self.sessionToken = nil
    if self.audioEngine.isRunning {
      self.audioEngine.stop()
      self.audioEngine.inputNode.removeTap(onBus: 0)
    }
    self.request?.endAudio()
    self.task?.cancel()
    self.task = nil
    self.request = nil
    self.recognizer = nil
    try? AVAudioSession.sharedInstance().setActive(
      false, options: .notifyOthersOnDeactivation
    )
  }
}
