# Phase 0 — Research: Speech Recognition Module

All "NEEDS CLARIFICATION" items from the plan's Technical Context have been resolved below. Each entry follows the Decision / Rationale / Alternatives format.

---

## R-001 — Why `SFSpeechAudioBufferRecognitionRequest` + `AVAudioEngine` (live mic) over `SFSpeechURLRecognitionRequest` (file)

**Decision**: Drive recognition with `SFSpeechAudioBufferRecognitionRequest` fed by an `AVAudioEngine` input-node tap. Do not implement file-based recognition (`SFSpeechURLRecognitionRequest`). The module is mic-only.

**Rationale**:
- The user-visible value of this educational module is the **live dictation experience** — pulse animation, audio-session indicator, partial → final streaming. A file-based path would be a different module entirely (and is in the Out-of-Scope list of the spec).
- `SFSpeechAudioBufferRecognitionRequest` is the documented and supported pattern for streaming buffers from `AVAudioEngine.inputNode.installTap(...)`. The pairing is a 1-for-1 mapping between Apple's published guidance and this module's needs.
- File-based recognition would not require microphone authorization at all, which would defeat the purpose of demonstrating the **dual-authorization model** (FR-010 / Reality Check).

**Alternatives considered**:
- *`SFSpeechURLRecognitionRequest`*: Simpler from a permissions perspective (no microphone auth, no audio session) but does not deliver the live experience. Out of scope.
- *Recording to file then submitting*: A two-step UX with worse latency and an arbitrary file lifecycle. Strictly worse for the demo.

---

## R-002 — Audio session category, mode, and options

**Decision**: Activate `AVAudioSession.sharedInstance()` with `category = .record`, `mode = .measurement`, `options = [.duckOthers]` before installing the engine tap. Deactivate (`setActive(false, options: .notifyOthersOnDeactivation)`) on `stop` and on every terminal event (`final` with `isFinal == true`, any `error`).

**Rationale**:
- `.record` (rather than `.playAndRecord`) is sufficient because this module never plays audio — it only captures. Apple's guidance for speech recognition in foreground apps recommends `.record`.
- `.measurement` mode minimizes system audio processing (echo cancellation, automatic gain control) that would otherwise distort the buffers fed to `SFSpeechRecognizer`. Apple's `SFSpeechRecognizer` documentation explicitly recommends `.measurement` for streaming recognition.
- `.duckOthers` is the politest reasonable default: background music ducks rather than fully pauses, and the user is informed via the **Audio Session indicator** (FR-011) so the side effect is never silent. The Reality Check section of the spec re-states this.
- `notifyOthersOnDeactivation` lets other apps (e.g., a music player that ducked) restore their volume on `stop`. This is the documented Apple-recommended deactivation option for speech-recognition flows.

**Alternatives considered**:
- *`.playAndRecord`*: Reserves the speaker too. Unnecessary; silently steals more of the audio session than required.
- *No `.duckOthers`*: Either fully interrupts other audio (worse UX) or competes for the audio session and may fail to start. `.duckOthers` is the documented middle ground.
- *Leaving the session active across `stop`*: Would leak the side effect; the spec's "Audio Session indicator returns to inactive" assertion (US-1 acceptance scenario 4) requires deactivation.

---

## R-003 — Threading and `EventEmitter` delivery

**Decision**: `SFSpeechRecognizer` callbacks are invoked on its internal queue (typically a private background queue). The Swift bridge dispatches every `partial` / `final` / `error` emission **back to the JS bridge thread** via `expo-modules-core`'s `EventEmitter.send(...)`, which is thread-safe and marshals onto the JS thread before the listener is invoked. No explicit `DispatchQueue.main.async` from Swift is needed for emit; the JS layer always observes events on the JS thread.

