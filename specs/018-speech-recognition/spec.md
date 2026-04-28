# Feature Specification: Speech Recognition Module (SFSpeechRecognizer)

**Feature Branch**: `018-speech-recognition`
**Created**: 2026-04-28
**Status**: Draft
**Input**: User description: "Feature 018 — Speech Recognition module — an iOS-focused educational module that wraps Apple's `SFSpeechRecognizer` (with `SFSpeechAudioBufferRecognitionRequest` + `AVAudioEngine`) to demonstrate live mic-driven speech-to-text with selectable on-device vs server recognition modes, partial+final transcript streaming with per-word confidence shading, locale switching, and graceful cross-platform degradation (Android stub throws; web falls back to `webkitSpeechRecognition` when available)."

---

## ⚠️ Audio Session & Authorization Reality Check (READ FIRST)

`SFSpeechRecognizer` requires **two** distinct iOS authorizations: the speech-recognition permission (`NSSpeechRecognitionUsageDescription`) **and** the microphone permission (`NSMicrophoneUsageDescription`). Both prompts may surface on first use. Server (online) recognition additionally transmits audio to Apple servers — only on-device recognition is fully private; the UI must label the trade-off honestly.

The module also **claims the shared `AVAudioSession`** while listening. Other audio (background music, VoIP, other recording features) may be ducked, paused, or interrupted depending on the user's foreground app context. The screen surfaces a visible "Audio session active / inactive" indicator so this side effect is never silent.

**On-device verification is conditional on a real iOS device** running iOS 13+ (on-device mode requires `supportsOnDeviceRecognition`, which is per-locale and per-device). The simulator can run server recognition with a synthetic audio source but cannot reliably exercise live mic input. Windows-based development verifies only the JS-pure layer (hook with mocked event emitter, components, screen integration with mocked bridge, plugin Info.plist mutation, manifest).

This reality check is repeated in two additional locations: the module's `quickstart.md` and the Assumptions section below.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Live dictation with server recognition on iOS (Priority: P1)

A developer studying the spot iOS showcase opens the app on an iOS 13+ device, taps the "Speech Recognition" card from the Modules grid, and lands on the screen. The Authorization Status pill reads `notDetermined`; the developer taps the inline **Request** button and grants both speech-recognition and microphone permissions at the system prompts. The pill flips to `authorized`. The Recognition Mode segmented control is preselected to **Server** and the Locale picker is preselected to the system locale (e.g., `en-US`). The developer taps the large mic toggle button; the button begins an animated pulse, the Audio Session indicator turns to **active**, and as the developer speaks, partial transcript text begins appearing in the live transcript area within roughly one second. As phrases stabilize, partials are replaced by final segments; each rendered word is shaded by confidence (lighter shade = lower confidence). The developer taps the mic toggle again to stop; the pulse ends, the Audio Session indicator returns to **inactive**, and the final transcript remains visible. Tapping **Copy** writes the transcript to the system clipboard via `expo-clipboard`; tapping **Clear** empties the transcript area.

**Why this priority**: This is the MVP. It validates the full end-to-end pipeline this module exists to demonstrate: dual-permission acquisition (speech + mic) → audio engine startup → `SFSpeechRecognizer` with `SFSpeechAudioBufferRecognitionRequest` → bridge events streamed via `EventEmitter` → live React state update for partial + final transcripts → confidence-shaded rendering → audio session teardown on stop. Server mode is chosen as P1 because it has the broadest locale + device support (no `supportsOnDeviceRecognition` precondition) and is the most likely to "just work" on first try.

**Independent Test**: Build the app on an iOS 13+ device, open the Speech Recognition module, tap **Request** and grant both prompts, confirm Mode is **Server** and Locale is the system default, then tap the mic toggle and speak a short phrase ("the quick brown fox"). Verify (a) the mic button pulses while listening, (b) the Audio Session indicator reads **active**, (c) at least one partial transcript appears within ~1 second and is replaced by a final transcript within ~2 seconds of stopping, (d) words render with visible confidence shading, (e) tapping the mic toggle again stops listening, returns the indicator to **inactive**, and the final transcript persists, and (f) **Copy** places the transcript on the clipboard and **Clear** empties the area.

**Acceptance Scenarios**:

1. **Given** the screen is freshly mounted with `notDetermined` authorization, **When** the user taps **Request**, **Then** the OS surfaces the speech-recognition prompt followed (or preceded) by the microphone prompt, and on grant of both the Authorization Status pill MUST update to `authorized` without a screen reload.
2. **Given** authorization is `authorized`, Mode is **Server**, and Locale is the system default, **When** the user taps the mic toggle, **Then** the button pulse animation starts, the Audio Session indicator transitions to **active** within one render cycle, and the bridge `start({ locale, onDevice: false })` is invoked exactly once.
3. **Given** the user is currently listening, **When** the user speaks a recognizable phrase, **Then** at least one `partial` event arrives and updates the live transcript area within ~1 second, and at least one `final` event eventually replaces the partial with a finalized segment.
4. **Given** the user is currently listening, **When** the user taps the mic toggle a second time, **Then** the bridge `stop()` is invoked exactly once, the pulse animation stops, the Audio Session indicator transitions to **inactive** within one render cycle, and the final transcript remains visible in the transcript area.
5. **Given** a non-empty final transcript is visible, **When** the user taps **Copy**, **Then** `expo-clipboard.setStringAsync(transcript)` is invoked with the current final transcript text and a brief inline confirmation ("Copied") is shown.
6. **Given** a non-empty final transcript is visible, **When** the user taps **Clear**, **Then** the live transcript area becomes empty, the partial buffer is reset, and a subsequent **Copy** is a no-op (button disabled or copies an empty string — see FR-016).

