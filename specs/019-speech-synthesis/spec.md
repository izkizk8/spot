# Feature Specification: Speech Synthesis (AVSpeechSynthesizer / TTS)

**Feature Branch**: `019-speech-synthesis`
**Feature Number**: 019
**Created**: 2026-04-28
**Status**: Draft
**Input**: User description: "Speech Synthesis module — iOS-first text-to-speech showcase that also runs on Android (expo-speech) and Web (Web Speech API SpeechSynthesis). Multi-line text input, voice picker grouped by language with quality badges, segmented controls for rate/pitch/volume, transport buttons, highlighted-word display via willSpeakRangeOfSpeechString, and an iOS 17+ Personal Voice section."

## Overview

The Speech Synthesis module is a feature card in the iOS Showcase registry (label "Speech Synthesis", `platforms: ['ios','android','web']`, `minIOS: '7.0'`). It demonstrates Apple's `AVSpeechSynthesizer` API on iOS, with parity implementations using `expo-speech` on Android and the Web Speech API (`window.speechSynthesis`) on the web. The module is purely additive — it adds one entry to the registry, ships a new module folder under `src/modules/speech-synthesis-lab/`, and adds a Swift wrapper under `native/ios/speech-synthesis/`. **No app.json plugin is added and no Info.plist permission key is required** (see Decisions §D-01).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Speak text aloud with the default voice (Priority: P1)

A user opens the Speech Synthesis card, sees a multi-line text input pre-filled (or fills in their own text), taps **Speak**, and hears the device read it aloud using the platform's default TTS voice. They can **Pause**, **Continue**, and **Stop** the playback at any time.

**Why this priority**: This is the core MVP — without speak/pause/continue/stop, the showcase has no value. All other functionality (voice picker, sliders, highlighting, Personal Voice) layers on top of this.

**Independent Test**: Type or load a sample sentence, tap Speak, verify audio is produced; tap Pause and verify audio halts; tap Continue and verify audio resumes; tap Stop and verify audio terminates and transport returns to idle. Test passes on iOS, Android (via `expo-speech`), and Web (via `window.speechSynthesis`).

**Acceptance Scenarios**:

1. **Given** the user has the Speech Synthesis screen open with non-empty text and idle transport, **When** they tap **Speak**, **Then** synthesis begins and the transport state becomes `speaking`.
2. **Given** synthesis is in progress, **When** the user taps **Pause**, **Then** audio halts and transport state becomes `paused`.
3. **Given** transport is `paused`, **When** the user taps **Continue**, **Then** audio resumes from the paused position and transport returns to `speaking`.
4. **Given** synthesis is in progress or paused, **When** the user taps **Stop**, **Then** audio terminates immediately and transport returns to `idle`.
5. **Given** synthesis completes naturally (end of text reached), **When** the final word is spoken, **Then** transport returns to `idle` without user action.
6. **Given** the text input is empty, **When** the user taps **Speak**, **Then** the button is disabled (or no-op) and no synthesis occurs.

---

### User Story 2 - Pick a voice grouped by language (Priority: P2)

A user wants to hear the text spoken in a specific voice. They open the voice picker, see voices grouped by BCP-47 language tag (en-US, zh-CN, ja-JP, etc.), each row labeled with the voice's display name and a quality badge (**Default** / **Enhanced** / **Premium**). They select a voice, return to the screen, tap **Speak**, and hear the chosen voice.

**Why this priority**: Voice selection is the most prominent differentiating feature of TTS. Quality badges showcase Apple's premium voice tiers. Grouping by language demonstrates multi-locale support and aligns with the trilingual sample texts.

**Independent Test**: Open the voice picker, verify voices are grouped under language headings, verify each row shows name + quality badge, select a non-default voice, return to screen, tap Speak, and verify the selected voice is used (audible difference and/or selected voice id reflected in the bridge call).

**Acceptance Scenarios**:

1. **Given** the voice picker is open, **When** voices load, **Then** they are grouped into sections by BCP-47 language tag and sorted alphabetically by name within each section.
2. **Given** a row in the picker, **When** the user views it, **Then** they see the voice's display name and a badge labeled `Default`, `Enhanced`, or `Premium` reflecting its quality tier.
3. **Given** the user selects a voice, **When** they return to the main screen, **Then** the selected voice is shown as active and used for the next **Speak** invocation.
4. **Given** the platform reports no installed voices for a language, **When** the picker renders, **Then** that language section is omitted (no empty headers).
5. **Given** Personal Voices are authorized on iOS 17+, **When** the picker renders, **Then** a "Personal Voice" section appears at the **top** of the list above all language sections.