**Rationale**:
- `expo-modules-core`'s `EventEmitter` is the established cross-platform-safe channel for streaming events (precedent: `expo-av`, `expo-sensors`, the project's own 015 ScreenTime bridge for change events).
- React state updates from the JS thread are the safe / supported path; pushing native-thread events directly into React state is a recipe for "state update on unmounted component" warnings and race conditions.
- The hook (`useSpeechSession`) layers an in-flight subscription token on top: every event handler checks that the subscription is still the current one before calling `setState`. This guarantees NFR-003 (no unmount-time warnings) under fast unmount/remount.

**Alternatives considered**:
- *Promise-per-event*: Would require an unbounded promise stream — not a thing. Unworkable.
- *Direct React Native bridge `RCTEventEmitter`*: Lower-level than the `expo-modules-core` `EventEmitter` DSL; reinvents a wheel the rest of the project already turns.
- *Polling*: Adds latency and defeats the streaming demo.

---

## R-004 — On-device vs Server mode toggle (`requiresOnDeviceRecognition`)

**Decision**: The Swift bridge sets `request.requiresOnDeviceRecognition = true` when `start` is invoked with `onDevice: true` AND `recognizer.supportsOnDeviceRecognition == true` for the requested locale. Otherwise, when the caller requests on-device for an unsupported locale, the bridge **rejects `start` with `SpeechRecognitionNotSupported`** carrying a message identifying the locale; it does NOT silently fall back to Server mode (silent fallback would defeat the Privacy guarantee — NFR-007).

**Rationale**:
- `supportsOnDeviceRecognition` is a per-recognizer, per-locale, per-device property in `SFSpeechRecognizer`; values can change with iOS updates and locale-pack downloads. The bridge is the only layer that can authoritatively check it for the live recognizer instance.
- Silent server-fallback would let audio leave the device when the user explicitly requested privacy. NFR-007 prohibits this. Rejecting `start` and surfacing the error allows the screen-level FR-007 self-disable / FR-002 acceptance-scenario auto-fallback (with the inline "Switched to Server: on-device unavailable" message — *user-initiated*, not silent) to be honored at the right layer.
- The screen-level RecognitionModePicker (FR-007) self-disables the **On-device** segment when it knows on-device is unavailable for the current locale, so the bridge-level rejection is a defense-in-depth check that should rarely fire in practice.

**Alternatives considered**:
- *Silent fallback to Server*: Rejected — violates NFR-007.
- *Probe `supportsOnDeviceRecognition` from JS only*: Possible, but the JS side would need to synchronously query the bridge for every locale change. Cleaner to centralize the check in Swift where the recognizer instance lives.
- *Pre-download on-device assets eagerly*: Out of scope; `SFSpeechRecognizer` manages its own on-device model lifecycle.

---

## R-005 — Plugin design: `Info.plist` only, no podspec framework declaration, no Xcode-project mutation

**Decision**: The 018 config plugin uses a single `withInfoPlist` mod to add `NSSpeechRecognitionUsageDescription` and `NSMicrophoneUsageDescription`. It does NOT declare framework dependencies on the bridge's podspec (or anywhere) because `Speech.framework` and `AVFoundation` are part of the iOS SDK and are linked into the app target by the iOS toolchain transparently — no `s.frameworks` line is required (in contrast to the 017 plugin, which explicitly links `Vision` because Vision is a separately declared system framework that the toolchain does not auto-link from a generic Swift import).

**Rationale**:
- `import Speech` and `import AVFoundation` in `SpeechRecognizer.swift` are sufficient on modern Xcode + iOS SDK to pull both frameworks into the link line. No additional declaration is needed.
- A `withInfoPlist`-only plugin is the **simplest possible** plugin shape. It is trivially idempotent (the conditional-set pattern: `config.modResults.NS… ??= "default"`), trivially diff-stable across runs, and trivially coexists with every other plugin in the project because it touches a disjoint set of Info.plist keys. The 017 `NSCameraUsageDescription` is in a different key — there is no overlap to worry about.
- The two-default-message pattern (one for speech, one for microphone) honors operator-supplied values: `??=` only writes when the value is `nil` / absent. Operators who want a custom message (App Store reviewers love these) supply it in `app.json`'s `ios.infoPlist` block; the plugin leaves it untouched.