---

### User Story 2 — On-device recognition (private mode) (Priority: P2)

The same developer switches the Recognition Mode segmented control from **Server** to **On-device**. If the currently selected locale supports on-device recognition on this device (`SFSpeechRecognizer.supportsOnDeviceRecognition` is true for that locale), the toggle takes effect immediately and the next `start` invocation passes `onDevice: true` to the bridge. If the locale does not support on-device recognition on this device, the **On-device** segment is rendered visually disabled with an inline tooltip / accessibility label "On-device recognition not available for this locale on this device" and the Mode remains **Server**. With on-device active, the developer speaks the same phrase and observes partial + final transcripts streaming with the same UX as Story 1 but with no network involvement.

**Why this priority**: Demonstrates the privacy-respecting branch of `SFSpeechRecognizer` and validates that the mode parameter is honored end-to-end. Secondary to Story 1 because it is gated by per-device, per-locale availability and may be unavailable on simulators / older devices.

**Independent Test**: With the app running on an iOS 13+ device that supports on-device recognition for `en-US` (modern iPhones do), open the Speech Recognition module, grant authorizations, switch Mode to **On-device**, tap the mic toggle, and speak a short phrase. Verify (a) the **On-device** segment is selected and not disabled, (b) `bridge.start` is invoked with `onDevice: true`, (c) partial and final transcripts appear with the same latency budget as Story 1 (within ~1 second for first partial), and (d) toggling Mode back to **Server** while listening either restarts the session in the new mode or surfaces an inline "Stop and restart to change mode" affordance — see FR-013.

**Acceptance Scenarios**:

1. **Given** authorization is `authorized` and the current locale supports on-device recognition on this device, **When** the user selects the **On-device** segment, **Then** the segment becomes selected and the next `bridge.start(...)` call passes `onDevice: true`.
2. **Given** the current locale does NOT support on-device recognition on this device, **When** the screen renders the Recognition Mode picker, **Then** the **On-device** segment is rendered visually disabled, its accessibility label is "On-device recognition not available for this locale on this device", and tapping it is a no-op (Mode remains **Server**).
3. **Given** the user is currently listening with Mode **On-device**, **When** an on-device recognition session emits partial and final events, **Then** the transcript area updates identically to Story 1 with no network traffic (verified by inspecting `bridge.start` was invoked with `onDevice: true`).
4. **Given** the user changes the Locale picker to a locale that does NOT support on-device recognition on this device while Mode is **On-device**, **When** the change is committed, **Then** Mode automatically falls back to **Server** and an inline message ("Switched to Server: on-device unavailable for {locale}") is displayed for ~3 seconds.

---

### User Story 3 — Locale switching (Priority: P2)

The developer taps the Locale picker, sees a list of the top 6 supported locales (`en-US`, `zh-CN`, `ja-JP`, `es-ES`, `fr-FR`, `de-DE`) with the system locale preselected, and selects `ja-JP`. If a session is currently active, it is stopped first; the next `start` uses the new locale. The developer speaks a Japanese phrase and observes partial + final transcripts in Japanese script.

**Why this priority**: Demonstrates that `SFSpeechRecognizer` is locale-parameterized and that the bridge surface honors the selection. Secondary because the mic + recognition pipeline (validated by Story 1) is the same machinery; locale only changes the recognizer instance.

**Independent Test**: With the app running and authorizations granted, tap the Locale picker, select `ja-JP`, tap the mic toggle, and speak a short Japanese phrase. Verify (a) the picker shows exactly 6 locales with the system locale preselected on first mount, (b) selecting a new locale while listening triggers a stop+start cycle (or an inline "Stop and restart" affordance per FR-013), and (c) partial and final transcripts render in Japanese script.

**Acceptance Scenarios**:

1. **Given** the screen mounts on a device whose system locale is `en-US`, **When** the Locale picker renders, **Then** exactly 6 locale options are displayed (`en-US`, `zh-CN`, `ja-JP`, `es-ES`, `fr-FR`, `de-DE`) with `en-US` preselected.
2. **Given** the screen mounts on a device whose system locale matches one of the top-6 list, **When** the picker renders, **Then** the system locale is preselected. If the system locale is NOT in the top-6 list, **Then** `en-US` is preselected (documented fallback).
3. **Given** the user is not currently listening, **When** the user selects a different locale, **Then** the selection is committed immediately and the next `start` invocation passes the new locale.
4. **Given** the user IS currently listening, **When** the user selects a different locale, **Then** the current session is stopped first, then a new session is started with the new locale within one event loop tick (FR-013 details the restart contract).
5. **Given** the user selects a locale for which `bridge.isAvailable(locale)` returns false, **When** the selection is committed, **Then** the picker shows an inline error ("Recognition not available for {locale} on this device"), Mode falls back to the previous valid locale, and no `start` is issued.

---

### User Story 4 — Authorization handling (denied, restricted, request flow) (Priority: P2)

A developer (or a returning user) opens the module on a device where speech-recognition or microphone authorization has been denied previously. The Authorization Status pill reads `denied` (or `restricted` if parental controls apply). The mic toggle button is rendered visually disabled. An inline message explains "Speech and microphone access required — open Settings to enable" with a deep link to the iOS Settings app (or a friendly fallback if the link cannot be opened). Tapping **Request** when status is `denied` or `restricted` is a no-op (the OS will not re-prompt) and is communicated via the same inline message.

