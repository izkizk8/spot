# Phase 1 contract — Native Swift surface for feature 018 (Speech Recognition)

This document is the AUTHORITATIVE Swift surface contract for the native module to be implemented at:

- `native/ios/speech-recognition/SpeechRecognizer.swift`
- `native/ios/speech-recognition/SpeechRecognition.podspec`

The contract pairs with [`speech-bridge.contract.ts`](./speech-bridge.contract.ts), which is the JS-side surface. Together they define the boundary between the React Native layer and Apple's `Speech` + `AVFoundation` frameworks.

The Swift module mirrors the precedent set by feature 015's `native/ios/screentime/ScreenTimeBridge.swift` (event emission), feature 016's `native/ios/coreml/CoreMLBridge.swift` (typed errors), and feature 017's `native/ios/vision/VisionDetector.swift` (`expo-modules-core` `Module` DSL + `AsyncFunction` error envelope).

---

## 1. Podspec

`native/ios/speech-recognition/SpeechRecognition.podspec` declares the Swift module to CocoaPods / `expo-modules-core` autolinking. Required attributes:

```ruby
Pod::Spec.new do |s|
  s.name             = 'SpeechRecognition'   # matches the requireOptionalNativeModule name on the JS side
  s.version          = '1.0.0'
  s.summary          = 'spot 018 — Speech Recognition (SFSpeechRecognizer) bridge'
  s.platforms        = { :ios => '10.0' }    # matches manifest.minIOS
  s.source_files     = '*.swift'
  s.dependency 'ExpoModulesCore'
  s.swift_version    = '5.9'
end
```

`Speech.framework` and `AVFoundation.framework` are part of the iOS SDK and are linked into the app target by the iOS toolchain transparently — no `s.frameworks` declaration is required (research.md R-005). This contrasts with the 017 podspec which declares `s.frameworks = 'Vision', 'CoreImage'` because Vision is a separately declared framework.

---

## 2. Module surface

### Module registration

```swift
import ExpoModulesCore
import Speech
import AVFoundation

public class SpeechRecognitionModule: Module {
  // One-at-a-time session state. Access guarded by the module's
  // serial AsyncFunction queue + an internal lock for the audio
  // session tear-down path called from notification observers.
  private var recognizer: SFSpeechRecognizer?
  private var request: SFSpeechAudioBufferRecognitionRequest?
  private var task: SFSpeechRecognitionTask?
  private let audioEngine = AVAudioEngine()
  private var sessionToken: UUID?      // set on start, cleared on stop/terminal

  public func definition() -> ModuleDefinition {
    Name("SpeechRecognition")

    Events("partial", "final", "error")

    AsyncFunction("requestAuthorization") { () -> String in /* ... */ }

    AsyncFunction("getAuthorizationStatus") { () -> String in /* ... */ }

    Function("isAvailable") { (locale: String) -> Bool in /* ... */ }

    Function("availableLocales") { () -> [String] in /* ... */ }

    AsyncFunction("start") { (args: StartArgs) -> Void in /* ... */ }

    AsyncFunction("stop") { () -> Void in /* ... */ }

    OnDestroy {
      // Defensive: ensure no audio session leak on module teardown.
      self.tearDown(emit: false)
    }
  }
}

struct StartArgs: Record {
  @Field var locale: String
  @Field var onDevice: Bool
}
```

`isAvailable` and `availableLocales` are exposed as **synchronous** `Function` (not `AsyncFunction`) entries because the JS-side bridge contract requires synchronous return values.

### Method: `requestAuthorization()`

Wraps `SFSpeechRecognizer.requestAuthorization { status in ... }`. Resolves with the status string (`"notDetermined" | "denied" | "restricted" | "authorized"`).

### Method: `getAuthorizationStatus()`

Wraps `SFSpeechRecognizer.authorizationStatus()` (synchronous in Swift, surfaced via `AsyncFunction` for cross-platform parity per the JS contract).

### Method: `isAvailable(locale: String) -> Bool`

Returns `true` iff:
- `Locale(identifier: localeWithUnderscores).identifier` is in `SFSpeechRecognizer.supportedLocales().map { $0.identifier }`, AND
- A `SFSpeechRecognizer(locale: ...)` can be constructed AND its `isAvailable` property is `true`.

The `locale` argument arrives as BCP-47 (e.g., `"en-US"`); the bridge converts to underscore form (`"en_US"`) for `Locale(identifier:)` per Apple's convention.

### Method: `availableLocales() -> [String]`

Returns `SFSpeechRecognizer.supportedLocales().map { $0.identifier.replacingOccurrences(of: "_", with: "-") }` (BCP-47-normalized). Sorted alphabetically for stable test fixtures.

### Method: `start(args: StartArgs) -> Void`

**Pseudocode** (the implementation file fleshes this out with full error handling):

