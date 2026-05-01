# Feature Specification: Audio Recording + Playback Module

**Feature Branch**: `020-audio-recording`
**Feature Number**: 020
**Created**: 2026-04-28
**Status**: Draft
**Input**: User description: "iOS module showcasing audio recording (`AVAudioRecorder` / `AVAudioEngine`), playback (`AVAudioPlayer`), and audio session category management."

## Overview

The Audio Recording + Playback module ("Audio Lab") is a feature card in the iOS Showcase registry (label `"Audio Lab"`, `platforms: ['ios','android','web']`, `minIOS: '11.0'`). It demonstrates audio capture, on-device playback, and audio session category management on iOS, with parity behavior on Android and Web via `expo-audio` (the modern Expo audio package; `npx expo install expo-audio`). The module is **additive**: one new registry entry, a new module folder under `src/modules/audio-lab/`, a new config plugin under `plugins/with-audio-recording/` that idempotently adds `NSMicrophoneUsageDescription` to the iOS Info.plist, and a new AsyncStorage key (`spot.audio.recordings`). It coexists with feature 017's vision plugin without conflict.

The screen has three sections: a **Recorder** with a large pulsing record button, elapsed-time readout, live waveform meter, and a Low/Medium/High quality selector; a **Recordings list** of saved recordings with play/delete/share actions persisted to AsyncStorage; and an **Audio Session Category picker** that lets the user choose among Playback, Record, PlayAndRecord, Ambient, and SoloAmbient categories and apply them via `setAudioModeAsync`.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Record audio and review it in the recordings list (Priority: P1)

A user opens the Audio Lab card, grants microphone permission if prompted, taps the large record button, speaks for a few seconds (seeing elapsed time tick up and a live waveform meter respond to their voice), and taps stop. The new recording immediately appears in the Recordings list below with a timestamp-based name, its duration, and its file size on disk.

**Why this priority**: This is the core MVP. Without record→stop→list, there is no showcase value. Playback, sharing, deletion, quality selection, and session-category management all build on top of this loop.

**Independent Test**: Open the Audio Lab screen on iOS (or Android/Web), grant microphone permission, tap record, speak briefly, tap stop, and verify a new row appears in the Recordings list with a timestamp name, a non-zero duration, and a non-zero file size. Reload the screen and verify the row persists (loaded from AsyncStorage).

**Acceptance Scenarios**:

1. **Given** the user is on the Audio Lab screen with microphone permission granted and recorder idle, **When** they tap the record button, **Then** recording begins, the button visibly pulses (red dot), the elapsed-time readout starts incrementing in `HH:MM:SS` format, and the live waveform meter responds to input level.
2. **Given** recording is in progress, **When** the user taps the record/stop button, **Then** recording stops, the elapsed-time readout freezes briefly and the recording is appended to the Recordings list with a timestamp-based name, computed duration, and on-disk file size.
3. **Given** at least one recording has been saved, **When** the user fully reloads the screen (unmount + remount), **Then** the Recordings list re-hydrates from AsyncStorage key `spot.audio.recordings` and shows all previously saved recordings.
4. **Given** the user has not yet granted microphone permission, **When** they tap record, **Then** the permission prompt is requested via expo-audio's authorization API; on grant, recording proceeds; on denial, a non-blocking PermissionBanner explains the limitation and the record button is disabled.

---

### User Story 2 - Play back, delete, and share saved recordings (Priority: P2)

A user looks at the Recordings list and, for any row, taps **Play** to hear the recording, **Delete** to remove it, or **Share** to export it. Sharing uses `expo-sharing` when available; if not, it falls back to a Linking-based "copy file path" action.

**Why this priority**: A recorder without playback or sharing is half a feature. P2 because the file is already captured (P1) and the value is realized by listening to it or exporting it.

**Independent Test**: With one or more recordings present, tap **Play** on a row and verify audio is produced; tap again (or another row) and verify transport behaves correctly. Tap **Delete** and verify the row disappears and the AsyncStorage entry is removed. Tap **Share** and verify the share sheet opens (or the fallback copy-path action is invoked) with the recording file URI.