**Why this priority**: Without this story the module would either crash or appear silently broken when permissions are unavailable. Required for a real module.

**Independent Test**: On an iOS device where speech-recognition has been denied in Settings, open the Speech Recognition module. Verify (a) the Authorization Status pill reads `denied`, (b) the mic toggle is visually disabled and tapping it is a no-op, (c) the inline message references opening Settings, and (d) tapping **Request** does not surface a system prompt (because the OS will not re-prompt after a deny) and instead reinforces the Settings affordance.

**Acceptance Scenarios**:

1. **Given** speech-recognition authorization is `denied`, **When** the screen mounts, **Then** the Authorization Status pill reads `denied`, the mic toggle is visually disabled, and the inline Settings affordance is displayed.
2. **Given** speech-recognition authorization is `restricted`, **When** the screen mounts, **Then** the pill reads `restricted` and the same disabled-toggle + inline affordance applies (parental controls / device management).
3. **Given** speech-recognition is `authorized` but microphone permission is `denied`, **When** the user taps the mic toggle, **Then** the bridge `start(...)` is NOT invoked, an inline error ("Microphone access required") is surfaced, and the Audio Session indicator remains **inactive**.
4. **Given** authorization is `notDetermined`, **When** the user taps **Request**, **Then** the bridge `requestAuthorization()` is invoked exactly once and the pill updates to reflect the resolved status.
5. **Given** any non-`authorized` status, **When** the screen renders, **Then** the **Request** button is visible only when status is `notDetermined`; for `denied` / `restricted` the button is replaced by the Settings affordance.

---

### User Story 5 — Cross-platform graceful degradation (Priority: P2)

A developer running the showcase on Android opens the Modules grid, taps the "Speech Recognition" card, and sees an inert version of the screen with a prominent "Speech Recognition is iOS-only on this build" banner; the mic toggle is disabled and tapping it surfaces a toast / inline message rather than throwing. On web, the developer sees the same screen but with one extra behavior: if the browser exposes `webkitSpeechRecognition` (Chromium-based browsers), the module wires up that API for partial/final transcript parity (server mode only — there is no on-device branch on the web), with the same UI and the same authorization model adapted to the browser's mic permission. If `webkitSpeechRecognition` is unavailable (e.g., Firefox), the screen falls back to the same iOS-only banner pattern.

**Why this priority**: The module is registered for `['ios','android','web']` to remain visible everywhere as an educational artifact; without this story the registry would either hide the module on non-iOS or crash on it. The web `webkitSpeechRecognition` fallback is a deliberate parity decision so the module is interactively demonstrable in Chromium browsers without an iOS device.

**Independent Test**: Run the app on Android (emulator or device) and verify the screen renders, the mic toggle is disabled, the iOS-only banner is shown, and zero JavaScript exceptions are thrown across the lifecycle. Run the app in Chromium-based desktop web and verify (a) the mic toggle is enabled, (b) tapping it requests browser mic permission and starts `webkitSpeechRecognition`, (c) partial and final transcripts appear in the transcript area, and (d) Mode is forced to **Server** with the **On-device** segment disabled. Run the app in Firefox web and verify the iOS-only banner is shown and the toggle is disabled.

**Acceptance Scenarios**:

1. **Given** the app is running on Android, **When** the user opens the Speech Recognition module, **Then** the screen renders with the mic toggle visually disabled, the "Speech Recognition is iOS-only on this build" banner is shown, and `bridge.start(...)` is not callable (it would throw `SpeechRecognitionNotSupported` if invoked).
2. **Given** the app is running on web in a browser that exposes `webkitSpeechRecognition`, **When** the user opens the module and grants browser mic permission, **Then** the screen renders with the mic toggle enabled, Mode is **Server** (and the **On-device** segment is disabled), and tapping the mic toggle starts a `webkitSpeechRecognition` session that drives the same partial/final transcript UI.
3. **Given** the app is running on web in a browser that does NOT expose `webkitSpeechRecognition`, **When** the user opens the module, **Then** the screen renders the iOS-only banner with the toggle disabled (same as Android).
4. **Given** the app is running on Android or on web without `webkitSpeechRecognition`, **When** any internal code path calls `bridge.isAvailable(...)`, **Then** it returns `false` synchronously without throwing.
5. **Given** the same context, **When** any other bridge method is invoked (e.g., `start`), **Then** it rejects with a typed `SpeechRecognitionNotSupported` error rather than crashing.

---

### Edge Cases

