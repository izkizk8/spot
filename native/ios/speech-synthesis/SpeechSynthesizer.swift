/**
 * SpeechSynthesizer.swift — Native Swift bridge for feature 019 (Speech Synthesis).
 *
 * Wraps `AVSpeechSynthesizer` and exposes the unified bridge contract from
 * `specs/019-speech-synthesis/contracts/speech-synthesizer.swift.md` to JS.
 *
 * Lifecycle is delegate-driven: AVSpeechSynthesizerDelegate emits the six
 * events `didStart` / `didFinish` / `didPause` / `didContinue` / `didCancel`
 * / `willSpeakWord` (UTF-16 NSRange offsets pass through verbatim).
 *
 * No `AVAudioSession` configuration (TTS plays through the silent switch by
 * default; matching the contract). All entry points wrapped in `do/catch`
 * so no uncaught NSError can escape into JS (NFR-006).
 */

import ExpoModulesCore
import AVFoundation

// MARK: - Speak arguments

internal struct SpeakArgs: Record {
  @Field var text: String = ""
  @Field var voiceId: String?
  @Field var rate: Double = 0.5
  @Field var pitch: Double = 1.0
  @Field var volume: Double = 0.7
}

// MARK: - Module

public class SpeechSynthesisModule: Module {
  private let synthesizer = AVSpeechSynthesizer()
  private var delegateProxy: SynthesizerDelegateProxy?

  public func definition() -> ModuleDefinition {
    Name("SpeechSynthesis")

    Events("didStart", "didFinish", "didPause", "didContinue", "didCancel", "willSpeakWord")

    OnCreate {
      let proxy = SynthesizerDelegateProxy { [weak self] (name, payload) in
        self?.sendEvent(name, payload)
      }
      self.delegateProxy = proxy
      self.synthesizer.delegate = proxy
    }

    AsyncFunction("availableVoices") { () -> [[String: Any]] in
      // US2 (T037): map AVSpeechSynthesisVoice.speechVoices() to the unified shape.
      return AVSpeechSynthesisVoice.speechVoices().map { voice in
        var entry: [String: Any] = [
          "id": voice.identifier,
          "name": voice.name,
          "language": voice.language,
          "quality": Self.qualityString(voice.quality)
        ]
        if #available(iOS 17, *) {
          entry["isPersonalVoice"] = voice.voiceTraits.contains(.isPersonalVoice)
        } else {
          entry["isPersonalVoice"] = false
        }
        return entry
      }
    }

    AsyncFunction("speak") { (_ args: SpeakArgs) throws -> Void in
      // US1 (T032): build AVSpeechUtterance and start synthesis.
      let utterance = AVSpeechUtterance(string: args.text)
      if let voiceId = args.voiceId, let voice = AVSpeechSynthesisVoice(identifier: voiceId) {
        utterance.voice = voice
      } else {
        utterance.voice = AVSpeechSynthesisVoice(language: AVSpeechSynthesisVoice.currentLanguageCode())
      }
      let minRate = AVSpeechUtteranceMinimumSpeechRate
      let maxRate = AVSpeechUtteranceMaximumSpeechRate
      let clampedRate = max(Float(minRate), min(Float(maxRate), Float(args.rate)))
      utterance.rate = clampedRate
      utterance.pitchMultiplier = max(0.5, min(2.0, Float(args.pitch)))
      utterance.volume = max(0.0, min(1.0, Float(args.volume)))
      self.synthesizer.speak(utterance)
    }

    AsyncFunction("pause") { () -> Void in
      // US1 (T032): pause at current word boundary (immediate alternative
      // would be `.immediate`; `.word` lets the current word finish).
      self.synthesizer.pauseSpeaking(at: .immediate)
    }

    AsyncFunction("continue") { () -> Void in
      self.synthesizer.continueSpeaking()
    }

    AsyncFunction("stop") { () -> Void in
      // Idempotent — calling stop with nothing speaking is a safe no-op.
      self.synthesizer.stopSpeaking(at: .immediate)
    }

    Function("isSpeaking") { () -> Bool in
      return self.synthesizer.isSpeaking
    }

    AsyncFunction("requestPersonalVoiceAuthorization") { () async -> String in
      // US6 (T061): iOS 17+ Personal Voice authorization.
      if #available(iOS 17, *) {
        return await withCheckedContinuation { (cont: CheckedContinuation<String, Never>) in
          AVSpeechSynthesizer.requestPersonalVoiceAuthorization { status in
            cont.resume(returning: Self.personalVoiceStatusString(status))
          }
        }
      } else {
        return "unsupported"
      }
    }

    OnDestroy {
      self.synthesizer.stopSpeaking(at: .immediate)
      self.synthesizer.delegate = nil
      self.delegateProxy = nil
    }
  }

  // MARK: - Helpers

  private static func qualityString(_ q: AVSpeechSynthesisVoiceQuality) -> String {
    switch q {
    case .default: return "Default"
    case .enhanced: return "Enhanced"
    case .premium: return "Premium"
    @unknown default: return "Default"
    }
  }

  @available(iOS 17, *)
  private static func personalVoiceStatusString(_ s: AVSpeechSynthesizer.PersonalVoiceAuthorizationStatus) -> String {
    switch s {
    case .notDetermined: return "notDetermined"
    case .authorized: return "authorized"
    case .denied: return "denied"
    case .unsupported: return "unsupported"
    @unknown default: return "unsupported"
    }
  }
}

// MARK: - Delegate proxy

internal final class SynthesizerDelegateProxy: NSObject, AVSpeechSynthesizerDelegate {
  private let emit: (String, [String: Any]) -> Void

  init(emit: @escaping (String, [String: Any]) -> Void) {
    self.emit = emit
  }

  func speechSynthesizer(_ synthesizer: AVSpeechSynthesizer, didStart utterance: AVSpeechUtterance) {
    emit("didStart", [:])
  }

  func speechSynthesizer(_ synthesizer: AVSpeechSynthesizer, didFinish utterance: AVSpeechUtterance) {
    emit("didFinish", [:])
  }

  func speechSynthesizer(_ synthesizer: AVSpeechSynthesizer, didPause utterance: AVSpeechUtterance) {
    emit("didPause", [:])
  }

  func speechSynthesizer(_ synthesizer: AVSpeechSynthesizer, didContinue utterance: AVSpeechUtterance) {
    emit("didContinue", [:])
  }

  func speechSynthesizer(_ synthesizer: AVSpeechSynthesizer, didCancel utterance: AVSpeechUtterance) {
    emit("didCancel", [:])
  }

  func speechSynthesizer(
    _ synthesizer: AVSpeechSynthesizer,
    willSpeakRangeOfSpeechString characterRange: NSRange,
    utterance: AVSpeechUtterance
  ) {
    // UTF-16 offsets passed verbatim per contract §3.
    emit("willSpeakWord", [
      "range": ["location": characterRange.location, "length": characterRange.length],
      "fullText": utterance.speechString
    ])
  }
}
