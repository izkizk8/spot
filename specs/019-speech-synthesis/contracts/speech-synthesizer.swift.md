# Phase 1 Contract — Native Swift Surface for `SpeechSynthesizer.swift`

**Feature**: 019 — Speech Synthesis
**File**: `native/ios/speech-synthesis/SpeechSynthesizer.swift`
**Wraps**: `AVSpeechSynthesizer`, `AVSpeechSynthesizerDelegate`, `AVSpeechSynthesisVoice`, `AVSpeechSynthesizer.requestPersonalVoiceAuthorization` (iOS 17+).
**Registration**: `expo-modules-core` `Module` DSL with name `"SpeechSynthesis"` (matched by `requireOptionalNativeModule<NativeSpeechSynthesis>('SpeechSynthesis')` in `src/native/speech-synthesis.ts`).
**Companion**: `SpeechSynthesis.podspec` declares the Pod (no extra `s.frameworks` — `AVFoundation` is implicitly linked by the iOS toolchain; mirrors feature 018's `SpeechRecognition.podspec`).

---

## 1. Module surface (JS-callable methods)

| Method | Signature (Swift) | Returns to JS | Notes |
|---|---|---|---|
| `availableVoices` | `() -> [[String: Any]]` | `Promise<Voice[]>` (resolved) | Enumerates `AVSpeechSynthesisVoice.speechVoices()`; maps each to the unified shape (see §2). Never rejects. |
| `speak` | `(args: [String: Any]) -> Void` | `Promise<void>` | Reads `text`, `voiceId?`, `rate`, `pitch`, `volume` from `args`. Clamps numerics to Apple ranges defensively. Constructs `AVSpeechUtterance(string: text)`, applies voice/rate/pitch/volume, calls `synthesizer.speak(utterance)`. Resolves immediately after enqueue (the lifecycle is event-driven via the delegate). |
| `pause` | `() -> Bool` | `Promise<void>` | Calls `synthesizer.pauseSpeaking(at: .immediate)`. iOS always supports pause; never rejects on iOS. |
| `continue` | `() -> Bool` | `Promise<void>` | Calls `synthesizer.continueSpeaking()`. Never rejects on iOS. |
| `stop` | `() -> Bool` | `Promise<void>` | Calls `synthesizer.stopSpeaking(at: .immediate)`. Idempotent; never rejects. |
| `isSpeaking` | `() -> Bool` | `boolean` (sync) | Returns `synthesizer.isSpeaking`. |
| `requestPersonalVoiceAuthorization` | `() -> Void` (with promise resolver) | `Promise<PersonalVoiceAuthorizationStatus>` | iOS < 17: resolves `'unsupported'` synchronously. iOS 17+: wraps `AVSpeechSynthesizer.requestPersonalVoiceAuthorization { status in resolve(map(status)) }`. Never rejects. |

Status mapping (iOS 17+):

| `AVSpeechSynthesizer.PersonalVoiceAuthorizationStatus` | JS string |
|---|---|
| `.notDetermined` | `'notDetermined'` |
| `.authorized` | `'authorized'` |
| `.denied` | `'denied'` |
| `.unsupported` | `'unsupported'` |

---

## 2. `Voice` shape returned to JS

Each entry of `availableVoices()` is a JS object with exactly these keys (typed in `synth-types.ts` as `Voice`):

```text
{
  id:              voice.identifier,                 // String
  name:            voice.name,                       // String
  language:        voice.language,                   // String (BCP-47, no humanization)
  quality:         "Default" | "Enhanced" | "Premium",  // mapped from AVSpeechSynthesisVoiceQuality
  isPersonalVoice: Bool                              // iOS 17+: voice.voiceTraits.contains(.isPersonalVoice); else false
}
```

Quality mapping:

| `AVSpeechSynthesisVoiceQuality` | JS string |
|---|---|
| `.default` | `'Default'` |
| `.enhanced` | `'Enhanced'` |
| `.premium` | `'Premium'` |

The `isPersonalVoice` field uses an `#available(iOS 17, *)` guard. On iOS < 17 the trait API is unavailable; the field defaults to `false`.

---

## 3. Delegate event surface (emitted to JS via `EventEmitter`)

The Swift module conforms to `AVSpeechSynthesizerDelegate` and emits one JS event per delegate callback:

| Delegate callback | Emitted JS event name | JS payload |
|---|---|---|
| `speechSynthesizer(_:didStart:)` | `didStart` | `{ utteranceId? }` (utteranceId reserved for future queueing) |
| `speechSynthesizer(_:didFinish:)` | `didFinish` | `{ utteranceId? }` |
| `speechSynthesizer(_:didPause:)` | `didPause` | `{ utteranceId? }` |
| `speechSynthesizer(_:didContinue:)` | `didContinue` | `{ utteranceId? }` |
| `speechSynthesizer(_:didCancel:)` | `didCancel` | `{ utteranceId? }` |
| `speechSynthesizer(_:willSpeakRangeOfSpeechString:utterance:)` | `willSpeakWord` | `{ range: { location: Int, length: Int }, fullText: String }` |

**Range conversion**: Apple's `NSRange` uses UTF-16 offsets. The Swift code MUST pass `range.location` and `range.length` directly (UTF-16) so the JS overlay's substring math (`text.substring(location, location+length)` — JS strings are also UTF-16) is byte-aligned. Documented in this contract as "UTF-16 offsets" so consumers (`TextInputArea` overlay) don't accidentally re-encode to UTF-8 byte offsets.

**Threading**: All delegate callbacks fire on the main thread; the bridge re-emits without thread-hopping.

**Lifecycle**: The delegate is set on the `AVSpeechSynthesizer` instance once at module-init time. No per-utterance subscribe/unsubscribe.

---

## 4. Constructor / lifecycle

- The module owns one `AVSpeechSynthesizer` instance for the lifetime of the JS process.
- The module conforms to `AVSpeechSynthesizerDelegate` and sets `synthesizer.delegate = self` once at init.
- No `AVAudioSession` configuration is performed — `AVSpeechSynthesizer` plays through the system route automatically. (Contrast: feature 018's `SpeechRecognizer.swift` configures the session for `.record`. 019 does not configure for `.playback` either — letting the OS route through whatever the user has active.)
- `D-10`: No background audio session category is set. Background/lock-screen audio is OS-defined.

---

## 5. Error handling

- `availableVoices`, `pause`, `continue`, `stop`, `isSpeaking`: never throw.
- `speak`: catches any exception thrown by `AVSpeechUtterance` construction or `synthesizer.speak()` and rejects the promise with a generic `'speak failed'` message; this never happens with documented Apple inputs but is defensive.
- `requestPersonalVoiceAuthorization`: never throws (the underlying API is callback-based, not throwing).

No native code path may surface an uncaught exception to JS — mirrors feature 018 NFR-006.

---

## 6. Permissions / Info.plist

**None.** See R-001 in `research.md`. This Swift file does NOT call any API that requires:

- `NSMicrophoneUsageDescription` (no microphone access)
- `NSSpeechRecognitionUsageDescription` (no `SFSpeechRecognizer`; that's feature 018)
- Any other Info.plist usage-description key
- Any entitlement
- Any App Group
- Any background mode

No Expo config plugin is shipped (D-01 / FR-040 / FR-041 / FR-042). The Swift file is autolinked by `expo-modules-core` via the `SpeechSynthesis.podspec` and the module is discoverable to JS via `requireOptionalNativeModule('SpeechSynthesis')` with no further operator action.

---

## 7. Test stance

The Swift source has **no Windows-runnable test**. Behavior is asserted manually via the on-device steps in `quickstart.md` (US-1 through US-6 from the spec map directly to numbered checks). The JS bridge contract (`speech-synthesis-bridge.contract.ts`) is unit-tested with a mocked `requireOptionalNativeModule` so the JS-side translation logic (event payload shape, error rejection mapping, isSpeaking snapshot) is fully covered without invoking Swift.