- **Authorization denied mid-session**: Cannot occur (OS never revokes mid-process), but if the bridge receives a permission error from the platform during `start`, it surfaces a typed `SpeechAuthorizationError`, the Audio Session indicator returns to **inactive**, and the pill re-reads the current authorization status.
- **Microphone busy / claimed by another app**: `start` rejects with `SpeechAudioEngineError`; the screen shows an inline error ("Microphone is in use — try again"); the mic toggle returns to its idle state.
- **Audio session interruption (incoming call, Siri)**: The active session is terminated by the OS; the bridge emits a final `error` event with `kind: 'interrupted'`; the screen captures any final transcript already received, stops the pulse, and returns the Audio Session indicator to **inactive**.
- **Locale change while listening**: Per FR-013, the current session is stopped, then restarted with the new locale within one event loop tick. The transcript area is NOT cleared automatically (history preserved); the user uses **Clear** to reset.
- **Mode toggle (Server ↔ On-device) while listening**: Same restart contract as locale change (FR-013).
- **`supportsOnDeviceRecognition` flips to false** (e.g., user changed locale to one not supported on-device): The Mode auto-falls back to **Server** with an inline message; existing on-device session is stopped and restarted in Server mode.
- **No speech detected for a long time**: `SFSpeechRecognizer` may end the session naturally with an empty result; the bridge emits a `final` event with empty `transcript` and the mic toggle returns to idle; no error is surfaced.
- **Network unavailable while in Server mode**: `start` may succeed but no partials arrive; the bridge surfaces a typed `SpeechNetworkError` after a reasonable timeout (default 10s of silence after `start`); the screen displays the error inline.
- **Very long dictation**: There is no hard cap in this module; the transcript area scrolls. `SFSpeechRecognizer` itself imposes a ~1 minute server-mode session limit which the bridge surfaces as a `final` event followed by automatic restart only if the user taps the mic toggle again (no auto-restart in this module).
- **Screen unmounts mid-session**: The hook's cleanup MUST call `bridge.stop()`, unsubscribe all event listeners, and tear down the audio session indicator state; no Jest warnings about state updates on unmounted components.
- **Backgrounding the app**: `SFSpeechRecognizer` continues briefly but the OS may suspend the audio session; the next event after foregrounding may be an `error` with `kind: 'interrupted'`. The hook handles this identically to other interruption errors.
- **`expo-clipboard` failure**: If `setStringAsync` rejects, the inline "Copied" confirmation is replaced by an inline "Copy failed" message for ~3 seconds; no exception leaks.
- **Coexistence with prior plugins**: The 018 config plugin must add `NSSpeechRecognitionUsageDescription` and `NSMicrophoneUsageDescription` to `Info.plist` if not already present (idempotent) and must not modify the targets, entitlements, or App Groups added by features 007 (Live Activities), 014 (Home Widgets), 015 (ScreenTime), 016 (CoreML Playground), or 017 (Camera Vision). The 017 plugin's `NSCameraUsageDescription` must be preserved untouched.

---

## Requirements *(mandatory)*

### Functional Requirements

#### Module Surface & Registration

- **FR-001**: The system MUST register a "Speech Recognition" module entry in `src/modules/registry.ts` with `platforms: ['ios','android','web']` and `minIOS: '10.0'`. This MUST be the only registry edit (a single import + array entry line).
- **FR-002**: The module MUST be discoverable from the 006 Modules grid and tappable to navigate into the showcase screen.
- **FR-003**: The module MUST provide three platform-specific screen entry files: `screen.tsx` (iOS default), `screen.android.tsx`, and `screen.web.tsx`, all under `src/modules/speech-recognition-lab/`.
- **FR-004**: The module manifest MUST live at `src/modules/speech-recognition-lab/index.tsx` and export the entry consumed by the 006 registry.

#### On-Screen UI Sections

- **FR-005**: The iOS screen MUST render the following elements in vertical order: the **Authorization Status** pill (with optional **Request** button), the **Audio Session Indicator** (active / inactive), the **Recognition Mode** segmented control (Server / On-device), the **Locale Picker** (top 6 locales), the **Live Transcript** area (scrollable; partials + finals with confidence shading), the **Mic Toggle** button (large, animated pulse while active), and the **Clear** + **Copy** action row.
- **FR-006**: The **Mic Toggle** button MUST be the visually dominant control. While listening, it MUST display a continuous animated pulse (subtle scale/opacity); while idle, it MUST be a static icon. Tapping it toggles between idle → listening → idle. Reduced-motion preferences MUST short-circuit the pulse to a static "active" indicator.
- **FR-007**: The **Recognition Mode** control MUST be a two-segment control (Server / On-device). The **On-device** segment MUST be rendered visually disabled when `bridge.isAvailable(locale)` returns true but the bridge reports the current locale does not support on-device recognition on this device; in that state the accessibility label MUST read "On-device recognition not available for this locale on this device".
- **FR-008**: The **Locale Picker** MUST display exactly the top 6 locales: `en-US`, `zh-CN`, `ja-JP`, `es-ES`, `fr-FR`, `de-DE`. The system locale MUST be preselected if present in this list; otherwise `en-US` is preselected as a documented fallback. Selection commits immediately and propagates to the next `start` call.
- **FR-009**: The **Live Transcript** area MUST render text in two visual layers: (a) finalized segments in the primary text color and (b) the current partial segment in a slightly muted color, appended after the finals. Each rendered word MUST be shaded by its confidence score: a word with confidence `c ∈ [0, 1]` is rendered with opacity `0.4 + 0.6 * c` (clamped). When confidence is unavailable (some events lack per-word confidence), opacity defaults to `1.0`.
- **FR-010**: The **Authorization Status Pill** MUST render one of four labels (`notDetermined`, `denied`, `restricted`, `authorized`) with appropriate color coding. The **Request** button MUST be visible only when status is `notDetermined`; for `denied` / `restricted`, the button is replaced by an inline Settings affordance ("Open Settings to enable").
- **FR-011**: The **Audio Session Indicator** MUST visually distinguish two states (**active** while a recognition session is running, **inactive** otherwise) and MUST update synchronously with the local listening state (no event-loop delay relative to the mic toggle).
- **FR-012**: On Android, the screen MUST render every section (pill, indicator, mode, locale, transcript, mic, actions) but with the mic toggle disabled and the "Speech Recognition is iOS-only on this build" banner across the top; no bridge calls beyond `bridge.isAvailable(...)` may be issued.
- **FR-013**: When the user changes Mode or Locale **while a session is active**, the screen MUST stop the current session via `bridge.stop()`, then start a new session with the new parameters within one event loop tick. The transcript area MUST NOT be cleared automatically; the partial buffer MUST be reset on restart.