---

### User Story 3 - Adjust rate, pitch, and volume via segmented controls (Priority: P2)

A user wants to change how the text sounds. They tap one of three segmented controls — **Rate** (Slow / Normal / Fast), **Pitch** (Low / Normal / High), **Volume** (Low / Normal / High) — and tap **Speak** to hear the change.

**Why this priority**: Rate/pitch/volume are core demoable TTS parameters. Using the project's existing 3-segment control style (instead of continuous sliders) keeps the showcase visually consistent with prior modules.

**Independent Test**: For each of Rate, Pitch, Volume: select each of the three segments, tap Speak, and verify the corresponding parameter is forwarded to the native bridge with the documented mapped value.

**Acceptance Scenarios**:

1. **Given** the user selects **Rate = Slow**, **When** they tap Speak, **Then** the bridge receives `rate ≈ 0.4` (within AVSpeech's 0.0–1.0 range).
2. **Given** the user selects **Rate = Normal**, **When** they tap Speak, **Then** the bridge receives `rate ≈ 0.5`.
3. **Given** the user selects **Rate = Fast**, **When** they tap Speak, **Then** the bridge receives `rate ≈ 0.6`.
4. **Given** the user selects **Pitch = Low / Normal / High**, **When** they tap Speak, **Then** the bridge receives a pitch value within AVSpeech's 0.5–2.0 range corresponding to the documented mapping.
5. **Given** the user selects **Volume = Low / Normal / High**, **When** they tap Speak, **Then** the bridge receives a volume value within AVSpeech's 0.0–1.0 range corresponding to the documented mapping.
6. **Given** the user changes a control while synthesis is in progress, **When** the change occurs, **Then** the new value takes effect on the **next** Speak invocation (current utterance is not retroactively modified).

---

### User Story 4 - Quick-fill from sample text presets (Priority: P3)

A user wants to demo TTS in multiple languages quickly. They tap one of three sample-text presets — **English**, **Chinese**, **Japanese** — and the text input is populated with the corresponding canned sentence.

**Why this priority**: Demos are dramatically faster when the user doesn't have to type or paste multilingual text. Showcases the locale grouping in the voice picker too.

**Independent Test**: Tap each preset chip and verify the input area updates to the corresponding sample sentence.

**Acceptance Scenarios**:

1. **Given** the screen is open, **When** the user taps the **English** preset, **Then** the input area is set to "The quick brown fox jumps over the lazy dog."
2. **Given** the screen is open, **When** the user taps the **Chinese** preset, **Then** the input area is set to a canned Simplified Chinese sentence (see Assumptions §A-02).
3. **Given** the screen is open, **When** the user taps the **Japanese** preset, **Then** the input area is set to a canned Japanese sentence (see Assumptions §A-02).
4. **Given** the user has manually edited the input, **When** they tap a preset, **Then** the preset overwrites their text without confirmation (presets are quick-fills, not append).

---

### User Story 5 - See the current word highlighted while speaking (Priority: P3)

While synthesis is in progress, the word currently being spoken is visually highlighted within the text input area, advancing in sync with playback. Highlighting clears when synthesis pauses, stops, or finishes.

**Why this priority**: This is the marquee "wow" feature of `AVSpeechSynthesizerDelegate.willSpeakRangeOfSpeechString`. It's not required for basic TTS, but it elevates the showcase from "functional" to "polished."

**Independent Test**: Tap Speak on a multi-word sample, observe the highlight overlay advance word-by-word in time with the audio. On pause the highlight freezes; on stop it clears; on finish it clears.

**Acceptance Scenarios**:

1. **Given** synthesis is in progress, **When** the native delegate fires `willSpeakRangeOfSpeechString` for a word, **Then** the corresponding character range in the text input area is visually highlighted.
2. **Given** the user taps **Pause**, **Then** the highlight remains on the most recently spoken word until **Continue** advances it or **Stop** clears it.
3. **Given** the user taps **Stop** or synthesis finishes naturally, **Then** the highlight clears within one render frame.
4. **Given** the platform does not support per-word boundary callbacks (e.g., some Web Speech API implementations or Android voices), **When** synthesis runs, **Then** the screen still functions and the highlight feature is gracefully omitted (no error).

---

### User Story 6 - Request and use Personal Voice (iOS 17+ only) (Priority: P3)

On iOS 17 or later, a user can tap **Request Personal Voice authorization**. iOS prompts them; the status pill updates to reflect the granted/denied state. When authorized, any Personal Voices the user has created appear at the top of the voice picker in a dedicated "Personal Voice" section.

**Why this priority**: Personal Voice is a flagship iOS 17 accessibility feature. It requires explicit user authorization and only works on iOS 17+, so it's gated and surfaced only where supported. Independent of P1 transport.

**Independent Test**: On iOS 17+, tap the authorization button; verify the status pill transitions through `notDetermined → authorized` (or `denied`); when authorized, verify Personal Voices appear at the top of the voice picker. On iOS < 17, Android, and Web, verify the Personal Voice section is not rendered.

**Acceptance Scenarios**:

1. **Given** the device runs iOS 17+ and authorization is `notDetermined`, **When** the user taps **Request Personal Voice authorization**, **Then** the system permission prompt appears and the status pill updates to reflect the user's choice.
2. **Given** authorization is granted on iOS 17+, **When** the voice picker renders, **Then** a "Personal Voice" section appears above all language-grouped sections containing each authorized Personal Voice flagged with `isPersonalVoice: true`.
3. **Given** authorization is denied or restricted, **When** the picker renders, **Then** the Personal Voice section is omitted but a status pill on the main screen still shows the current state.
4. **Given** the device runs iOS < 17, Android, or Web, **When** the screen renders, **Then** the entire `PersonalVoiceCard` component is not rendered.

---

### Edge Cases

- **Empty text**: Speak button is disabled or no-op when the input is empty/whitespace-only.
- **Mid-utterance text edit**: Editing the text input while speaking does not retroactively change the current utterance; the next Speak call uses the new text.
- **Voice uninstalled mid-session**: If a previously selected voice is no longer reported by `availableVoices()`, the screen falls back to the platform default and shows a transient indicator.
- **No voices available**: If the platform returns zero voices, the picker shows an empty-state message and Speak still works using the platform default voice.
- **Web boundary events absent**: Some browsers do not fire `boundary` events for `SpeechSynthesisUtterance`; the highlight feature degrades gracefully (no highlight, no error).
- **Android `expo-speech` lacks pause/continue on some OEMs**: If pause/continue is unsupported, the buttons are disabled and a tooltip explains the limitation.
- **Authorization race**: Tapping the Personal Voice button repeatedly while a request is in flight is debounced.
- **Background/lock screen**: Synthesis behavior in background is platform-defined and out of scope for v1; if the app backgrounds mid-utterance the OS handles it.
- **Locale tag mismatch**: Voices are grouped by BCP-47 tag exactly as reported by the OS (e.g., `en-US` and `en-GB` are separate sections).

## Requirements *(mandatory)*

### Functional Requirements

#### Registry & Discovery

- **FR-001**: The module MUST register exactly one entry in the iOS Showcase registry with label `"Speech Synthesis"`, `platforms: ['ios','android','web']`, and `minIOS: '7.0'`.
- **FR-002**: The registry change MUST be additive (one inserted line, no modifications to existing entries).

#### Text Input & Sample Presets

- **FR-003**: The screen MUST render a multi-line text input that the user can edit freely.
- **FR-004**: The screen MUST expose three quick-fill preset chips/buttons: **English**, **Chinese**, **Japanese**, each replacing the input contents on tap.
- **FR-005**: The English preset MUST be exactly `"The quick brown fox jumps over the lazy dog."`.
- **FR-006**: The Chinese preset MUST be a Simplified Chinese sentence and the Japanese preset MUST be a Japanese sentence (exact strings defined in `sample-texts.ts` and tested in `sample-texts.test.ts`).

#### Voice Picker

- **FR-007**: The voice picker MUST list voices returned by the native bridge, grouped into sections by BCP-47 language tag.
- **FR-008**: Each voice row MUST show the voice's display name and a quality badge labeled `Default`, `Enhanced`, or `Premium`.
- **FR-009**: When at least one Personal Voice is authorized (iOS 17+), the picker MUST render a "Personal Voice" section above all language sections.
- **FR-010**: Selecting a voice MUST persist the selection for the duration of the screen session and forward `voiceId` on the next `speak` call.
- **FR-011**: If the previously selected voice is no longer present in `availableVoices()`, the screen MUST fall back to the platform default voice on the next Speak call.

#### Rate / Pitch / Volume Controls

- **FR-012**: The screen MUST render a 3-segment Rate control with segments **Slow / Normal / Fast** mapped to AVSpeech rate values approximately `0.4 / 0.5 / 0.6` respectively.
- **FR-013**: The screen MUST render a 3-segment Pitch control with segments **Low / Normal / High** mapped within the AVSpeech pitch range `0.5–2.0` (exact mapping documented in `research.md` during plan phase; default mapping `0.75 / 1.0 / 1.5`).
- **FR-014**: The screen MUST render a 3-segment Volume control with segments **Low / Normal / High** mapped within the AVSpeech volume range `0.0–1.0` (default mapping `0.3 / 0.7 / 1.0`).
- **FR-015**: All three controls MUST use the project's existing 3-segment control component for visual consistency with prior modules.
- **FR-016**: Changing a control mid-utterance MUST NOT retroactively alter the current utterance; the new value applies to the next Speak invocation.
- **FR-017**: The Android (`expo-speech`) and Web (`SpeechSynthesisUtterance`) implementations MUST translate the same logical rate/pitch/volume values into each platform's own ranges (mapping documented in research.md).

#### Transport Controls

- **FR-018**: The screen MUST expose four transport buttons: **Speak**, **Pause**, **Continue**, **Stop**.
- **FR-019**: Button enablement MUST reflect transport state: `idle → Speak`; `speaking → Pause, Stop`; `paused → Continue, Stop`.
- **FR-020**: Tapping Speak with empty/whitespace text MUST be a no-op (button disabled).
- **FR-021**: On platforms where pause/continue is unsupported (e.g., some Android OEMs via `expo-speech`), the affected buttons MUST be disabled and not error.

#### Highlighted-Word Display

- **FR-022**: While synthesis is in progress on iOS, the screen MUST highlight the word at the character range reported by `AVSpeechSynthesizerDelegate.speechSynthesizer(_:willSpeakRangeOfSpeechString:utterance:)`.
- **FR-023**: The highlight MUST clear within one render frame on `didFinish`, `didCancel`, or transport reset.
- **FR-024**: If a platform does not provide word-boundary callbacks (e.g., some Web Speech API implementations or some Android voices), the screen MUST function normally without highlighting and MUST NOT raise an error.

#### Personal Voice (iOS 17+ only)

- **FR-025**: The `PersonalVoiceCard` component MUST render only on iOS 17 or later; on iOS < 17, Android, and Web it MUST NOT mount.
- **FR-026**: The card MUST expose a **Request Personal Voice authorization** button and a status pill showing one of: `notDetermined`, `authorized`, `denied`, `unsupported`.
- **FR-027**: Tapping the request button MUST invoke the native bridge method `requestPersonalVoiceAuthorization()` and update the pill on completion.
- **FR-028**: When authorization is `authorized`, voices marked `isPersonalVoice: true` MUST appear in the dedicated "Personal Voice" section at the top of the picker.

#### Native Bridge

- **FR-029**: The native iOS module at `native/ios/speech-synthesis/SpeechSynthesizer.swift` MUST wrap `AVSpeechSynthesizer` and `AVSpeechSynthesizerDelegate` and expose the following methods to JS: `availableVoices(): [Voice]`, `speak({text, voiceId, rate, pitch, volume})`, `pause()`, `continue()`, `stop()`, `isSpeaking()`, `requestPersonalVoiceAuthorization()`.
- **FR-030**: `requestPersonalVoiceAuthorization()` MUST be a no-op returning `unsupported` on iOS < 17, and MUST call `AVSpeechSynthesizer.requestPersonalVoiceAuthorization` on iOS 17+.
- **FR-031**: The native module MUST emit the following events to JS: `didStart`, `didFinish`, `didPause`, `didContinue`, `didCancel`, `willSpeakWord({range, fullText})`.
- **FR-032**: Each `Voice` returned by `availableVoices()` MUST include: `id` (string), `name` (string), `language` (BCP-47 string), `quality` (`'Default' | 'Enhanced' | 'Premium'`), `isPersonalVoice` (boolean).

#### Cross-Platform Implementation

- **FR-033**: The TS surface at `src/native/speech-synthesis.ts` MUST be platform-stub-resolved via `.web.ts` and `.android.ts` companions.
- **FR-034**: The Android stub MUST use `expo-speech` for actual TTS.
- **FR-035**: The Web stub MUST use `window.speechSynthesis` (Web Speech API) for actual TTS.
- **FR-036**: All three platforms MUST present the same JS API shape (methods, event names, payloads) so the screen and hook code is identical across platforms.

#### Hook & Module Structure

- **FR-037**: The `useSynthesisSession` hook MUST expose `{ status, currentWordRange, voices, speak, pause, continue, stop, requestPersonalVoice }` and MUST subscribe/unsubscribe to bridge events on mount/unmount.
- **FR-038**: The module MUST live under `src/modules/speech-synthesis-lab/` and follow the same `index.tsx` (manifest) + `screen.tsx` / `screen.android.tsx` / `screen.web.tsx` pattern as prior modules.
- **FR-039**: Required components: `TextInputArea.tsx`, `VoicePicker.tsx`, `RateControl.tsx`, `PitchControl.tsx`, `VolumeControl.tsx`, `TransportControls.tsx`, `PersonalVoiceCard.tsx`.

#### Plugin & Permissions

- **FR-040**: The feature MUST NOT add any Expo config plugin (no `plugins/with-speech-synthesis/`).
- **FR-041**: The feature MUST NOT add any Info.plist permission key (e.g., NSSpeechRecognitionUsageDescription is **not** required for AVSpeechSynthesizer or for Personal Voice authorization).
- **FR-042**: The feature MUST NOT modify `app.json`.

#### Testing

- **FR-043**: All tests MUST be JS-pure under `test/unit/` and runnable via the project's standard `pnpm check` flow.
- **FR-044**: The test suite MUST include: hook test, component test for each component listed in FR-039, sample-texts test, screen integration test for ios/android/web variants, native bridge contract test (mocked), and manifest test.
- **FR-045**: Test coverage MUST match the standard set by prior modules in this showcase (e.g., 018-speech-recognition).

#### Quality Gates

- **FR-046**: `pnpm check` MUST pass green (typecheck, lint, tests, format) after the feature is complete.
- **FR-047**: The feature MUST comply with Constitution v1.1.0.

### Key Entities

- **Voice**: A TTS voice the device can use. Attributes: `id` (opaque platform identifier), `name` (human-readable), `language` (BCP-47 tag like `en-US`), `quality` (`Default | Enhanced | Premium`), `isPersonalVoice` (boolean, iOS 17+ only).
- **Utterance**: An in-flight or queued speech request. Attributes: `text`, `voiceId`, `rate`, `pitch`, `volume`. Implicit: lifecycle (`idle → speaking ⇄ paused → idle`).
- **WordBoundaryEvent**: A delegate event fired before each word. Attributes: `range` (character offset + length within the utterance text), `fullText` (the utterance string).
- **PersonalVoiceAuthorizationStatus**: `notDetermined | authorized | denied | unsupported`.
- **TransportState**: `idle | speaking | paused`.
- **RatePreset / PitchPreset / VolumePreset**: 3-value enums (`Slow|Normal|Fast`, `Low|Normal|High`, `Low|Normal|High`) with documented numeric mappings.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A first-time user can tap **Speak** and hear audio within 3 seconds of opening the screen on iOS, Android, and Web.
- **SC-002**: Pause / Continue / Stop respond within 200 ms of the user tap on all three platforms.
- **SC-003**: On iOS, the highlighted-word overlay advances in sync with audio with no perceptible lag (delegate-driven, frame-aligned) for utterances of at least 50 words.
- **SC-004**: The voice picker correctly groups and labels voices for at least three locales (en-US, zh-CN, ja-JP) on a stock iOS device with default voice packs.
- **SC-005**: Quality badges accurately reflect the voice's `AVSpeechSynthesisVoiceQuality` (Default / Enhanced / Premium) on iOS.
- **SC-006**: On iOS 17+, requesting Personal Voice authorization surfaces the system prompt and the status pill reflects the user's choice within 1 second of completion.
- **SC-007**: The feature ships with zero new app permissions and zero `app.json` modifications.
- **SC-008**: `pnpm check` passes green on the feature branch with the new test suite included.
- **SC-009**: The Web variant produces audible speech using `window.speechSynthesis` in current Chromium and Safari without additional permissions.
- **SC-010**: The Android variant produces audible speech via `expo-speech` and gracefully disables pause/continue if the OEM does not support them.

## Decisions

> Decisions made autonomously per the user's instruction to commit decisions directly into the spec without clarification questions. All assumptions are explicit and revisitable in plan/tasks.

- **D-01 (No plugin, no Info.plist key)**: We will NOT create `plugins/with-speech-synthesis/` and will NOT add any Info.plist permission key. Rationale: `AVSpeechSynthesizer` requires no Info.plist permission, and `AVSpeechSynthesizer.requestPersonalVoiceAuthorization` (iOS 17+) does not require `NSSpeechRecognitionUsageDescription` (that key is for `SFSpeechRecognizer`, a different API used by feature 018). Net change to `app.json`: zero.
- **D-02 (Segmented controls over continuous sliders)**: Rate, Pitch, and Volume use the project's existing 3-segment control style for visual consistency with prior modules, even though continuous sliders would arguably better demo TTS. Trade-off acknowledged; revisit only if user research demands.
- **D-03 (Rate mapping)**: Slow=0.4, Normal=0.5, Fast=0.6 in AVSpeech's 0.0–1.0 range. (`AVSpeechUtteranceDefaultSpeechRate` is `0.5`.) Documented in research.md during plan phase.
- **D-04 (Pitch mapping)**: Low=0.75, Normal=1.0, High=1.5 within AVSpeech's 0.5–2.0 range. Default value documented in research.md.
- **D-05 (Volume mapping)**: Low=0.3, Normal=0.7, High=1.0 within AVSpeech's 0.0–1.0 range.
- **D-06 (Web TTS via Web Speech API)**: The `.web.ts` stub uses real `window.speechSynthesis` (not a no-op stub). This is a cross-platform parity win and well-supported in modern browsers.
- **D-07 (Android TTS via expo-speech)**: The `.android.ts` stub uses `expo-speech` for real TTS. Add `expo-speech` to dependencies during plan/implement if not already present.
- **D-08 (Personal Voice gating)**: `PersonalVoiceCard` is conditionally mounted only on iOS 17+. On iOS < 17, Android, and Web the component is not rendered at all (not just hidden). The native `requestPersonalVoiceAuthorization()` returns `unsupported` on iOS < 17 as a safety net.
- **D-09 (No persistence)**: Voice/rate/pitch/volume selections are per-screen-session only; no AsyncStorage or other persistence in v1.
- **D-10 (No background audio)**: Background/lock-screen audio behavior is OS-defined and out of scope for v1; the module does not configure an audio session category for background playback.
- **D-11 (Word highlighting iOS-first)**: Word-boundary highlighting is implemented on iOS via the delegate. Web and Android use the same UI overlay only when the platform fires comparable boundary events; otherwise the overlay is silently disabled.
- **D-12 (Voice grouping by BCP-47 tag)**: Voices are grouped by the OS-reported BCP-47 language tag exactly (e.g., en-US and en-GB are separate sections). No language-name humanization in v1 (e.g., the section header is `en-US`, not "English (United States)").

## Assumptions

- **A-01**: The project's existing 3-segment control component is reusable as-is for Rate / Pitch / Volume. If it requires extension, that work is in scope for the plan/implement phase but does not change this spec.
- **A-02**: Exact Chinese and Japanese sample-text strings are chosen during the implement phase and locked in `sample-texts.ts` + `sample-texts.test.ts`. The Chinese sample will be Simplified Chinese (zh-CN). Suggested defaults (subject to revision in implement): Chinese — `"敏捷的棕色狐狸跳过了懒狗。"`; Japanese — `"素早い茶色の狐が怠け者の犬を飛び越えます。"`.
- **A-03**: `expo-speech` is the chosen Android TTS library. If it is not already a dependency, the plan/implement phase will add it.
- **A-04**: The native Swift wrapper integrates with the project's existing Expo Modules / native bridge harness used by sibling features (notably 018-speech-recognition). The exact bridging mechanism is captured during plan phase.
- **A-05**: All tests are JS-pure (no XCUITest, no native unit tests in this feature). Native code is exercised indirectly via mocked bridge contract tests.
- **A-06**: `minIOS: '7.0'` is set in the registry for parity with prior cards even though `AVSpeechSynthesizer` shipped in iOS 7. Personal Voice features are runtime-gated separately at iOS 17+.
- **A-07**: The user is familiar with prior modules' structure (manifest + screen + screen.android + screen.web + components + hooks + tests) and expects this module to mirror that layout exactly.
- **A-08**: No analytics, no telemetry, and no network calls are added by this feature.
- **A-09**: The branch `019-speech-synthesis` is already checked out in the worktree `C:\Users\izkizk8\spot-019-speech-synth` (branched from `018-speech-recognition`). No new branch is created by this command.