**Alternatives considered**:
- *Declaring `s.frameworks = 'Speech', 'AVFoundation'` on the podspec*: Harmless but redundant. Adds noise to the podspec without changing the build outcome.
- *Mutating the Xcode project (`withXcodeProject`)*: Strictly more invasive; not needed; risks divergence under SDK upgrades.
- *Combining the two usage-description writes into a single `withInfoPlist` call*: Done. They share one mod (one config-modification step). Just two property writes in one closure.

---

## R-006 — Dual-permission UX: surfacing speech + microphone authorization through one pill

**Decision**: The **AuthStatusPill** displays the **speech-recognition** authorization status (`SFSpeechRecognizer.authorizationStatus()`). The microphone permission is queried separately at `start` time; if the system reports microphone-denied, `start` rejects with `SpeechAuthorizationError` (kind = `'authorization'`) and the screen surfaces an inline "Microphone access required" message **without** changing the pill (US-4 acceptance scenario 3).

**Rationale**:
- Two pills would clutter the UI and confuse users (the relationship between speech and mic auth is implementation-detail, not a user concept).
- The speech-recognition status is the gating one — without it, no `start` is meaningful. The microphone status only matters at `start` time and is best surfaced inline at that point with a specific actionable message.
- Apple's own Speech-framework demo apps follow the same single-status pattern with inline microphone surfacing.
- This split also keeps the pill layer JS-pure (no native call needed to render it once the initial status is fetched), which simplifies tests.

**Alternatives considered**:
- *Two pills (speech + mic)*: Rejected for UX reasons.
- *Combining into a single "permissions" status that aggregates both*: Hides which one is denied — bad for the user's recovery path.
- *Re-querying microphone status on every render*: Wasteful; only matters at `start` time.

---

## R-007 — `webkitSpeechRecognition` web fallback

**Decision**: `src/native/speech-recognition.web.ts` feature-detects `globalThis.webkitSpeechRecognition` (or the unprefixed `SpeechRecognition`, but Chromium ships only the prefixed name as of writing). When present, it instantiates a `webkitSpeechRecognition`, configures `continuous = true`, `interimResults = true`, sets `lang` from the `start` argument, and adapts its `onresult` / `onerror` / `onend` handlers to emit `partial` / `final` / `error` through a JS-side `EventEmitter` shim that mirrors the `expo-modules-core` `EventEmitter` interface. When absent (Firefox, Safari desktop in some configurations), every method except `isAvailable` (returns `false`) and `availableLocales` (returns `[]`) rejects with `SpeechRecognitionNotSupported`.