#### Mic Action Row

- **FR-014**: The **Clear** button MUST empty both the partial and final transcript buffers and reset any inline confirmation messages. **Clear** MUST be enabled regardless of listening state (clearing while listening is allowed and does not stop the session).
- **FR-015**: The **Copy** button MUST invoke `expo-clipboard.setStringAsync(currentFinalTranscript)` and surface a brief inline confirmation ("Copied") for ~2 seconds. On rejection the confirmation is replaced by "Copy failed" for the same duration; no exception propagates.
- **FR-016**: When the final transcript is empty, the **Copy** button MUST be visually disabled and tapping it MUST be a no-op (no clipboard write, no confirmation).

#### Hook (`useSpeechSession`)

- **FR-017**: The module MUST expose a `useSpeechSession()` hook from `src/modules/speech-recognition-lab/hooks/useSpeechSession.ts`. The hook MUST return `{ partial, final, isListening, error, start, stop }` where:
  - `partial: string` — the latest partial transcript (replaced on every `partial` event).
  - `final: string` — the accumulated finalized transcript (appended to on every `final` event).
  - `isListening: boolean` — true between a successful `start(...)` and either `stop()` or a terminal `error` / `final` event that ends the session.
  - `error: SpeechRecognitionError | null` — the most recent typed error or null.
  - `start({ locale, onDevice }): Promise<void>` — wraps `bridge.start(...)` and subscribes to its events.
  - `stop(): Promise<void>` — wraps `bridge.stop()` and unsubscribes.
- **FR-018**: `useSpeechSession` MUST subscribe to the bridge's `EventEmitter` only between `start` and `stop`. On unmount the hook MUST call `stop()` (if `isListening`) and unsubscribe all listeners; no listener leaks.
- **FR-019**: The hook MUST be covered by JS-pure tests asserting: `start` subscribes and updates state on partial/final events, `stop` unsubscribes, error events update `error` and clear `isListening`, unmount mid-session triggers cleanup, and re-`start` after a terminal error works correctly.

#### Native Bridge Contract

- **FR-020**: The JS bridge `src/native/speech-recognition.ts` MUST expose the following methods with the listed signatures:
  - `requestAuthorization(): Promise<AuthStatus>` where `AuthStatus = 'notDetermined' | 'denied' | 'restricted' | 'authorized'`.
  - `getAuthorizationStatus(): Promise<AuthStatus>` (synchronous on iOS where possible; promise wrapper for cross-platform parity).
  - `isAvailable(locale: string): boolean` — synchronous; returns false on non-iOS unless a web fallback is wired.
  - `availableLocales(): string[]` — synchronous; returns the locales supported by the platform recognizer (used by `LocalePicker` to filter the top-6 list to those actually supported on the device).
  - `start({ locale: string; onDevice: boolean }): Promise<void>` — begins a streaming recognition session.
  - `stop(): Promise<void>` — terminates the active session.
  - `events: EventEmitter` — emits `partial`, `final`, and `error` events per `expo-modules-core` conventions.
- **FR-021**: Bridge `partial` events MUST carry `{ transcript: string; words?: { word: string; confidence: number }[] }`. `final` events MUST carry `{ transcript: string; words?: { word: string; confidence: number }[]; isFinal: true }`. `error` events MUST carry `{ kind: SpeechErrorKind; message: string }` where `SpeechErrorKind` is one of `'authorization' | 'audioEngine' | 'network' | 'interrupted' | 'unavailable' | 'unknown'`.
- **FR-022**: On Android, all bridge methods MUST be implemented as stubs in `src/native/speech-recognition.android.ts`. `isAvailable` returns false; `availableLocales` returns `[]`; all other methods (including `start`) MUST throw or reject with a typed `SpeechRecognitionNotSupported` error.
- **FR-023**: On web, `src/native/speech-recognition.web.ts` MUST implement the same surface using `webkitSpeechRecognition` when available. When `webkitSpeechRecognition` is unavailable, it MUST behave identically to the Android stub (throw `SpeechRecognitionNotSupported`). The web implementation MUST always report `onDevice: false` capability (the **On-device** segment is disabled on web).
- **FR-024**: The bridge MUST expose typed errors `SpeechRecognitionNotSupported`, `SpeechAuthorizationError`, `SpeechAudioEngineError`, `SpeechNetworkError`, and `SpeechInterrupted`; native failures MUST surface as one of these and MUST NOT propagate as uncaught promise rejections.

#### Native Implementation (iOS)

- **FR-025**: One Swift source `SpeechRecognizer.swift` MUST exist under `native/ios/speech-recognition/`. It MUST:
  - Wrap `SFSpeechRecognizer`, `SFSpeechAudioBufferRecognitionRequest`, and `AVAudioEngine` for live mic input.
  - Expose `requestAuthorization`, `getAuthorizationStatus`, `start`, `stop`, `isAvailable(locale:)`, and `availableLocales` to JS via `expo-modules-core`.
  - Configure the `AVAudioSession` for `record` (or `playAndRecord` per Apple guidance) before installing the audio engine tap, and deactivate the session on `stop` / on terminal events.
  - Honor the `onDevice` flag by setting `request.requiresOnDeviceRecognition = true` when requested AND when `recognizer.supportsOnDeviceRecognition` is true; reject with `SpeechRecognitionNotSupported` with a clear message when the caller requests on-device for an unsupported locale.
  - Stream `SFSpeechRecognitionResult` updates as `partial` events; emit a `final` event when `result.isFinal == true`.
  - Convert each `SFTranscriptionSegment`'s `confidence` to the JS `words[].confidence` field.
  - Wrap all entry points in `do/catch` and surface typed errors via `expo-modules-core`'s rejection mechanism plus the `error` event channel for mid-session failures.