**Acceptance Scenarios**:

1. **Given** a row in the Recordings list, **When** the user taps **Play**, **Then** the recording plays through the device speaker/earpiece using `useAudioPlayer`, the row visually indicates "playing", and playback stops automatically when the file ends.
2. **Given** a recording is playing, **When** the user taps **Play** on a different row, **Then** the first recording stops and the new one starts (only one player active at a time).
3. **Given** a row, **When** the user taps **Delete**, **Then** the underlying file is removed from disk, the entry is removed from the AsyncStorage list, and the row disappears from the UI.
4. **Given** a row and `expo-sharing` is available, **When** the user taps **Share**, **Then** the platform share sheet opens with the recording file URI as the payload.
5. **Given** a row and `expo-sharing` is **not** available (e.g., Web or sharing denied), **When** the user taps **Share**, **Then** a fallback action runs that either copies the file path / blob URL to the clipboard or invokes `Linking` with the file URI; no exception is thrown.

---

### User Story 3 - Choose recording quality before capturing (Priority: P2)

Before tapping record, the user selects one of three quality presets — **Low**, **Medium**, **High** — from a segmented control. The next recording uses the corresponding sample-rate / bitrate / channel configuration. Existing recordings are unaffected.

**Why this priority**: Quality selection is a core demoable knob for an audio module and ships alongside the recorder UI. P2 because the recorder works (P1) at a default quality even if the user never touches the selector.

**Independent Test**: For each of Low / Medium / High, select the segment, record a short clip, stop, and verify the resulting file's reported duration and on-disk size differ in the expected direction (Low ≪ Medium ≪ High for the same spoken length).

**Acceptance Scenarios**:

1. **Given** the recorder is idle, **When** the user selects a quality segment, **Then** the segmented control reflects the selection and the next recording is configured with the corresponding `quality-presets.ts` mapping (sample rate, bitrate, channels).
2. **Given** recording is in progress, **When** the user attempts to change the quality segment, **Then** the change is deferred (control disabled) until recording stops; existing recordings are not altered.
3. **Given** the user has never opened the screen, **When** the screen first mounts, **Then** the default selected quality is **Medium**.

---

### User Story 4 - Manage the iOS audio session category (Priority: P3)

A user wants to switch how the app interacts with the rest of the device's audio. They open the Audio Session Card, read a brief explanation of each category, choose one of **Playback / Record / PlayAndRecord / Ambient / SoloAmbient** via a segmented control, and tap **Apply**. A status pill shows the currently active category.

**Why this priority**: Category management is the platform-education portion of the showcase and is independent of P1 capture. P3 because users get value from the recorder (P1) and the recordings list (P2) even without ever touching this card.

**Independent Test**: Open the Audio Session Card, select each of the five categories, tap Apply, and verify the status pill updates to reflect the new active category. Start recording, then attempt to switch category mid-record and verify recording is stopped first per FR.

**Acceptance Scenarios**:

1. **Given** the screen is open and recorder is idle, **When** the user selects a category and taps **Apply**, **Then** `setAudioModeAsync` is invoked with options that map to that category and the status pill updates to show the new active category.
2. **Given** recording is in progress, **When** the user taps **Apply** to change the category, **Then** the recorder is stopped first (the in-progress recording is finalized and saved per the normal Stop flow), and the new category is then applied.
3. **Given** the active category is `Record` or `PlayAndRecord`, **When** the user views the Audio Session Card, **Then** the explanation text and pill clearly indicate that microphone access is engaged.
4. **Given** the active category is `Playback`, **When** a saved recording is played, **Then** it plays even when the device is in silent (ringer) mode (i.e., `playsInSilentMode: true`).

---

### Edge Cases