```swift
AsyncFunction("start") { (args: StartArgs) -> Void in
  // 0. Defensive teardown of any prior session (idempotency hardening).
  self.tearDown(emit: false)

  // 1. Authorization gate.
  guard SFSpeechRecognizer.authorizationStatus() == .authorized else {
    throw SpeechAuthorizationError("Speech recognition not authorized")
  }

  // 2. Build recognizer for locale.
  let locale = Locale(identifier: args.locale.replacingOccurrences(of: "-", with: "_"))
  guard let recognizer = SFSpeechRecognizer(locale: locale), recognizer.isAvailable else {
    throw SpeechRecognitionNotSupportedError("Recognizer unavailable for locale \(args.locale)")
  }
  self.recognizer = recognizer

  // 3. On-device gate (R-004): never silently fall back to server.
  if args.onDevice && !recognizer.supportsOnDeviceRecognition {
    throw SpeechRecognitionNotSupportedError(
      "On-device recognition not available for locale \(args.locale)"
    )
  }

  // 4. Build request.
  let request = SFSpeechAudioBufferRecognitionRequest()
  request.shouldReportPartialResults = true
  request.requiresOnDeviceRecognition = args.onDevice
  self.request = request

  // 5. Configure & activate audio session (R-002).
  let session = AVAudioSession.sharedInstance()
  do {
    try session.setCategory(.record, mode: .measurement, options: .duckOthers)
    try session.setActive(true, options: .notifyOthersOnDeactivation)
  } catch {
    throw SpeechAudioEngineError("AVAudioSession activation failed: \(error)")
  }

  // 6. Install tap on audio engine input node.
  let inputNode = self.audioEngine.inputNode
  let format = inputNode.outputFormat(forBus: 0)
  inputNode.removeTap(onBus: 0)  // defensive
  inputNode.installTap(onBus: 0, bufferSize: 1024, format: format) { buffer, _ in
    self.request?.append(buffer)
  }

  // 7. Start engine.
  self.audioEngine.prepare()
  do {
    try self.audioEngine.start()
  } catch {
    self.tearDown(emit: false)
    throw SpeechAudioEngineError("AVAudioEngine start failed: \(error)")
  }

  // 8. Spin up recognition task.
  let token = UUID()
  self.sessionToken = token
  self.task = recognizer.recognitionTask(with: request) { [weak self] result, error in
    guard let self = self, self.sessionToken == token else { return }  // stale callback guard

    if let error = error as NSError? {
      let kind = self.mapErrorToKind(error)
      self.sendEvent("error", ["kind": kind, "message": error.localizedDescription])
      self.tearDown(emit: false)
      return
    }

    guard let result = result else { return }

    let words = result.bestTranscription.segments.map { seg -> [String: Any] in
      var w: [String: Any] = ["word": seg.substring]
      if seg.confidence > 0 { w["confidence"] = Double(seg.confidence) }
      return w
    }

    let payload: [String: Any] = [
      "transcript": result.bestTranscription.formattedString,
      "words":      words,
    ]

    if result.isFinal {
      var finalPayload = payload
      finalPayload["isFinal"] = true
      self.sendEvent("final", finalPayload)
      self.tearDown(emit: false)
    } else {
      self.sendEvent("partial", payload)
    }
  }

  // 9. Subscribe to AVAudioSession.interruptionNotification (mid-session).
  // (Detail elided — emits ("error", { kind: "interrupted", ... }) and tearDown.)
}
```

### Method: `stop() -> Void`

Idempotent. Calls `tearDown(emit: false)`, then resolves.

### Helper: `tearDown(emit:)`

```swift
private func tearDown(emit: Bool) {
  // Bump session token so any in-flight callback short-circuits.
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

  // Deactivate the shared audio session, notifying other apps.
  try? AVAudioSession.sharedInstance().setActive(
    false, options: .notifyOthersOnDeactivation,
  )
}
```

---

## 3. Error envelope

Every error path MUST surface as one of the typed `expo-modules-core` rejections (for `start`-time / `requestAuthorization`-time failures) or as an `error` event with a typed `kind` (for mid-session failures). No Swift error may escape any `AsyncFunction` handler as an uncaught exception (NFR-006).

### Promise rejections (`start`)

| Swift error type | JS rejection name | Trigger |
|------------------|-------------------|---------|
| `SpeechRecognitionNotSupportedError` | `SpeechRecognitionNotSupported` | Recognizer unavailable for locale; on-device requested but unsupported (R-004) |
| `SpeechAuthorizationError` | `SpeechAuthorizationError` | `SFSpeechRecognizer.authorizationStatus() != .authorized` |
| `SpeechAudioEngineError` | `SpeechAudioEngineError` | `AVAudioSession` setCategory / setActive / `AVAudioEngine.start()` failure |

### `error` event payloads (mid-session)