#### Config Plugin

- **FR-026**: A config plugin at `plugins/with-speech-recognition/` MUST add both `NSSpeechRecognitionUsageDescription` and `NSMicrophoneUsageDescription` to the iOS `Info.plist` if not already present (with sensible default messages such as "Used to demonstrate live speech-to-text" and "Used to capture audio for live transcription"). The plugin MUST NOT overwrite existing values.
- **FR-027**: The plugin MUST be idempotent — running it multiple times produces the same result.
- **FR-028**: The 018 plugin MUST coexist with the 007, 014, 015, 016, and 017 plugins without modifying their targets, entitlements, App Groups, or existing `Info.plist` keys (including the `NSCameraUsageDescription` added by 017).
- **FR-029**: The plugin MUST be enabled by adding a single entry to `app.json`'s `plugins` array; no other `app.json` edits are required for this module.

#### Dependencies

- **FR-030**: The module MUST add `expo-clipboard` as a dependency via `npx expo install expo-clipboard`. No other new runtime dependencies are introduced.

#### Test Suite (JS-pure, Windows-runnable)

- **FR-031**: The following test files MUST exist and pass under `pnpm check`:
  - `hooks/useSpeechSession.test.tsx` — `start` subscribes to bridge events; `stop` unsubscribes; partial events update `partial`; final events append to `final` and reset `partial`; error events set `error` and clear `isListening`; unmount during an active session calls `stop` and unsubscribes; re-start after a terminal error works.
  - `components/MicButton.test.tsx` — renders idle vs listening visual states; pulse animation enabled when listening and not reduced-motion; `onPress` invoked on tap; disabled state honors `disabled` prop.
  - `components/TranscriptView.test.tsx` — renders finalized + partial layers; per-word opacity follows `0.4 + 0.6 * confidence` clamped; missing confidence defaults to opacity `1.0`; empty state renders a placeholder.
  - `components/LocalePicker.test.tsx` — renders exactly 6 locales; preselects system locale when present, otherwise `en-US`; `onLocaleChange` invoked on selection; disabled state honored.
  - `components/RecognitionModePicker.test.tsx` — renders Server + On-device segments; **On-device** disabled when `onDeviceAvailable={false}` with the documented accessibility label; `onModeChange` invoked on tap.
  - `components/AuthStatusPill.test.tsx` — renders one of four labels per `status` prop; **Request** button visible only when `status === 'notDetermined'`; Settings affordance visible for `denied` / `restricted`; `onRequestPress` invoked on tap.
  - `components/AudioSessionIndicator.test.tsx` — renders **active** vs **inactive** per `active` prop; reduced-motion respected if any indicator animation is used.
  - `screen.test.tsx`, `screen.android.test.tsx`, `screen.web.test.tsx` — integration with mocked `speech-recognition` bridge: iOS shows full UI, mic toggle drives `start`/`stop`, partial/final events update transcript, **Copy** invokes `expo-clipboard`, **Clear** empties; Android shows banner + disabled mic + zero `start` calls; web (with `webkitSpeechRecognition` mocked present) wires the fallback and drives the transcript; web (with `webkitSpeechRecognition` mocked absent) shows banner + disabled mic.
  - `native/speech-recognition.test.ts` — bridge contract: iOS path delegates to `expo-modules-core` module; web stub uses mocked `webkitSpeechRecognition` when present and throws `SpeechRecognitionNotSupported` when absent; android stub throws `SpeechRecognitionNotSupported` for `start`, returns `false` for `isAvailable`, returns `[]` for `availableLocales`.
  - `plugins/with-speech-recognition/index.test.ts` — adds both `NSSpeechRecognitionUsageDescription` and `NSMicrophoneUsageDescription` when missing; preserves existing values when present; idempotent across repeated invocations; does not modify 007 / 014 / 015 / 016 / 017 plugin fixtures (including the 017 `NSCameraUsageDescription` value).
  - `manifest.test.ts` — manifest valid; `minIOS = '10.0'`; `platforms` includes ios / android / web.

#### Quality Gates

- **FR-032**: `pnpm check` MUST be green (typecheck, lint, tests).
- **FR-033**: Constitution v1.0.1 MUST pass (cross-platform parity via graceful degradation banners + web fallback; no platform-specific imports leak into shared code).
- **FR-034**: Existing project conventions MUST be followed: `ThemedText` / `ThemedView`, `Spacing` scale, `StyleSheet.create()` only (no inline styles), path aliases (`@/`), TypeScript strict, `.web.ts` / `.android.ts` suffix-based platform splits.
- **FR-035**: The change set MUST be purely additive: only `src/modules/registry.ts` (1-line edit), `app.json` (1 plugin entry), and `package.json` / `pnpm-lock.yaml` (for `expo-clipboard`) may touch existing files. No edits to features 006–017.

### Non-Functional Requirements