- **Permission denied**: The PermissionBanner is shown and the record button is disabled; the rest of the screen (Recordings list, Audio Session Card) remains usable.
- **Permission revoked mid-session**: If the OS revokes microphone permission while the screen is open, the next record attempt re-requests; if denied, the banner re-appears.
- **No recordings yet**: The Recordings list shows an empty state ("No recordings yet — tap record to start.").
- **Duplicate timestamp names**: If two recordings somehow get the same timestamp (e.g., clock change), names are de-duplicated by appending a numeric suffix.
- **AsyncStorage corruption**: If `spot.audio.recordings` cannot be parsed as JSON, it is treated as empty and overwritten on the next save (no crash, no user-facing error other than a console warning).
- **File missing on disk**: If a recording row references a file that no longer exists on disk (e.g., user cleared app data), tapping Play surfaces a non-blocking error toast and the row is removed from the list.
- **Switching category mid-record**: Recording is finalized and saved before the new category is applied (see User Story 4 / FR-024).
- **Switching category mid-playback**: Playback is stopped before the new category is applied.
- **Web platform record limitations**: On the web, recording is constrained to formats supported by `MediaRecorder`; quality presets map to the closest supported configuration and the Audio Session Card categories degrade to no-ops with informational tooltips.
- **Background recording**: Background-mode recording is out of scope for v1 (no `UIBackgroundModes: audio` is added); if the app backgrounds while recording, OS behavior governs.
- **Very long recordings**: There is no enforced max duration in v1; the recorder runs until the user taps stop or the OS terminates the process.
- **Share unavailable on web with no clipboard API**: Falls back to a no-op with an info toast.

## Requirements *(mandatory)*

### Functional Requirements

#### Registry & Discovery

- **FR-001**: The module MUST register exactly one entry in the iOS Showcase registry (the 006 registry) with label `"Audio Lab"`, `platforms: ['ios','android','web']`, and `minIOS: '11.0'`.
- **FR-002**: The registry change MUST be additive (one inserted entry, no modification to existing entries).

#### Recorder UI

- **FR-003**: The screen MUST render a large record button that visually pulses (red dot) while recording is in progress and is static when idle.
- **FR-004**: The screen MUST render an elapsed-time readout in `HH:MM:SS` format that updates at least once per second while recording.
- **FR-005**: The screen MUST render a live waveform meter (vertical bars) driven by `metering` updates from `expo-audio` polled every 100 ms while recording is in progress; the meter MUST reuse the visual pattern established by feature 011's BarChart (but oriented vertically).
- **FR-006**: The screen MUST render a 3-segment quality selector with segments **Low / Medium / High** mapped via `quality-presets.ts` to sample rate, bitrate, and channel count.
- **FR-007**: The default quality on first mount MUST be **Medium**.
- **FR-008**: The quality selector MUST be disabled while recording is in progress; selection changes only take effect on the next record invocation.
- **FR-009**: When recording stops, the new recording MUST be persisted to disk and prepended (or appended — implementation chooses, but consistently) to the Recordings list state and AsyncStorage.

#### Recordings List

- **FR-010**: The Recordings list MUST render one row per saved recording showing: the timestamp-based name, the duration in `mm:ss` (or `hh:mm:ss` if ≥ 1 hour), and the file size in human-readable units (e.g., `1.2 MB`).
- **FR-011**: Each row MUST expose three actions: **Play**, **Delete**, **Share**.
- **FR-012**: **Play** MUST start playback via `useAudioPlayer` and stop any other currently-playing recording first (only one player active at a time).
- **FR-013**: **Delete** MUST remove the file from disk, remove the entry from the in-memory list, and remove the entry from AsyncStorage atomically.
- **FR-014**: **Share** MUST invoke `expo-sharing` if available; if `expo-sharing` is unavailable (e.g., on web or when the module is not installed), the action MUST fall back to a Linking-based copy-path action without throwing.
- **FR-015**: The Recordings list MUST persist to AsyncStorage under the key `spot.audio.recordings` and MUST re-hydrate on screen mount.
- **FR-016**: When the list is empty, an empty-state UI MUST be rendered ("No recordings yet — tap record to start.").
- **FR-017**: A row whose underlying file no longer exists on disk MUST be cleaned from the list on the next mount (and a console warning emitted).

#### Audio Session Card