**Rationale**:
- The web fallback exists explicitly to make the module **interactively demonstrable on a developer workstation** without an iOS device (Story 5). Without it, the web build would always show the iOS-only banner — defensible but a degraded developer experience.
- `webkitSpeechRecognition` only supports server-side recognition (the requests go to Google's speech servers in Chromium). The web stub therefore reports `onDeviceAvailable = false` for every locale (the **On-device** segment self-disables on web — Story 5 acceptance scenario 2).
- Adapting to the same `EventEmitter` shape lets the `useSpeechSession` hook (and every component above it) be platform-agnostic. The web adapter is the only place that knows about browser APIs.
- Word-level confidence scores are NOT exposed by `webkitSpeechRecognition` (the API surfaces sentence-level `confidence` only on `final` results). The web emitter therefore omits the `words` field; `TranscriptView` falls back to opacity `1.0` per FR-009.

**Alternatives considered**:
- *Skip the web fallback entirely (banner only)*: Rejected — Story 5 explicitly requires the Chromium fallback, and the cost is one ~80-line file plus a test.
- *Polyfill `expo-modules-core` `EventEmitter` for web*: Done — the shim is local to `speech-recognition.web.ts` and exports the same minimal interface (`addListener`, `removeAllListeners`).
- *Use the `Web Speech API`'s synthesis surface*: Different API entirely (TTS, not STT). Not relevant.

---

## R-008 — Reanimated mic-button pulse pattern + reduced-motion handling

**Decision**: `MicButton` uses `useSharedValue` for `scale` (initial `1`) and `opacity` (initial `1`). When `listening && !reducedMotion`, an effect runs `scale.value = withRepeat(withTiming(1.12, { duration: 700 }), -1, true)` and `opacity.value = withRepeat(withTiming(0.7, { duration: 700 }), -1, true)`. When `listening && reducedMotion`, `scale.value = withTiming(1)` and `opacity.value = withTiming(1)`, and a static "active" ring is rendered as a non-animated `StyleSheet` overlay. When `!listening`, both shared values are reset to their initial values via `withTiming`.

**Rationale**:
- `withRepeat(..., -1, true)` is the documented Reanimated 3 pattern for a continuous reversing animation — runs entirely on the UI thread, no React renders between frames.
- The reduced-motion check uses Reanimated's built-in `useReducedMotion()` hook (preferred) or `AccessibilityInfo.isReduceMotionEnabled` polled once + `addEventListener` for changes (fallback). Either way, the result is a boolean that gates the pulse path.
- The static "active" ring under reduced motion ensures the user still has a visible "I am listening" affordance — the principle is "no motion ≠ no feedback".
- Tests assert the gating logic (animation enabled iff `listening && !reducedMotion`), not the animation curve itself (Reanimated worklets are not cleanly testable from JS-side Jest; this is the project-wide convention established by 017's overlay tests).

**Alternatives considered**:
- *RN `Animated` API*: Constitution prohibits it for new code (Technology Constraints).
- *CSS animation on web*: The web build uses the same React Native primitives; no separate web styling path.
- *No pulse, just a color swap*: Less expressive; the spec mandates a pulse (FR-006).

---

## R-009 — `expo-clipboard` over the alternatives

**Decision**: Add `expo-clipboard` via `npx expo install expo-clipboard` and use `setStringAsync(transcript)` for the **Copy** button. Wrap in try/catch; surface "Copy failed" inline on rejection (FR-015 / Edge case "`expo-clipboard` failure").

**Rationale**:
- `expo-clipboard` is the official Expo-managed clipboard surface; auto-resolved versioning via `npx expo install`; cross-platform (iOS / Android / web) with a single API.
- The alternatives (`@react-native-clipboard/clipboard`, browser `navigator.clipboard.writeText`) require platform-specific wrappers; `expo-clipboard` already does the platform split internally.
- `setStringAsync` returns a Promise that can reject (browser permission denied, native failure); FR-015 + the edge-case handler require this.

**Alternatives considered**:
- *`@react-native-clipboard/clipboard`*: Out-of-tree, not Expo-managed; requires a config plugin. Strictly more setup.
- *Browser `navigator.clipboard` directly on web*: Bypasses the iOS / Android paths; would require a `.web.ts` split that `expo-clipboard` already does for us.
- *`Clipboard` from `react-native`*: Deprecated.

---

## R-010 — Mode/locale-change-while-listening restart contract (FR-013)

**Decision**: When the user changes Mode or Locale while `isListening === true`, the hook performs `await bridge.stop(); await bridge.start({ locale: newLocale, onDevice: newOnDevice });` in a single async function scheduled on the next microtask (`Promise.resolve().then(...)` so it runs within one event-loop tick). The transcript history (the accumulated `final` string) is preserved; the partial buffer is reset on `start`. If the new locale is not supported (`bridge.isAvailable(newLocale) === false`) or on-device is requested but unavailable, the restart is aborted, the previous selection is restored in the picker, and an inline error is surfaced through the `error` channel.

**Rationale**:
- "Within one event-loop tick" (FR-013) is the user-perceptible contract. `await stop(); await start(...)` is the only correct ordering — `start` while a session is in flight on the same recognizer is undefined behavior.
- Preserving transcript history across a restart is the spec's choice (Edge case "Locale change while listening"). The user uses **Clear** to reset; this matches the principle that only the user resets their own data.
- Resetting the partial buffer on `start` matches the bridge contract: `partial` events from the new session are independent; carrying over a stale partial would mix locales / modes.
- The pre-flight `isAvailable` check prevents the `start` rejection path when we can avoid it; the rejection path is still wired (defense in depth) for the case where availability changes between the check and the call.

**Alternatives considered**:
- *Restart synchronously from the picker handler*: Cannot — `stop` is async.
- *Defer restart until the user re-taps the mic toggle*: Worse UX; the spec explicitly chose the auto-restart path (FR-013).
- *Clear transcript on restart*: Loses the user's data. Rejected per spec.

---

## R-011 — `SFSpeechRecognitionResult` → `partial` / `final` event mapping

**Decision**: On every `recognitionTask.publisher`-equivalent callback (the `(SFSpeechRecognitionResult?, Error?) -> Void` block), the bridge:
- If `error != nil`: emit one `error` event with the mapped `kind` (see R-012), do **not** emit `final`, and end the session.
- If `result != nil && result.isFinal`: emit one `final` event carrying `bestTranscription.formattedString` and the `bestTranscription.segments` mapped to `WordToken[]`.
- Otherwise (`result != nil && !result.isFinal`): emit one `partial` event with the same shape minus the `isFinal` flag.

The `WordToken[]` is built from `bestTranscription.segments`, mapping `segment.substring → word` and `segment.confidence → confidence`. When `confidence` is `0` (Apple's documented "not yet computed" sentinel for in-progress segments), it is **omitted** from the JS event so the FR-009 default-to-1.0 path is taken downstream.

**Rationale**:
- `bestTranscription` is the documented, supported "use this one" choice. `transcriptions` (the array of all candidates) is intentionally not exposed to keep the JS shape simple; multi-candidate exposure is out of scope.
- Treating `confidence == 0` as "absent" matches Apple's documented semantics and lets the JS layer's `0.4 + 0.6 * confidence` formula be applied honestly only to populated values.
- A single `final` event ends the session from the bridge's perspective; the hook then transitions `isListening` to `false` and the screen returns to idle state. This matches US-1 acceptance scenario 4.

**Alternatives considered**:
- *Expose `transcriptions[]` (all candidates)*: Out of scope; would clutter the JS API and the UI has no way to display alternatives.
- *Emit on every segment change rather than every result update*: `SFSpeechRecognitionResult` already coalesces; re-coalescing would be redundant.

---

## R-012 — Mapping `NSError` from `SFSpeechRecognizer` to `SpeechErrorKind`

**Decision**: The Swift bridge inspects every error surfaced by `SFSpeechRecognizer` / `AVAudioEngine` and maps it to one of the six `SpeechErrorKind` values:

| Source | Mapped `kind` |
|--------|---------------|
| `SFSpeechRecognizer.authorizationStatus() != .authorized` at start | `'authorization'` |
| `AVAudioSession.setCategory` / `setActive` / `engine.start()` failure | `'audioEngine'` |
| `NSError` with `domain == NSURLErrorDomain` or with the documented `kAFAssistantErrorDomain` server codes | `'network'` |
| `AVAudioSession.interruptionNotification` (incoming call, Siri) | `'interrupted'` |
| `recognizer == nil` or `recognizer.isAvailable == false` at start | `'unavailable'` |
| Any other thrown `Error` | `'unknown'` |

**Rationale**:
- The spec defines the six kinds (FR-021); the bridge owes the user a useful mapping rather than a single opaque `'unknown'` for everything.
- `'network'` specifically catches the Server-mode "no internet" case so the screen can surface the inline `SpeechNetworkError` message (Edge case "Network unavailable while in Server mode").
- `'interrupted'` is its own kind because the recovery story is different (the audio session is gone — needs reactivation, not just a retry). This drives the hook's distinct interrupted-cleanup path.
- The `'unknown'` bucket exists so the bridge never throws an *uncategorized* error (NFR-006). Future tuning can promote specific patterns out of `'unknown'` into typed kinds without breaking the contract.

**Alternatives considered**:
- *Pass raw `NSError` `userInfo` through to JS*: Leaks Apple-internal codes; brittle across iOS versions.
- *Single opaque `kind: 'error'`*: User cannot react meaningfully. Rejected per FR-021.
- *More kinds (e.g., separate `'mic-busy'`)*: Overkill; the inline message field carries the specific text already.

---

## R-013 — Locale picker top-6 selection + system-locale preselection fallback

**Decision**: `LOCALES = ['en-US', 'zh-CN', 'ja-JP', 'es-ES', 'fr-FR', 'de-DE']` is a constant in `LocalePicker.tsx`. On mount, the picker reads `Localization.locale` (from `expo-localization`, already a transitive dependency) and preselects it if present in `LOCALES`; otherwise preselects `'en-US'` as the documented fallback (FR-008, Assumption "System-locale preselection fallback"). The picker further filters `LOCALES` against `bridge.availableLocales()` so locales the recognizer cannot serve are visually disabled.

**Rationale**:
- A fixed top-6 list keeps the picker simple and reviewable. NFR-008 ensures expanding it later is a one-line change to `LOCALES`.
- The system-locale preselect is the most ergonomic default for the dominant single-user case; the `'en-US'` fallback is the documented "showcase default" for users whose system locale is outside the list.
- Filtering against `availableLocales()` prevents the user from selecting a locale the recognizer cannot actually load — defense in depth.

**Alternatives considered**:
- *Render every locale `availableLocales()` returns*: Hundreds of options; bad picker UX.
- *Sort by usage / popularity*: Out of scope; the fixed alphabetical-ish order is reviewable and stable.
- *Make the list configurable via app config*: Premature; the spec calls for exactly six.

---

## R-014 — Web `webkitSpeechRecognition` `EventEmitter` shim shape

**Decision**: The web adapter exports an object that satisfies the same minimal interface as `expo-modules-core`'s `EventEmitter`:

```ts
interface MinimalEventEmitter {
  addListener(eventName: string, listener: (event: unknown) => void): { remove(): void };
  removeAllListeners(eventName?: string): void;
}
```

The adapter maintains a `Map<string, Set<Listener>>` keyed by event name (`'partial' | 'final' | 'error'`) and dispatches synchronously when the underlying `webkitSpeechRecognition` instance fires the corresponding browser event. `addListener` returns a `Subscription`-shaped object with `.remove()` so the hook's unsubscribe code path is identical across platforms.

**Rationale**:
- A shim satisfies the *consumer* (the hook) without introducing a runtime dependency on `expo-modules-core` from a web-only file (which works but is gratuitous).
- The interface is intentionally minimal: `addListener` + `remove()` + `removeAllListeners` is everything the hook calls.
- Tests of the web stub mock `webkitSpeechRecognition` with a small fake that fires events synchronously, then assert that the shim relays them through the listener set.

**Alternatives considered**:
- *Importing `EventEmitter` from `expo-modules-core` in the `.web.ts` file*: Works but pulls in native-bridge plumbing the web build does not need.
- *Using the Node `EventEmitter`*: Different interface (`on` / `off` / `emit`); would force the hook to know about the difference.

---

## R-015 — Reduced-motion source: Reanimated `useReducedMotion()` vs `AccessibilityInfo`

**Decision**: Use Reanimated 3's `useReducedMotion()` hook in `MicButton.tsx`. This hook is already available because Reanimated is a project-wide dependency and the value is reactive (re-renders when the user toggles the preference in Settings, on iOS).

**Rationale**:
- `useReducedMotion()` is the documented Reanimated-native way to read the preference; it's a thin wrapper over `AccessibilityInfo.isReduceMotionEnabled` plus the change subscription.
- Using a single source (Reanimated's hook) avoids the bug class where a component reads via one API and an animation responds via another, falling out of sync.
- No new dependency. No platform split needed (the hook works on iOS, Android, web).

**Alternatives considered**:
- *`AccessibilityInfo.isReduceMotionEnabled` directly*: Verbose; same result.
- *Hardcoding `false` for tests*: Tests inject the value via a `jest.mock('react-native-reanimated', ...)` shim that returns the desired boolean.