- **NFR-001** (Latency): On a modern iOS device (A14 Bionic or newer) with a stable network in Server mode, the first `partial` event SHOULD arrive within 1 second of the first audible speech after `start`. In On-device mode, the first `partial` SHOULD arrive within 1.5 seconds.
- **NFR-002** (Responsiveness): Tapping the mic toggle MUST visibly change the button state (idle ↔ pulsing) within one render frame; the Audio Session indicator MUST update within one render frame of `start` resolving (or `stop` resolving).
- **NFR-003** (Resource cleanup): Unmounting the screen MUST stop any active session, deactivate the audio session, and unsubscribe all bridge listeners; no Jest warnings about state updates on unmounted components in the test suite.
- **NFR-004** (Accessibility): All controls MUST have accessible labels. The Authorization Status pill, Audio Session indicator, Recognition Mode picker, Locale picker, Mic toggle, Clear, and Copy MUST each expose role + state for screen readers. The "iOS-only" banner MUST be announced by screen readers on Android / web.
- **NFR-005** (Animation): The mic-toggle pulse SHOULD use `react-native-reanimated` (already in the project) for smoothness; reduced-motion preferences MUST short-circuit to a static active indicator.
- **NFR-006** (Robustness): No code path in the module may surface an uncaught JS exception or native crash for any combination of platform, authorization state, mode, or locale. All bridge errors MUST be typed and surfaced via the `error` channel of the hook.
- **NFR-007** (Privacy): The On-device mode MUST never transmit audio to remote servers. The Server-mode trade-off MUST be communicated via segment labels ("Server (online, more accurate)" / "On-device (faster, private)") so the user is never deceived.
- **NFR-008** (Maintainability): Adding a new locale to the top-6 picker in a follow-up MUST require only (a) extending the `LOCALES` constant in `LocalePicker` and (b) no other edits. Adding a new bridge event kind MUST require only (a) extending the `SpeechErrorKind` union, (b) adding the branch in `SpeechRecognizer.swift`, and (c) handling it in `useSpeechSession`.
- **NFR-009** (Repo size): The repository MUST NOT grow by more than ~250 KB as a result of this feature (Swift + JS sources + plugin + tests; no bundled media).

### Key Entities

- **AuthStatus**: `'notDetermined' | 'denied' | 'restricted' | 'authorized'`. The combined view of speech-recognition authorization (microphone authorization is tracked separately by `expo-camera` / system but surfaced through the same pill at the screen level when relevant).
- **RecognitionMode**: `'server' | 'on-device'`. The current recognition mode; maps to `onDevice: boolean` at the bridge boundary.
- **Locale**: BCP-47 string (e.g., `en-US`). Top-6 list: `en-US`, `zh-CN`, `ja-JP`, `es-ES`, `fr-FR`, `de-DE`.
- **WordToken**: `{ word: string; confidence: number }`. A single recognized word with its confidence score in `[0, 1]`. `confidence` may be omitted by some events; consumers default to `1.0`.
- **PartialEvent**: `{ transcript: string; words?: WordToken[] }`. The latest in-progress transcript.
- **FinalEvent**: `{ transcript: string; words?: WordToken[]; isFinal: true }`. A finalized segment of the transcript.
- **SpeechErrorKind**: `'authorization' | 'audioEngine' | 'network' | 'interrupted' | 'unavailable' | 'unknown'`.
- **SpeechRecognitionError**: `{ kind: SpeechErrorKind; message: string }`. The shape carried on the `error` channel.
- **SpeechSessionState**: in-memory hook state holding `partial`, `final`, `isListening`, and `error`.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A developer with the app installed on an iOS 13+ device can open the Speech Recognition module, grant authorizations, tap the mic toggle, and see the first partial transcript within 5 seconds of speaking — without changing any setting beyond the permission grants.
- **SC-002**: 100% of the JS-pure test suite (`useSpeechSession`, all components, all three screen variants, bridge stubs, config plugin, manifest) passes on Windows under `pnpm check`, with no native or device dependencies.
- **SC-003**: The module is purely additive: a `git diff` against `main` for files outside `specs/`, `plugins/with-speech-recognition/`, `native/ios/speech-recognition/`, `src/modules/speech-recognition-lab/`, and `src/native/speech-recognition*.ts` shows changes only in `src/modules/registry.ts` (≤ 2 lines), `app.json` (≤ 1 plugin entry), and `package.json` / `pnpm-lock.yaml` (for `expo-clipboard`).
- **SC-004**: On a modern iOS device (A14+) with the default `en-US` locale and Server mode, the first `partial` event arrives within 1 second of audible speech in 90% of consecutive 30-second sampling windows.
- **SC-005**: Running the app on Android shows the screen with the disabled mic toggle, the iOS-only banner, and zero JavaScript exceptions across the full screen lifecycle.
- **SC-006**: Running the app on web in a Chromium-based browser (with `webkitSpeechRecognition` available) allows the developer to start a recognition session, see partial + final transcripts, and Copy the result to the clipboard, with zero JavaScript exceptions across the full screen lifecycle.
- **SC-007**: Running the app on web in a non-Chromium browser (without `webkitSpeechRecognition`) shows the iOS-only banner and zero JavaScript exceptions.
- **SC-008**: The 018 config plugin runs idempotently: a second `expo prebuild` after the first produces no additional changes to `Info.plist` or to the iOS project file.
- **SC-009**: Enabling the 018 plugin alongside the 007, 014, 015, 016, and 017 plugins (in fixture tests) produces a project where `NSSpeechRecognitionUsageDescription` and `NSMicrophoneUsageDescription` are added without disturbing any existing extension/widget targets, entitlements, App Groups, or Info.plist keys (including the 017 `NSCameraUsageDescription`).
- **SC-010**: Unmounting the Speech Recognition screen during an active session stops the bridge within one event loop tick; no Jest warnings about state updates on unmounted components are produced by the test suite.
- **SC-011**: The total size of files contributed by this feature (Swift + JS sources + tests + plugin) is under 250 KB.