- **FR-018**: The Audio Session Card MUST render an explanation paragraph that briefly describes each category (Playback, Record, PlayAndRecord, Ambient, SoloAmbient).
- **FR-019**: The card MUST render a 5-segment control (or equivalent picker) for the five categories listed above.
- **FR-020**: The card MUST render an **Apply** button that invokes `expo-audio`'s `setAudioModeAsync` with the options mapped to the selected category (e.g., `Playback → { allowsRecording: false, playsInSilentMode: true }`; `Record → { allowsRecording: true, playsInSilentMode: false }`; `PlayAndRecord → { allowsRecording: true, playsInSilentMode: true }`; `Ambient → { allowsRecording: false, playsInSilentMode: false, interruptionMode: 'mixWithOthers' }`; `SoloAmbient → { allowsRecording: false, playsInSilentMode: false, interruptionMode: 'duckOthers' }`). Exact option mapping is documented in `audio-session.ts` during plan phase.
- **FR-021**: The card MUST render a status pill showing the currently active category.
- **FR-022**: The default active category on first screen mount MUST be **PlayAndRecord** (so that both record and playback work without requiring the user to interact with this card first).
- **FR-023**: The selected category MUST be reflected in the segmented control on mount (i.e., the control is initialized to the active category, not always to the first segment).
- **FR-024**: If recording is in progress when the user taps **Apply** to switch category, the recorder MUST be stopped first (recording finalized and saved per the normal Stop flow), then the category MUST be applied.
- **FR-025**: If playback is in progress when the user taps **Apply** to switch category, playback MUST be stopped first, then the category MUST be applied.

#### Permissions & Permission Banner

- **FR-026**: Microphone permission MUST be requested via expo-audio's authorization API on first record attempt (lazy, not on screen mount).
- **FR-027**: When permission is denied or undetermined, a non-blocking `PermissionBanner` MUST be rendered above the recorder section explaining the limitation and offering a "Request permission" action.
- **FR-028**: When permission is denied, the record button MUST be disabled (with a tooltip / accessibility label explaining why); the rest of the screen MUST remain interactive (Recordings list playback, Delete, Share, Audio Session Card).

#### Hooks

- **FR-029**: The `useAudioRecorder` hook MUST expose `{ status, elapsedMs, meterLevel, quality, setQuality, start, stop, hasPermission, requestPermission }` and MUST internally manage the expo-audio recorder instance, metering polling at 100 ms, and elapsed-time tick.
- **FR-030**: The `useAudioPlayer` hook MUST expose `{ status, currentUri, positionMs, durationMs, play, pause, stop }` and MUST ensure that calling `play(uri)` while another recording is playing stops the previous one first.
- **FR-031**: Both hooks MUST clean up timers, subscriptions, and player/recorder instances on unmount with no warnings.

#### Recordings Store

- **FR-032**: `recordings-store.ts` MUST expose `loadRecordings()`, `saveRecording(record)`, `deleteRecording(id)`, and `clearRecordings()` and use AsyncStorage key `spot.audio.recordings`.
- **FR-033**: A `Recording` record persisted in the store MUST include: `id` (string), `name` (timestamp-based, e.g., `2026-04-28-14-37-12.m4a`), `uri` (string, file URI), `durationMs` (number), `sizeBytes` (number), `createdAt` (ISO 8601 string), `quality` (`'Low' | 'Medium' | 'High'`).
- **FR-034**: The store MUST handle JSON parse failures by treating storage as empty (no crash, console warning).

#### Quality Presets

- **FR-035**: `quality-presets.ts` MUST export three named presets — `LOW`, `MEDIUM`, `HIGH` — each mapping to a complete expo-audio recording configuration (sample rate, bitrate, channels, format). Suggested defaults (subject to implement-phase tuning): `LOW = { sampleRate: 22050, bitrate: 64000, channels: 1 }`; `MEDIUM = { sampleRate: 44100, bitrate: 128000, channels: 1 }`; `HIGH = { sampleRate: 48000, bitrate: 192000, channels: 2 }`. Format defaults to `aac` / `.m4a` on iOS+Android and the closest `MediaRecorder` mime on web.

#### Module Structure

