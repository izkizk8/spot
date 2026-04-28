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
      // US1 (T042): wire AVAudioEngine + SFSpeechAudioBufferRecognitionRequest.

      // 1. Authorization gates
      let speechAuth = SFSpeechRecognizer.authorizationStatus()
      guard speechAuth == .authorized else {
        throw SpeechAuthorizationError()
      }
      let micAuth = AVAudioSession.sharedInstance().recordPermission
      guard micAuth == .granted else {
        throw SpeechAuthorizationError()
      }

      // 2. Recognizer construction (locale-specific)
      let localeID = args.locale.replacingOccurrences(of: "-", with: "_")
      guard let recognizer = SFSpeechRecognizer(locale: Locale(identifier: localeID)),
            recognizer.isAvailable else {
        throw SpeechRecognitionNotSupportedError()
      }

      // 3. On-device gating
      if args.onDevice && !recognizer.supportsOnDeviceRecognition {
        throw SpeechRecognitionNotSupportedError()
      }
      recognizer.defaultTaskHint = .dictation
      self.recognizer = recognizer

      // 4. Tear down any prior session
      self.tearDown(emit: false)

      // 5. AVAudioSession config (.record, measurement, duckOthers)
      let session = AVAudioSession.sharedInstance()
      do {
        try session.setCategory(.record, mode: .measurement, options: [.duckOthers])
        try session.setActive(true, options: .notifyOthersOnDeactivation)
      } catch {
        throw SpeechAudioEngineError()
      }

      // 6. Recognition request
      let request = SFSpeechAudioBufferRecognitionRequest()
      request.shouldReportPartialResults = true
      if args.onDevice {
        request.requiresOnDeviceRecognition = true
      }
      self.request = request

      // 7. Install audio tap
      let inputNode = self.audioEngine.inputNode
      let format = inputNode.outputFormat(forBus: 0)
      inputNode.removeTap(onBus: 0)
      inputNode.installTap(onBus: 0, bufferSize: 1024, format: format) { buffer, _ in
        request.append(buffer)
      }

      // 8. Start engine
      self.audioEngine.prepare()
      do {
        try self.audioEngine.start()
      } catch {
        self.tearDown(emit: false)
        throw SpeechAudioEngineError()
      }

      let token = UUID()
      self.sessionToken = token

      // 9. Recognition task
      self.task = recognizer.recognitionTask(with: request) { [weak self] result, error in
        guard let self = self, self.sessionToken == token else { return }

        if let result = result {
          let transcript = result.bestTranscription.formattedString
          let words: [[String: Any]] = result.bestTranscription.segments.map { seg in
            var entry: [String: Any] = ["word": seg.substring]
            // Apple's confidence == 0 sentinel means "not yet computed"; omit it.
            if seg.confidence > 0 {
              entry["confidence"] = seg.confidence
            }
            return entry
          }

          if result.isFinal {
            self.sendEvent(
              "final",
              ["transcript": transcript, "words": words, "isFinal": true]
            )
            self.tearDown(emit: false)
          } else {
            self.sendEvent("partial", ["transcript": transcript, "words": words])
          }
        }

        if let error = error {
          let nsError = error as NSError
          let kind: String
          switch nsError.domain {
          case "kAFAssistantErrorDomain":
            // Cancelled-on-stop is benign.
            if nsError.code == 203 || nsError.code == 216 {
              return
            }
            kind = "interrupted"
          case NSURLErrorDomain:
            kind = "network"
          default:
            kind = "unknown"
          }
          self.sendEvent(
            "error",
            ["kind": kind, "message": nsError.localizedDescription]
          )
          self.tearDown(emit: false)
        }
      }
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