---

## Dependencies

- **Feature 006 (Modules registry)**: This feature consumes the registry contract and adds exactly one entry. No edits to 006 source.
- **`expo-clipboard`** (new dependency): Installed via `npx expo install expo-clipboard`. Provides `setStringAsync` for the **Copy** button.
- **`expo-modules-core`** (existing): Used by the Swift bridge for typed errors, the `EventEmitter` pattern for streaming partials/finals/errors, and JS↔native plumbing.
- **`react-native-reanimated`** (existing): Used by `MicButton` for the pulse animation.
- **Apple `Speech.framework`** (system): Provides `SFSpeechRecognizer`, `SFSpeechAudioBufferRecognitionRequest`, `SFTranscriptionSegment`. Linked into the iOS app target by the iOS toolchain (no explicit plugin link needed; framework is part of iOS SDK).
- **Apple `AVFoundation`** (system): Provides `AVAudioEngine`, `AVAudioSession` used by the Swift bridge for live mic capture.
- **Browser `webkitSpeechRecognition`** (web fallback): Optional runtime dependency. The web stub feature-detects and wires it when present; otherwise falls back to the iOS-only banner.
- **Features 007 / 014 / 015 / 016 / 017 plugins**: Co-resident on iOS. The 018 plugin must not modify their targets, entitlements, App Groups, or Info.plist keys (in particular the 017 `NSCameraUsageDescription`).

---

## Assumptions

- **Dual authorization model** *(repeated for prominence)*: `SFSpeechRecognizer` requires both speech-recognition authorization (`NSSpeechRecognitionUsageDescription`) and microphone authorization (`NSMicrophoneUsageDescription`). Both prompts may surface on first use; the screen surfaces the unified result via the Authorization Status pill (with microphone-specific errors surfaced inline as needed).
- **Audio session ownership**: While listening, the module claims the shared `AVAudioSession`. Side effects on other audio (background music, VoIP) are visible to the user via the Audio Session indicator. This is repeated in the Reality Check above.
- **iOS minimum version**: iOS 10.0 is the declared minimum for `SFSpeechRecognizer` (the API shipped in iOS 10). On-device recognition (`supportsOnDeviceRecognition`) requires iOS 13+ and is gated per-locale per-device; the **On-device** segment self-disables when unsupported.
- **Top-6 locale list**: `en-US`, `zh-CN`, `ja-JP`, `es-ES`, `fr-FR`, `de-DE` is a curated demonstrative subset, not an exhaustive list. The bridge's `availableLocales()` is exposed for future expansion but is not consumed by the Locale picker beyond filtering the top-6 list.
- **System-locale preselection fallback**: If the device's system locale is not in the top-6 list, `en-US` is preselected. This is the documented fallback.
- **Mode/locale change while listening**: The current session is stopped and restarted within one event loop tick; the transcript history is preserved (the user uses **Clear** to reset). No auto-restart on natural session end (e.g., the ~1 minute server-mode session limit) — the user must tap the mic toggle again.
- **Web fallback decision**: The web stub uses `webkitSpeechRecognition` when available for partial cross-platform parity. This is a deliberate decision to make the module interactively demonstrable in Chromium browsers without an iOS device. Firefox / non-Chromium browsers fall back to the iOS-only banner.
- **No on-device option on web**: The `webkitSpeechRecognition` web fallback does not expose an on-device path; Mode is forced to **Server** with the **On-device** segment disabled on web.
- **Swift sources are not unit-testable on Windows**: Swift is written, reviewed, and compiled on macOS or via EAS Build. JS-side mocks substitute for the native module in all Windows-runnable tests. On-device verification is a manual quickstart step.
- **No telemetry**: Transcripts, confidences, and timings are displayed in-process only; nothing is uploaded by this module (Server-mode recognition itself transmits audio to Apple's servers per `SFSpeechRecognizer`'s contract; that is Apple's data path, not this module's).
- **Single-line registry edit**: Adding the module to `src/modules/registry.ts` requires only one import statement and one entry in the modules array; this is the only edit to existing files outside `app.json` and `package.json`.
- **No bundled media**: This module ships zero binary assets. All audio inputs are live-captured by the user's microphone.

---

## Out of Scope

- Custom language models, vocabularies, or pronunciation hints (`SFSpeechLanguageModel`, contextual strings beyond defaults).
- Speaker diarization (who-said-what tagging).
- Punctuation toggling beyond `SFSpeechRecognizer`'s built-in behavior.
- Recording / persisting captured audio to disk or to the cloud.
- Sharing transcripts beyond the in-app **Copy** button (no share sheet, no deep links, no cloud sync).
- Translation of recognized text into other locales.
- Multi-locale simultaneous recognition (only one active locale at a time).
- File-based recognition (no `SFSpeechURLRecognitionRequest`); this module is mic-only.
- Background recognition (the screen must be foregrounded; no background audio entitlement is added).
- Wake-word / always-on listening.
- A full locale browser / search UI (the top-6 list is fixed).
- Analytics / metrics beyond what is rendered in-process on the screen.
- Modifications to features 006–017 (other than the single-line registry edit and the single `app.json` plugin entry).