- **FR-036**: The module MUST live under `src/modules/audio-lab/` with `index.tsx` (manifest), `screen.tsx` (iOS), `screen.android.tsx`, and `screen.web.tsx`.
- **FR-037**: Required components under `src/modules/audio-lab/components/`: `RecorderCard.tsx`, `WaveformMeter.tsx`, `RecordingsList.tsx`, `RecordingRow.tsx`, `AudioSessionCard.tsx`, `PermissionBanner.tsx`.
- **FR-038**: Required hooks under `src/modules/audio-lab/hooks/`: `useAudioRecorder.ts`, `useAudioPlayer.ts`.
- **FR-039**: Required support files under `src/modules/audio-lab/`: `recordings-store.ts`, `quality-presets.ts`, `audio-session.ts` (category-to-options mapping).

#### Plugin & Permissions

- **FR-040**: A new Expo config plugin MUST be added at `plugins/with-audio-recording/` that idempotently adds `NSMicrophoneUsageDescription` to the iOS Info.plist with a clear, user-facing string (e.g., `"Audio Lab uses the microphone to demonstrate recording and playback."`).
- **FR-041**: The plugin MUST be idempotent: running it multiple times MUST NOT duplicate the key, MUST NOT overwrite a pre-existing differing description (it preserves what's already there), and MUST coexist with feature 017's `with-vision` plugin without conflict.
- **FR-042**: The plugin MUST be registered in `app.json` `plugins` array (additive — one new entry, existing entries untouched).
- **FR-043**: The plugin MUST NOT add any Android permission entries (expo-audio handles `RECORD_AUDIO` via its own merge behavior at build time; if a project-specific manifest merge is needed it is captured in plan phase, not in this plugin).
- **FR-044**: The plugin MUST NOT add `UIBackgroundModes: audio` (background recording is explicitly out of scope per D-04).

#### Cross-Platform

- **FR-045**: The module MUST function on iOS, Android, and Web. The shared `screen.tsx` defines iOS behavior; `screen.android.tsx` and `screen.web.tsx` adapt where platform behavior diverges (e.g., the Audio Session Card on web renders categories as informational no-ops; recording on web uses the browser's `MediaRecorder` via `expo-audio`'s web implementation).
- **FR-046**: All three platforms MUST present the same JS API surface for the recorder/player hooks; platform-specific divergence is confined to the screen variants and to a small adapter layer in `audio-session.ts`.

#### Testing

- **FR-047**: All tests MUST be JS-pure under `test/unit/` and runnable via the project's standard `pnpm check` flow.
- **FR-048**: The test suite MUST include: hook tests for `useAudioRecorder` and `useAudioPlayer`; store tests for `recordings-store.ts`; presets tests for `quality-presets.ts`; component tests for each of the six components listed in FR-037; per-platform screen tests (`screen.test.tsx`, `screen.android.test.tsx`, `screen.web.test.tsx`); a plugin test for `plugins/with-audio-recording/` covering idempotency and coexistence with the 017 vision plugin; and a manifest test asserting the registry entry.
- **FR-049**: Test coverage and structure MUST match the standard set by prior modules in this showcase (notably 017, 018, 019).

#### Quality Gates

- **FR-050**: `pnpm check` MUST pass green (typecheck, lint, tests, format) after the feature is complete.
- **FR-051**: The feature MUST comply with Constitution v1.1.0.
- **FR-052**: The feature MUST be additive only — no breaking changes to existing modules, hooks, plugins, or registry entries.

### Key Entities

- **Recording**: A persisted audio capture. Attributes: `id` (string), `name` (timestamp-based, e.g., `2026-04-28-14-37-12.m4a`), `uri` (file URI on disk or blob URL on web), `durationMs` (number), `sizeBytes` (number), `createdAt` (ISO 8601 timestamp), `quality` (`Low | Medium | High`).
- **QualityPreset**: A named recorder configuration. Attributes: `name` (`Low | Medium | High`), `sampleRate` (Hz), `bitrate` (bps), `channels` (1 or 2), `format` (codec/container).
- **AudioSessionCategory**: One of `Playback | Record | PlayAndRecord | Ambient | SoloAmbient`. Each maps to a set of options passed to `setAudioModeAsync` (allowsRecording, playsInSilentMode, interruptionMode, etc.).
- **RecorderState**: `idle | requesting-permission | recording | stopping`.
- **PlayerState**: `idle | loading | playing | paused | stopped`.
- **PermissionStatus**: `undetermined | granted | denied`.
- **MeterFrame**: A snapshot from the recorder's metering output every 100 ms. Attributes: `level` (normalized 0–1 or dBFS), `timestampMs`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A first-time user can grant microphone permission and complete a record→stop→see-row-appear cycle within 10 seconds of opening the screen on iOS, Android, and Web.
- **SC-002**: While recording, the elapsed-time readout updates at least once per second and the live waveform meter updates at approximately 10 Hz (driven by 100 ms metering polls).
- **SC-003**: Tapping Play on a saved recording produces audible playback within 500 ms on iOS and Android, and within 1 second on Web.
- **SC-004**: Recordings persist across full screen reloads and across app cold-starts via AsyncStorage key `spot.audio.recordings`; no recording is lost across restarts unless the user explicitly deletes it.
- **SC-005**: For the same spoken duration, file size at quality `Low` is at least 30% smaller than `Medium`, and `High` is at least 30% larger than `Medium` (validating that quality presets actually differentiate).
- **SC-006**: Switching the audio session category to `Playback` allows saved recordings to play even when the device ringer is in silent mode.
- **SC-007**: Switching audio session category while recording is in progress finalizes and saves the in-progress recording (no recording is lost).
- **SC-008**: Sharing a recording opens the platform share sheet on iOS and Android; on web (or where `expo-sharing` is unavailable), the fallback action runs without throwing and conveys the file URI to the user.
- **SC-009**: The `with-audio-recording` plugin runs idempotently — applying it twice produces the same Info.plist as applying it once — and produces the same merged Info.plist whether applied before or after feature 017's `with-vision` plugin.
- **SC-010**: The feature ships with exactly one new permission entry on iOS (`NSMicrophoneUsageDescription`) and zero new permission entries on Android and Web that are not already provided by `expo-audio`'s own manifest merge.
- **SC-011**: `pnpm check` passes green on the feature branch with the new test suite included.

## Decisions

> Decisions made autonomously per the user's instruction to commit decisions directly into the spec without clarification questions. All assumptions are explicit and revisitable in plan/tasks.

- **D-01 (expo-audio over react-native-audio-recorder-player)**: Use the modern Expo `expo-audio` package across iOS, Android, and Web. It provides recorder + player + metering + `setAudioModeAsync` in a single dependency and matches the project's "use Expo first" convention. Add via `npx expo install expo-audio` during plan/implement.
- **D-02 (Default audio session category)**: On screen mount the active category defaults to **PlayAndRecord** so the user can both record and listen to playback without first interacting with the Audio Session Card. The previously selected category is **not** persisted across screen mounts in v1 (per D-08).
- **D-03 (Default quality)**: First-mount default quality is **Medium**. Not persisted across mounts in v1.
- **D-04 (No background audio)**: Background-mode recording is out of scope. The plugin does NOT add `UIBackgroundModes: audio`. If the app backgrounds during recording, OS-defined behavior governs.
- **D-05 (Single concurrent player)**: Only one recording can play at a time. Tapping Play on row B while row A is playing stops A first, then starts B.
- **D-06 (Sharing fallback)**: When `expo-sharing` is unavailable (web, missing module), the share action falls back to a Linking / clipboard-based copy-path action. It never throws.
- **D-07 (Storage key)**: AsyncStorage key is exactly `spot.audio.recordings`. Stored value is a JSON array of `Recording` records.
- **D-08 (No persistence of UI selection)**: Selected quality and selected audio session category are per-screen-session only. Persisting them is a v2 concern.
- **D-09 (Mid-record category change → stop first)**: Switching audio session category while recording or playing stops the in-progress operation first (recording finalized and saved per normal Stop flow), then applies the new category. This is a usability + correctness decision; it avoids leaving the recorder in an inconsistent state.
- **D-10 (Vertical waveform reuses 011's BarChart visual idiom)**: The live waveform meter reuses the visual pattern of feature 011's BarChart (bar widths, spacing, theming) but oriented vertically and driven by the recorder metering callback. No code is moved out of 011; the visual idiom is replicated in `WaveformMeter.tsx`.
- **D-11 (Plugin coexists with 017)**: `plugins/with-audio-recording/` is registered alongside `plugins/with-vision/` in `app.json`. Both are idempotent and additive at the Info.plist level (Vision adds `NSCameraUsageDescription`; Audio adds `NSMicrophoneUsageDescription`). If 017 has already added `NSMicrophoneUsageDescription` for any reason, the audio plugin preserves the existing string and does not overwrite it.
- **D-12 (Quality preset numbers)**: Suggested initial mapping — `LOW = 22050 Hz / 64 kbps / mono`, `MEDIUM = 44100 Hz / 128 kbps / mono`, `HIGH = 48000 Hz / 192 kbps / stereo`. Final values may be tuned in implement phase based on what `expo-audio` accepts on each platform; the three tiers MUST remain meaningfully distinguishable per SC-005.
- **D-13 (Recording filename format)**: Files are named by ISO-like timestamp `YYYY-MM-DD-HH-MM-SS.m4a` on iOS/Android. On web, the underlying URI is a blob URL but the displayed `name` follows the same timestamp format.
- **D-14 (Lazy permission)**: Microphone permission is requested on first record tap, not on screen mount. This avoids surprising the user with a system prompt as soon as they open the card.

## Assumptions

- **A-01**: The 006 registry entry mechanism (label + `platforms` + `minIOS`) used by features 007–019 is reused as-is. No registry-engine changes are required.
- **A-02**: `expo-audio` is not yet a project dependency and will be added during implement via `npx expo install expo-audio`. If it is already present, the implement phase reuses the existing version.
- **A-03**: `expo-sharing` may or may not already be a project dependency. The Share action checks for module availability at runtime and falls back gracefully if absent (D-06). If the implement phase decides to add it, that addition is in scope.
- **A-04**: AsyncStorage is already a project dependency used by prior modules. The `spot.audio.recordings` key does not collide with any existing key.
- **A-05**: Feature 017's `with-vision` plugin is the prior reference for plugin shape. The audio plugin mirrors that plugin's structure (config + tests) and may share helper utilities for Info.plist merging if any exist; otherwise it implements its own minimal idempotent merge.
- **A-06**: `NSMicrophoneUsageDescription` may or may not already exist in the Info.plist (e.g., if 017's plugin added it for any reason, or if `expo-audio` autolinking adds it). The audio plugin is designed to be a no-op in that case (preserves existing string).
- **A-07**: The native iOS APIs referenced in the user description (`AVAudioRecorder`, `AVAudioEngine`, `AVAudioPlayer`) are accessed indirectly through `expo-audio`. No bespoke Swift wrapper is added by this feature; the showcase value comes from the JS-visible API and the UI demo, not from a custom Swift module.
- **A-08**: Tests are JS-pure and run via the existing `pnpm check` pipeline. No XCUITest, no instrumented Android tests, and no native unit tests are added.
- **A-09**: The branch `020-audio-recording` is already checked out in this worktree (`C:\Users\izkizk8\spot-020-audio`). No new branch is created by the specify step.
- **A-10**: `expo-audio` provides a `metering` callback or polling mechanism that yields a normalized level value at least every 100 ms while recording. If the actual cadence differs slightly, the WaveformMeter polls or buffers as needed to render at ~10 Hz.
- **A-11**: The web implementation of `expo-audio` (or the underlying `MediaRecorder`) supports recording in a browser-supported codec (typically `audio/webm` or `audio/mp4`). Quality presets on web map to the closest supported configuration; exact mapping is finalized in implement.
- **A-12**: The user-facing microphone usage description string is written in English in v1; localization is out of scope.