The `error` event MUST carry `{ kind: SpeechErrorKind, message: string }` per FR-021. The `kind` is derived from the underlying `NSError` per research.md R-012:

| `NSError` source | `kind` |
|------------------|--------|
| `domain == NSURLErrorDomain` or `kAFAssistantErrorDomain` server codes | `'network'` |
| `AVAudioSession.interruptionNotification` (Began) | `'interrupted'` |
| Any other recognition-task error | `'unknown'` |

After any `error` event, `tearDown(emit: false)` is invoked synchronously so the audio session is deactivated and the next `start` begins from a clean slate.

### Module-not-registered

Surfaced **JS-side** by `requireOptionalNativeModule('SpeechRecognition') === null`. The `isAvailable(locale)` JS method returns `false` in this case, and every other method (in the iOS file) rejects with `SpeechRecognitionNotSupported` rather than calling into Swift. There is no Swift-side counterpart because the module simply does not exist on non-iOS / iOS < 10 platforms.

---

## 4. Threading

`expo-modules-core`'s `AsyncFunction` runs on an internal serial dispatch queue, off the main thread. `SFSpeechRecognizer.recognitionTask(with:resultHandler:)` invokes its result handler on its own internal queue; emissions via `sendEvent(...)` are thread-safe and marshal onto the JS thread before listeners fire (research.md R-003).

`AVAudioSession.interruptionNotification` is delivered on the main thread by default; the bridge subscribes via `NotificationCenter` and dispatches the same teardown path used by `stop`.

The hook's terminal-event handling is JS-side; the Swift module does not need to coordinate with the hook beyond firing the correct event.

---

## 5. Coordinate-/locale-string convention (the critical detail)

Apple's `Locale(identifier:)` accepts both BCP-47 (`"en-US"`) and underscore form (`"en_US"`) but `SFSpeechRecognizer.supportedLocales()` returns identifiers in **underscore form**. The bridge MUST normalize on the boundary:

- Inbound (from JS `start({ locale: 'en-US' })`): convert hyphens to underscores before constructing `Locale`.
- Outbound (from `availableLocales()`): convert underscores to hyphens before returning to JS.

This is documented in three places (research.md R-013, this contract, and inline in the Swift source) because mismatched locale strings produce silent recognizer-unavailable failures that are tedious to debug.

---

## 6. Test coverage from the JS side

Although the Swift source has no Windows-runnable test, the JS-side bridge contract test (`test/unit/native/speech-recognition.test.ts`) covers the **boundary** by jest-mocking the native module:

- `bridge.isAvailable(locale)` returns the platform-appropriate boolean.
- `bridge.availableLocales()` returns the platform-appropriate array.
- `.android.ts` stub rejects every Promise method with `SpeechRecognitionNotSupported`; `isAvailable` returns `false`; `availableLocales` returns `[]`.
- `.web.ts` stub:
  - With `globalThis.webkitSpeechRecognition` mocked PRESENT: `isAvailable` returns `true`, `start` instantiates the mock and adapts its events to the `partial` / `final` / `error` channel, `stop` calls the mock's `stop()` method.
  - With the global mocked ABSENT: `isAvailable` returns `false`, every Promise method rejects with `SpeechRecognitionNotSupported`.
- iOS `start({ onDevice: true })` against a mocked native module that reports `supportsOnDeviceRecognition === false` rejects with `SpeechRecognitionNotSupported` (R-004 enforcement).
- The `events` emitter on the bridge module is `instanceof` the expected `EventEmitter` shape; subscriptions returned by `addListener` carry a `.remove()` method.

The test does NOT verify the contents of the audio buffer or the recognition result (those live in Swift / Apple's servers); it verifies the *shape* of what crosses the boundary is contract-conformant.

---

## 7. Reference

- JS contract: [`speech-bridge.contract.ts`](./speech-bridge.contract.ts)
- Plan: [`../plan.md`](../plan.md)
- Research: [`../research.md`](../research.md) (R-002, R-003, R-004, R-005, R-011, R-012, R-013)
- Data model: [`../data-model.md`](../data-model.md)
- Quickstart: [`../quickstart.md`](../quickstart.md)
- Apple Speech framework: <https://developer.apple.com/documentation/speech>
- `SFSpeechRecognizer`: <https://developer.apple.com/documentation/speech/sfspeechrecognizer>
- `SFSpeechAudioBufferRecognitionRequest`: <https://developer.apple.com/documentation/speech/sfspeechaudiobufferrecognitionrequest>
- `AVAudioEngine`: <https://developer.apple.com/documentation/avfaudio/avaudioengine>
- `AVAudioSession`: <https://developer.apple.com/documentation/avfaudio/avaudiosession>
- `expo-modules-core` `Module` DSL + Events: <https://docs.expo.dev/modules/module-api/>
