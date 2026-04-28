---
description: "Dependency-ordered task list for feature 020 — Audio Recording + Playback Module (`audio-lab`)"
---

# Tasks: Audio Recording + Playback Module (`audio-lab`)

**Input**: Design documents from `/specs/020-audio-recording/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/audio-bridge.contract.ts, contracts/audio-session-mapping.md, quickstart.md

**Tests**: REQUIRED. Constitution Principle V + plan.md Phase 1 mandate JS-pure tests for `audio-types`, `quality-presets`, `audio-session`, `recordings-store`, both hooks (`useAudioRecorder`, `useAudioPlayer`) with mocked `expo-audio`/`expo-sharing`/`expo-file-system`/`@react-native-async-storage/async-storage`, every component (6 total), every screen variant (3 total), the manifest, and the new `with-audio-recording` plugin (idempotency + coexistence with 017 + 018).

**Organization**: Tasks are grouped by user story so each story can be implemented, tested, and demoed independently. Within each story, tests precede implementation (TDD: RED → GREEN → REFACTOR).

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Different file, no ordering dependency on any incomplete task — safe to run in parallel.
- **[Story]**: User story tag (US1 / US2 / US3 / US4). Setup, Foundational, and Polish phases carry no story tag.
- Every task lists the **exact** file path it touches and references the FR / NFR / SC / D / R IDs it satisfies.

## Path Conventions

Paths are relative to the repository root (`C:\Users\izkizk8\spot-020-audio\`). The feature touches:

- `src/modules/audio-lab/` — JS module (manifest + 3 screen variants + 2 hooks + 6 components + audio-types + quality-presets + audio-session + recordings-store)
- `plugins/with-audio-recording/` — Expo config plugin (`NSMicrophoneUsageDescription`, idempotent, coexists with 017/018)
- `test/unit/modules/audio-lab/`, `test/unit/plugins/with-audio-recording/` — Jest tests
- `src/modules/registry.ts`, `package.json`, `pnpm-lock.yaml`, `app.json` — single-line additive edits (FR-002 / FR-042 / FR-052)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Branch verification, install `expo-audio` (and `expo-sharing` if absent), wire the new Expo config plugin into `app.json`, and create the directory skeleton expected by every later phase.

- [ ] T001 Verify on branch `020-audio-recording` (`git rev-parse --abbrev-ref HEAD`) and the working tree is clean except for `specs/020-audio-recording/` (FR-002, FR-052)
- [ ] T002 Install `expo-audio` via the SDK-aligned installer: run `npx expo install expo-audio` from the repo root; verify `package.json` and `pnpm-lock.yaml` updated; record the resolved version in the commit message and append it to `specs/020-audio-recording/research.md` §R-001 (R-001, FR-035)
- [ ] T003 Check whether `expo-sharing` is already in `package.json`; if absent, install via `npx expo install expo-sharing`; record the resolved version in the commit message and append to `specs/020-audio-recording/research.md` §R-002 (R-002, FR-014, D-06)
- [ ] T004 [P] Create directories `src/modules/audio-lab/`, `src/modules/audio-lab/hooks/`, and `src/modules/audio-lab/components/` (FR-037, FR-039)
- [ ] T005 [P] Create plugin directory `plugins/with-audio-recording/` (sibling of `plugins/with-vision/` and `plugins/with-speech-recognition/`) (FR-040, R-006)
- [ ] T006 [P] Create test directories `test/unit/modules/audio-lab/components/`, `test/unit/modules/audio-lab/hooks/`, and `test/unit/plugins/with-audio-recording/` (Constitution V)
- [ ] T007 Edit `app.json` to append `"./plugins/with-audio-recording"` to the `plugins` array (additive — sibling of existing `with-vision` / `with-speech-recognition` entries; do NOT reorder or remove others) (FR-042, R-006)
- [ ] T008 Confirm — and record in commit message — that the plugin entry does NOT introduce `UIBackgroundModes: audio` and that no Android permission is added in `app.json` (autolinking handles `RECORD_AUDIO`) (D-04, FR-043, FR-044)

**Checkpoint**: Branch verified; `expo-audio` (+ optional `expo-sharing`) installed; empty module + plugin skeletons ready; `app.json` plugin entry appended. No imports resolve yet — that is expected.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Ship the cross-cutting pieces every user story depends on — shared `audio-types` (typed errors + state unions + value types), `quality-presets`, `audio-session` mapping, the `recordings-store` (parse-tolerant CRUD), the manifest, the registry wiring, and the `with-audio-recording` plugin (idempotent + coexists with 017/018). Mocks for `expo-audio`, `expo-sharing`, `expo-file-system`, and `@react-native-async-storage/async-storage` are scaffolded here so all later hook/component/screen tests can import them.

**⚠️ CRITICAL**: No user story phase can begin until this phase is complete. The types, presets, session mapping, and store are imported by every hook, component, and screen; the registry edit is required for the module to appear in the grid; the plugin must be present for iOS builds to succeed.

### Foundational Test Mocks (write FIRST so later test files can import them)

- [ ] T009 [P] Create `test/__mocks__/expo-audio.ts` exposing a controllable mock recorder (`createAudioRecorder`, `startAsync`, `stopAndUnloadAsync`, metering tick injection helper, permission helpers `getRecordingPermissionsAsync`/`requestRecordingPermissionsAsync`) and mock player (`createAudioPlayer`, `play`, `pause`, `stop`, `seekTo`, position tick injection helper, `setOnPlaybackStatusUpdate`); export `setAudioModeAsync` as a `jest.fn()`; mirror the precedent from feature 018's `test/__mocks__/expo-speech-recognition.ts` (R-001, FR-029, FR-030, R-008)
- [ ] T010 [P] Create `test/__mocks__/expo-sharing.ts` exposing `isAvailableAsync()` returning a controllable boolean (`__setAvailable(b)` helper) and `shareAsync()` as a `jest.fn()` (R-002, FR-014, D-06)
- [ ] T011 [P] Create or extend `test/__mocks__/expo-file-system.ts` to expose `documentDirectory`, `getInfoAsync({ exists, size })` with controllable map of URI→info, `makeDirectoryAsync`, `deleteAsync({ idempotent })`, and a helper `__setExists(uri, exists, size?)` (R-009, FR-017)
- [ ] T012 [P] Verify `test/__mocks__/@react-native-async-storage/async-storage.ts` exists (project-wide); if not, scaffold the standard in-memory mock (`getItem`/`setItem`/`removeItem` + `__reset()`) (FR-032, FR-034)

### Foundational Tests (write FIRST, must FAIL before implementation)

- [ ] T013 [P] Write `test/unit/modules/audio-lab/audio-types.test.ts`: covers union completeness for `QualityName` (`'Low' | 'Medium' | 'High'`), `RecorderState` (`'idle' | 'requesting-permission' | 'recording' | 'stopping'`), `PlayerState` (`'idle' | 'loading' | 'playing' | 'paused' | 'stopped'`), `PermissionStatus` (`'undetermined' | 'granted' | 'denied'`), `AudioSessionCategory` (5 values); runtime `instanceof` for `AudioPermissionDenied`, `AudioRecorderUnavailable`, `AudioPlayerLoadFailed` (carries `uri`), `AudioFileMissing` (carries `uri`), `AudioStorageCorrupt` (carries `raw`); each subclass `name` matches its class name (data-model §1, §3, §4, §5, §6, §8)
- [ ] T014 [P] Write `test/unit/modules/audio-lab/quality-presets.test.ts`: asserts `LOW` / `MEDIUM` / `HIGH` exact field values per data-model §2 table (`LOW`: 22050 / 64000 / 1ch / aac; `MEDIUM`: 44100 / 128000 / 1ch / aac; `HIGH`: 48000 / 192000 / 2ch / aac); asserts adjacent-tier ordering (`LOW.bitrate < MEDIUM.bitrate < HIGH.bitrate` and `HIGH.bitrate / LOW.bitrate >= 2`); asserts `getPreset('Low' | 'Medium' | 'High')` returns the corresponding constant; asserts Web-platform branch (`Platform.OS === 'web'` mocked) returns presets with `audioBitsPerSecond` shape suitable for `MediaRecorderOptions` (FR-035, D-12, R-005, SC-005)
- [ ] T015 [P] Write `test/unit/modules/audio-lab/audio-session.test.ts`: asserts `mapCategoryToOptions(cat)` returns the exact `AudioModeOptions` per `contracts/audio-session-mapping.md` for all 5 categories (`Playback`, `Record`, `PlayAndRecord`, `Ambient`, `SoloAmbient`); asserts purity (same input → same output, no platform branch in the mapping function); asserts `Ambient` carries `interruptionMode: 'mixWithOthers'` and `SoloAmbient` carries `interruptionMode: 'duckOthers'`; asserts `applyCategory(cat)` calls `setAudioModeAsync(mapCategoryToOptions(cat))` exactly once on iOS/Android (mocked) and is a no-op-but-resolved on Web (`Platform.OS === 'web'` mocked) per R-007 (FR-020, FR-024, FR-025, D-09, R-007)
- [ ] T016 [P] Write `test/unit/modules/audio-lab/recordings-store.test.ts`: covers `loadRecordings()` returns `[]` on missing key; returns `[]` + emits a single `console.warn` on JSON parse failure (FR-034); returns parsed array preserving insertion order on valid JSON; filters out entries whose `uri` does not exist on disk and re-persists the cleaned list with one `console.warn` per dropped entry (FR-017); covers `saveRecording(r)` appends to current list, persists, and returns the new full list; de-duplicates `name` collisions by appending `-1`, `-2`, ... before `.m4a` (R-003); covers `deleteRecording(id)` removes the entry by `id` (not by `name`), calls `FileSystem.deleteAsync({ idempotent: true })`, persists, returns new list (FR-013); covers `clearRecordings()` removes the AsyncStorage key and recursively deletes the recordings directory; verifies all four functions never throw `AudioStorageCorrupt` to caller; uses the in-memory AsyncStorage mock + `expo-file-system` mock (FR-032, FR-033, FR-034, R-009)
- [ ] T017 [P] Write `test/unit/modules/audio-lab/manifest.test.ts`: manifest `id === 'audio-lab'` (matches `/^[a-z][a-z0-9-]*$/`), `title === 'Audio Lab'`, `platforms` is exactly `['ios', 'android', 'web']`, `minIOS === '11.0'`, `render` is a function returning a React element; asserts `src/modules/registry.ts` imports the manifest and includes it in the modules array exactly once (FR-001, FR-002, A-06)
- [ ] T018 [P] Write `test/unit/plugins/with-audio-recording/index.test.ts` mirroring `test/unit/plugins/with-speech-recognition/index.test.ts`:
  - (a) Adds `NSMicrophoneUsageDescription` with the default copy `"Audio Lab uses the microphone to demonstrate recording and playback."` when absent
  - (b) Preserves an existing operator-set `NSMicrophoneUsageDescription` (string equality after plugin run)
  - (c) **Idempotency**: running the plugin twice in a row yields a deep-equal Info.plist (SC-009)
  - (d) **Coexists with 017** (`with-vision`): running `withVision` then `withAudioRecording` yields both `NSCameraUsageDescription` (017's value) and `NSMicrophoneUsageDescription` (020's value); reverse order yields the same result
  - (e) **Coexists with 018** (`with-speech-recognition`): running `withSpeechRecognition` then `withAudioRecording` preserves 018's `NSMicrophoneUsageDescription` value (020 is a no-op on the key); running `withAudioRecording` then `withSpeechRecognition` preserves 020's value (018 is a no-op on the key)
  - (f) Does NOT add `UIBackgroundModes` (D-04 / FR-044) — assert the key is absent or unchanged
  - (g) Does NOT modify `NSCameraUsageDescription`, `NSSpeechRecognitionUsageDescription`, entitlements, or App Groups
  - Uses the standard `@expo/config-plugins` mock pattern from feature 018's plugin test (FR-040, FR-041, R-006, D-11, SC-009)

### Foundational Implementation

- [ ] T019 [P] Implement `src/modules/audio-lab/audio-types.ts` per `data-model.md` §1 + §2 + §3 + §4 + §5 + §6 + §7 + §8 + `contracts/audio-bridge.contract.ts`: export `QualityName`, `Recording`, `QualityPreset`, `AudioSessionCategory`, `AudioModeOptions`, `RecorderState`, `PlayerState`, `PermissionStatus`, `MeterFrame`, and the typed `Error` subclasses (`AudioPermissionDenied`, `AudioRecorderUnavailable`, `AudioPlayerLoadFailed`, `AudioFileMissing`, `AudioStorageCorrupt`) — each with `override readonly name` matching the class name; `AudioPlayerLoadFailed`/`AudioFileMissing` carry `uri`; `AudioStorageCorrupt` carries `raw`. Makes T013 pass (data-model §1–§8)
- [ ] T020 [P] Implement `src/modules/audio-lab/quality-presets.ts` per `data-model.md` §2 + R-005: export `LOW`, `MEDIUM`, `HIGH` with the exact values from the data-model table; export `getPreset(name)`; behind a `Platform.OS === 'web'` branch (single-value difference, principle-compliant), expose web-shaped variants suitable for `MediaRecorderOptions.audioBitsPerSecond` (mapping LOW→64000, MEDIUM→128000, HIGH→192000). Makes T014 pass (FR-035, D-12, R-005)
- [ ] T021 [P] Implement `src/modules/audio-lab/audio-session.ts` per `contracts/audio-session-mapping.md` + R-007: pure `mapCategoryToOptions(cat)` returning the exact options object for each of the 5 categories; `applyCategory(cat)` wraps `setAudioModeAsync(mapCategoryToOptions(cat))` and on `Platform.OS === 'web'` returns a resolved promise without invoking the no-op web backend (R-007 single-value branch). Makes T015 pass (FR-020, FR-024, FR-025, D-09, R-007)
- [ ] T022 Implement `src/modules/audio-lab/recordings-store.ts` per data-model §9 + R-003 + R-009: `loadRecordings()` reads AsyncStorage key `spot.audio.recordings`, returns `[]` on missing key, returns `[]` + `console.warn` on JSON parse failure (never throws `AudioStorageCorrupt` to caller per FR-034), filters out entries whose `uri` fails `FileSystem.getInfoAsync(uri).exists` (skipped on Web), re-persists the cleaned list; `saveRecording(r)` appends to current list, de-duplicates `name` by appending `-1`, `-2`, ... before `.m4a` (R-003), persists, returns new list; `deleteRecording(id)` removes by `id`, calls `FileSystem.deleteAsync({ idempotent: true })` (no-op on Web), persists, returns new list; `clearRecordings()` removes the AsyncStorage key and recursively deletes the recordings directory (no-op on Web). Makes T016 pass. Depends on T019 (FR-032, FR-033, FR-034, FR-013, FR-017)
- [ ] T023 [P] Implement `plugins/with-audio-recording/index.ts` per R-006 + `plugins/with-speech-recognition/index.ts` precedent: `ConfigPlugin` using `withInfoPlist` that sets `NSMicrophoneUsageDescription = "Audio Lab uses the microphone to demonstrate recording and playback."` **only when absent** (`if (!cfg.modResults.NSMicrophoneUsageDescription)`); does NOT add `UIBackgroundModes`; does NOT touch `NSCameraUsageDescription`, `NSSpeechRecognitionUsageDescription`, entitlements, or App Groups. Makes T018 pass (FR-040, FR-041, D-04, D-11, R-006)
- [ ] T024 [P] Create `plugins/with-audio-recording/package.json` with `name: "with-audio-recording"`, `main: "./index.ts"`, `types: "./index.ts"` (mirrors `plugins/with-speech-recognition/package.json`)
- [ ] T025 Implement `src/modules/audio-lab/index.tsx`: exports a `ModuleManifest` with `id: 'audio-lab'`, `title: 'Audio Lab'`, `description` summarising the module per spec §1, `icon: { ios: 'waveform', fallback: '🎙️' }`, `platforms: ['ios', 'android', 'web']`, `minIOS: '11.0'`, `render: () => <AudioLabScreen />`. Makes T017 (manifest half) pass (FR-001, A-06)
- [ ] T026 Edit `src/modules/registry.ts`: add the import line and the array entry for the audio-lab manifest (single additive 1–2 line edit; matches the precedent set by features 007–019). Makes T017 (registry half) pass. **DO NOT reorder or remove existing entries.** (FR-002, FR-052, SC-007)

**Checkpoint**: Foundational types, presets, session mapping, store, manifest, registry, and plugin all green under `pnpm check`. Module appears in the grid but the screen is not implemented yet (TODO placeholder). No user-visible behavior beyond the tile.

---

## Phase 3: User Story 1 — Record audio and review it in the recordings list (P1) 🎯 MVP

**Goal** (spec §US-1): A user opens Audio Lab, taps the big record button, captures a few seconds of audio, taps stop, and sees a new row appear in the recordings list within ~10 seconds end-to-end (SC-001). Permission is requested **lazily** on first record tap (D-14 / FR-026). Recording survives app restart via AsyncStorage `spot.audio.recordings` + on-disk file at `FileSystem.documentDirectory + 'recordings/'`.

**Independent Test Criteria**: On iOS, launch the app, navigate to Audio Lab, tap record, allow microphone access, wait ≥ 3 seconds, tap stop, verify a new row appears with `HH:MM:SS` duration matching the recording length within ±0.5 s; force-quit the app, reopen, verify the row is still there with the same duration and a tappable file URI. No crash, no JS exception, no `act()` warning in test logs.

### Tests (write FIRST, must FAIL before implementation)

- [ ] T027 [P] [US1] Write `test/unit/modules/audio-lab/hooks/useAudioRecorder.test.tsx`: covers the full state machine using the `expo-audio` mock from T009 — initial `status === 'idle'`, `elapsedMs === 0`, `meterLevel === 0`, `quality === 'Medium'` (default per FR-007 / D-03), `hasPermission === 'undetermined'`; `start()` transitions `idle → requesting-permission → recording` when permission is granted; `start()` rejects with `AudioPermissionDenied` and returns to `idle` on denial (no crash); `start()` rejects with `AudioRecorderUnavailable` if the mock recorder throws on construction; `setQuality(q)` updates `quality` while `idle` but is a no-op while `recording` (FR-008); `elapsedMs` increments at ≥ 1 Hz (advance fake timers and assert) (FR-004 / SC-002); `meterLevel` reflects injected metering frames at ~10 Hz (FR-005 / SC-002); `stop()` transitions `recording → stopping → idle`, resolves with a `Recording` whose `durationMs` matches the elapsed time and whose `quality` matches the selected preset, and persists via the mocked `recordings-store`; calling `stop()` twice is idempotent; `requestPermission()` returns the new `PermissionStatus` and updates `hasPermission`; **unmount cleanup**: unmount during `recording` calls the mock recorder's stop, clears the metering interval, clears the elapsed-time interval, and emits no `console.error` / `console.warn` / `act()` warnings (R-008 / FR-031); covers typed-error contract (`AudioPermissionDenied`, `AudioRecorderUnavailable` are `instanceof Error`) (FR-029)
- [ ] T028 [P] [US1] Write `test/unit/modules/audio-lab/components/PermissionBanner.test.tsx`: renders nothing when `status === 'granted'` or `status === 'undetermined'`; renders the banner with explanatory copy + "Request permission" button when `status === 'denied'`; tapping the button invokes the supplied `onRequestPermission` callback exactly once; renders with `accessibilityRole="alert"` and an `accessibilityLabel` covering the denial state (FR-027, FR-028)
- [ ] T029 [P] [US1] Write `test/unit/modules/audio-lab/components/RecorderCard.test.tsx`: renders the big record button (idle state copy "Record"), an `HH:MM:SS` elapsed-time readout starting at `00:00:00`, the `WaveformMeter` placeholder bars, and the quality selector with the current `quality` highlighted; tapping the record button while `idle` invokes `onStart`; tapping while `recording` invokes `onStop`; the button's `accessibilityLabel` reflects the current state ("Start recording" / "Stop recording"); the elapsed-time readout updates when `elapsedMs` prop changes (test with `100ms`, `1500ms`, `61500ms` → `00:00:00`, `00:00:01`, `00:01:01`); quality selector segments are disabled while `recording` (FR-008 visual surface); pulse animation `useAnimatedStyle` is mounted (smoke-test only — assert the Animated.View is present)
- [ ] T030 [P] [US1] Write `test/unit/modules/audio-lab/components/RecordingsList.test.tsx`: renders the empty-state copy (`"No recordings yet — tap the record button to capture one."`) when `recordings.length === 0`; renders one `RecordingRow` per entry with stable `keyExtractor` returning `recording.id`; passes through `onPlay` / `onDelete` / `onShare` callbacks; verifies `FlatList` ordering matches the input array order (newest-first when the screen sorts by `createdAt` desc); emits one `console.warn` per missing-on-disk entry that the supplied `onMissingFile` callback prunes (FR-017 visual surface)
- [ ] T031 [P] [US1] Write `test/unit/modules/audio-lab/screen.test.tsx` (iOS smoke): renders the iOS `AudioLabScreen` with mocked hooks/store; asserts the three cards are present (`RecorderCard`, `RecordingsList`, `AudioSessionCard` — placeholder OK in this story since US-4 implements the apply flow); asserts `loadRecordings()` is called once on mount and the resulting list is rendered; asserts the `PermissionBanner` is hidden when permission is `'granted'` and visible when `'denied'`; smoke-tests no `act()` warning on mount/unmount (FR-036, R-008)

### Implementation

- [ ] T032 [US1] Implement `src/modules/audio-lab/hooks/useAudioRecorder.ts` per data-model §10 + §4 + §6: state machine `idle → requesting-permission → recording → stopping → idle`; lazy permission request on `start()` (calls mock `requestRecordingPermissionsAsync`, transitions to `requesting-permission`, then to `recording` on grant, back to `idle` + reject `AudioPermissionDenied` on denial — D-14 / FR-026); 250 ms `setInterval` driving `elapsedMs` (FR-004 / SC-002); 100 ms `setInterval` (or push subscription if available) driving `meterLevel` (FR-005 / R-004); `setQuality` no-op while `recording` (FR-008); `stop()` finalizes file, computes `durationMs`/`sizeBytes`, calls `recordings-store.saveRecording`, resolves with the new `Recording`; idempotent (second `stop()` call resolves with the cached Recording); single `useEffect` cleanup stops the recorder, clears both intervals, removes any subscription, nulls the ref (R-008 / FR-031); never surfaces uncaught JS exceptions or native crashes (FR-029); makes T027 pass; depends on T019, T020, T022 (FR-029, FR-026, D-14, FR-031)
- [ ] T033 [P] [US1] Implement `src/modules/audio-lab/components/PermissionBanner.tsx`: receives `{ status: PermissionStatus, onRequestPermission: () => void }`; renders nothing unless `status === 'denied'`; uses `ThemedView`/`ThemedText` and `Spacing` tokens; button uses `Pressable` with `accessibilityRole="button"` and `accessibilityLabel="Request microphone permission"`; styles via `StyleSheet.create()`. Makes T028 pass (FR-027, FR-028, Constitution II/IV)
- [ ] T034 [P] [US1] Implement `src/modules/audio-lab/components/WaveformMeter.tsx`: receives `{ level: number, history?: number }`; maintains a fixed-length ring buffer (default 32 frames) of recent levels (data-model §7); renders one bar per frame in a horizontal `<View>` row; bar height proportional to its level, color from `useTheme()`; bars closer to the right (newer) fade higher with Reanimated `useAnimatedStyle` (R-004 visual surface); `StyleSheet.create()` skeleton merged with animated styles (Constitution IV); component-level smoke test added in T029-adjacent companion `WaveformMeter.test.tsx` (see T035)
- [ ] T035 [P] [US1] Write `test/unit/modules/audio-lab/components/WaveformMeter.test.tsx`: renders the configured number of bars (default 32); height of the rightmost bar reflects the latest `level` prop; pushing a new `level` shifts the buffer (oldest bar removed, newest bar at the right); bar colors derive from `useTheme()` mock (no hardcoded hex assertion); smoke-test no crash with `level=0` and `level=1` boundary values (FR-005, R-004)
- [ ] T036 [US1] Implement `src/modules/audio-lab/components/RecorderCard.tsx`: renders the pulsing record button (Reanimated pulse on `recording`), `HH:MM:SS` elapsed-time formatted from `elapsedMs`, the `WaveformMeter` driven by `meterLevel`, and the `QualityName` segmented selector; tap dispatches `onStart` / `onStop`; quality segments disabled while `status === 'recording'` (FR-008); all spacing from `Spacing` tokens, all colors from `useTheme()`, all styles via `StyleSheet.create()` (Constitution II/IV). Makes T029 pass; depends on T034 (FR-003, FR-004, FR-005, FR-007, FR-008)
- [ ] T037 [P] [US1] Implement `src/modules/audio-lab/components/RecordingsList.tsx`: receives `{ recordings: Recording[], onPlay, onDelete, onShare, onMissingFile? }`; renders `<FlatList data={recordings} keyExtractor={(r) => r.id} renderItem={...RecordingRow}>`; renders empty-state copy when `recordings.length === 0`; passes the row callbacks through; styles via `StyleSheet.create()`. Makes T030 pass (FR-009, FR-017)
- [ ] T038 [US1] Implement `src/modules/audio-lab/screen.tsx` (iOS): mounts `useAudioRecorder` (US-1) and `useAudioPlayer` (US-2 placeholder OK now); on mount calls `recordings-store.loadRecordings()` and stores the result in `useState<Recording[]>`; renders `<PermissionBanner>`, `<RecorderCard>`, `<RecordingsList>`, and an `<AudioSessionCard>` placeholder (full impl lands in US-4); after `recorder.stop()` resolves, prepends the new `Recording` to the list state; uses `ThemedView` as the root container, `Spacing` tokens for layout. Makes T031 pass; depends on T032, T036, T037 (FR-002, FR-003, FR-009, FR-036)

**Checkpoint**: A user can record audio on iOS, see the elapsed-time readout, watch the waveform meter, hit stop, and see a new row in the recordings list. Recording persists across app restart. Permission denial is recoverable via the banner. `pnpm check` green; no `act()` warnings; SC-001 manually verifiable.

---

## Phase 4: User Story 2 — Play back, delete, and share saved recordings (P2)

**Goal** (spec §US-2): From a recording row, the user taps Play and hears the audio within 500 ms (iOS/Android) / 1 s (Web) per SC-003; tapping a different row's Play stops the previous playback first (single-active-player invariant — FR-012 / D-05); tapping Delete removes the row, removes the on-disk file, and never resurrects on next launch; tapping Share opens the platform share sheet on iOS/Android via `expo-sharing` and falls back gracefully (Linking / clipboard) on Web or when sharing is unavailable (FR-014 / D-06).

**Independent Test Criteria**: With ≥ 2 saved recordings, tap Play on row A → audio plays; tap Play on row B → row A stops, row B plays. Tap Delete on row A → row A disappears, file deleted, app restart confirms it stays gone. Tap Share on row A on iOS → share sheet appears; on Web → fallback executes without throwing.

### Tests (write FIRST, must FAIL before implementation)

- [X] T039 [P] [US2] Write `test/unit/modules/audio-lab/hooks/useAudioPlayer.test.tsx`: covers the full state machine using the `expo-audio` mock from T009 — initial `status === 'idle'`, `currentUri === null`, `positionMs === 0`, `durationMs === 0`; `play(uri)` transitions `idle → loading → playing`; sets `currentUri`; `pause()` transitions `playing → paused`; `play()` (no arg) from `paused` transitions back to `playing`; `play(uri2)` while `playing` first calls `stop()` on the in-flight player and then loads `uri2` (single-active-player invariant — FR-012 / D-05); `stop()` is idempotent and never rejects; end-of-file event transitions to `stopped`; `play(uri)` after `stopped` re-loads the file (auto-reset); `seekTo(ms)` updates `positionMs` (if hook exposes seek; otherwise covered by injected position ticks); `play(missingUri)` rejects with `AudioFileMissing` on iOS/Android (mocked `getInfoAsync({ exists: false })`); `play(badUri)` rejects with `AudioPlayerLoadFailed` when the mock player throws on load; **unmount cleanup**: unmount during `playing` calls the mock player's stop, clears the position-poll interval, removes any subscription, nulls the ref, no `act()` warnings (R-008 / FR-031); covers typed-error contract (FR-030)
- [X] T040 [P] [US2] Write `test/unit/modules/audio-lab/components/RecordingRow.test.tsx`: renders the recording's `name`, humanized duration (`HH:MM:SS` for ≥ 1h, `M:SS` otherwise — FR-010), humanized size (`bytesToHuman` cases: `512 B`, `12.5 KB`, `4.2 MB`); renders Play / Delete / Share buttons with accessibility labels; tapping Play invokes `onPlay(recording.id)`; tapping Delete shows a confirm dialog (mocked `Alert.alert`) and invokes `onDelete(recording.id)` only on confirm (FR-013); tapping Share invokes `onShare(recording)`; **sharing fallback**: when `Sharing.isAvailableAsync()` resolves `false` (mocked), the row's Share handler calls the fallback path (clipboard copy or `Linking.openURL`) without throwing (FR-014 / D-06 / R-002); displays the `quality` badge from `recording.quality` (FR-011)

### Implementation

- [X] T041 [US2] Implement `src/modules/audio-lab/hooks/useAudioPlayer.ts` per data-model §10 + §5: state machine `idle → loading → playing → paused → stopped`; `play(uri)` first stops any in-flight player (single-active-player — FR-012 / D-05), then loads + plays; `pause()` from `playing` only; `play()` no-arg resumes from `paused` only; `stop()` idempotent + never rejects (per data-model invariant); end-of-file callback transitions to `stopped`; position-poll `setInterval` (250 ms) drives `positionMs`; on iOS/Android, before loading a `file://` URI, calls `FileSystem.getInfoAsync(uri)` and rejects with `AudioFileMissing` if `exists === false`; load failures from the mock player surface as `AudioPlayerLoadFailed`; single `useEffect` cleanup stops the player, clears the position-poll interval, removes any subscription, nulls the ref (R-008 / FR-031); makes T039 pass; depends on T019, T011 (FR-030, FR-012, D-05, FR-031)
- [X] T042 [P] [US2] Implement helper `src/modules/audio-lab/format-utils.ts` exporting `bytesToHuman(n: number): string` per R-009 (`< 1024 → "NNN B"`, `< 1024² → "N.N KB"`, `< 1024³ → "N.N MB"`, else `"N.N GB"`); also export `formatDurationMs(ms: number): string` returning `H:MM:SS` for ≥ 1h, `M:SS` otherwise (FR-010); minimal companion test `test/unit/modules/audio-lab/format-utils.test.ts` covers boundary values (1023 → `"1023 B"`, 1024 → `"1.0 KB"`, 1024² → `"1.0 MB"`, 0 ms → `"0:00"`, 65000 ms → `"1:05"`, 3661000 ms → `"1:01:01"`)
- [X] T043 [US2] Implement `src/modules/audio-lab/components/RecordingRow.tsx`: receives `{ recording: Recording, onPlay, onDelete, onShare }`; renders `name`, `formatDurationMs(durationMs)`, `bytesToHuman(sizeBytes)`, `quality` badge; Play / Delete / Share `<Pressable>` buttons with `accessibilityLabel` for each; Delete shows `Alert.alert` confirm; Share calls dynamic `await import('expo-sharing')` wrapped in try/catch, then `Sharing.isAvailableAsync()`, then `Sharing.shareAsync(uri)`; on `false` or import failure or web, falls back to clipboard-copy (`expo-clipboard` if available) or `Linking.openURL(uri)` (never throws — FR-014 / D-06); `StyleSheet.create()` + `useTheme()` + `Spacing`. Makes T040 pass; depends on T042 (FR-009, FR-010, FR-011, FR-013, FR-014, D-06, R-002)
- [X] T044 [US2] Edit `src/modules/audio-lab/screen.tsx`: wire `useAudioPlayer` to the `RecordingsList` `onPlay`, wire `recordings-store.deleteRecording` to `onDelete` (and re-set the list state with the returned new list), wire the share handler to `onShare`; verify list state updates on delete + screen test still passes (no breakage of T031); depends on T041, T043 (FR-012, FR-013, FR-014)

**Checkpoint**: Playback, delete, and share all functional on iOS. Single-active-player invariant verified. Sharing fallback verified. `pnpm check` green.

---

## Phase 5: User Story 3 — Choose recording quality before capturing (P2)

**Goal** (spec §US-3): The user picks Low / Medium / High before tapping record; the resulting file's bitrate / sample rate / channels reflect that choice (FR-035 / D-12); switching quality is disabled while recording (FR-008); the row's `quality` badge displays the preset name (FR-011); files at adjacent tiers differ by ≥ 30 % size for the same spoken duration on iOS/Android (SC-005). The metering poll is wired into the `WaveformMeter` and updates ≈ 10 Hz (SC-002).

**Independent Test Criteria**: Record a 5-second sample at each of Low/Medium/High; verify `Recording.quality` matches the selected preset; verify file sizes increase across tiers (≥ 30 % delta on device); verify the segment selector is visually disabled (and `setQuality` is a no-op) during recording; verify the waveform bars animate at ≈ 10 Hz.

### Tests (write FIRST, must FAIL before implementation)

- [ ] T045 [P] [US3] Extend `test/unit/modules/audio-lab/hooks/useAudioRecorder.test.tsx`: add cases for `start()` passing the resolved `getPreset(quality)` config to the mock recorder's `createAudioRecorder` constructor (assert exact call args for each of `Low`, `Medium`, `High`); assert the resulting `Recording.quality` field equals the selected preset name; assert that on `Platform.OS === 'web'` (mocked) the web-shaped preset (`audioBitsPerSecond`) is forwarded instead (R-005). Updates the existing T027 file — add cases, do not duplicate the file
- [ ] T046 [P] [US3] Extend `test/unit/modules/audio-lab/components/RecorderCard.test.tsx`: add cases for the segmented selector — selecting a non-current segment invokes `onQualityChange(name)`; selector is disabled (segments do not invoke the callback) while `status === 'recording'`; the displayed badge color / weight changes for the selected segment (snapshot or testID assertion). Updates T029 file — add cases
- [ ] T047 [P] [US3] Extend `test/unit/modules/audio-lab/components/RecordingRow.test.tsx`: add a case asserting the quality badge displays `recording.quality` ("Low" / "Medium" / "High") with consistent styling per token. Updates T040 file — add cases (FR-011)

### Implementation

- [ ] T048 [US3] Update `src/modules/audio-lab/hooks/useAudioRecorder.ts`: in `start()`, resolve `getPreset(quality)` (from `quality-presets.ts`) and pass the platform-appropriate config object to the recorder constructor (iOS/Android: `{ sampleRate, numberOfChannels, bitRate, format }`; Web: `{ audioBitsPerSecond }` per R-005); ensure `Recording.quality` field set on the persisted record matches the recorder hook's `quality` at stop time. Makes T045 pass; depends on T020, T032 (FR-035, D-12, R-005)
- [ ] T049 [US3] Update `src/modules/audio-lab/components/RecorderCard.tsx`: implement the segmented quality selector (3 segments — Low / Medium / High); selection invokes `onQualityChange(name: QualityName)`; disabled visual + behavioral state when `status === 'recording'` (FR-008); selection persists in the parent's `quality` prop. Makes T046 pass (FR-007, FR-008, D-03)
- [ ] T050 [US3] Update `src/modules/audio-lab/components/RecordingRow.tsx`: render the `quality` badge with deterministic color tokens per preset (e.g., subtle accent for Low, neutral for Medium, strong accent for High) — derived from `useTheme()`, no hardcoded hex. Makes T047 pass (FR-011)
- [ ] T051 [US3] Update `src/modules/audio-lab/screen.tsx`: lift the `quality` state into the screen so the selector survives unmounts of `RecorderCard` re-renders, and pass it down with `recorder.setQuality` as the change handler (which itself is no-op while `recording`); verify metering poll wiring drives `WaveformMeter` end-to-end (visual smoke — no test change required). Depends on T048, T049 (FR-007, FR-008, SC-002)

**Checkpoint**: Quality selection round-trips through the recorder hook and ends up in the persisted `Recording`. WaveformMeter animates from real metering data. SC-002 + SC-005 manually verifiable on device. `pnpm check` green.

---

## Phase 6: User Story 4 — Manage the iOS audio session category (P3)

**Goal** (spec §US-4): The user picks one of the 5 categories (`Playback` / `Record` / `PlayAndRecord` / `Ambient` / `SoloAmbient`), taps Apply, and the app calls `setAudioModeAsync` with the mapped options (FR-020); before applying, any in-flight recorder MUST stop (FR-024 / D-09) and any in-flight playback MUST stop (FR-025); Web shows informational tooltips instead of an Apply button per FR-045 / R-007. A status pill displays the currently active category.

**Independent Test Criteria**: Select each category in turn → Apply → assert `setAudioModeAsync` was invoked with the exact mapped options; while recording, tap Apply on a different category → recorder stops first, then `setAudioModeAsync` runs; while playing, tap Apply → playback stops first; on Web, the Apply button is replaced by a tooltip and no `setAudioModeAsync` call is made.

### Tests (write FIRST, must FAIL before implementation)

- [ ] T052 [P] [US4] Write `test/unit/modules/audio-lab/components/AudioSessionCard.test.tsx`: renders the 5-segment picker with the 5 categories as labels; tapping a segment updates the selected category (controlled — driven by `selected` prop); tapping Apply invokes `onApply(category)` exactly once; while `recorderStatus === 'recording'`, the supplied `onApply` is gated behind a recorder-stop call (assert via supplied `onStopRecorder` mock fired before `onApply`) (FR-024 / D-09); while `playerStatus === 'playing'`, similarly gates behind `onStopPlayer` (FR-025); on `Platform.OS === 'web'` (mocked), Apply button is replaced by a tooltip / informational `<Text>` and `onApply` is never invoked even on segment tap (FR-045 / R-007); status pill displays the currently active category from `activeCategory` prop

### Implementation

- [ ] T053 [P] [US4] Implement `src/modules/audio-lab/components/AudioSessionCard.tsx`: receives `{ selected, onSelect, onApply, activeCategory, recorderStatus, playerStatus, onStopRecorder, onStopPlayer }`; renders the 5-segment picker and the Apply button; Apply handler awaits `onStopRecorder()` if recorder is `recording` then `onStopPlayer()` if player is `playing` (or `paused`/`loading`) **before** invoking `onApply(selected)` per FR-024 / FR-025 / D-09; on `Platform.OS === 'web'`, replaces the Apply button with an informational `<ThemedText>` ("Audio session control not available on web") and does not invoke `onApply` (FR-045 / R-007); status pill bound to `activeCategory`. Makes T052 pass; depends on T021 (FR-020, FR-024, FR-025, FR-045, D-09, R-007)
- [ ] T054 [US4] Update `src/modules/audio-lab/screen.tsx`: replace the `AudioSessionCard` placeholder with the real component; manage `selectedCategory` and `activeCategory` state inside the screen; the `onApply` callback calls `audio-session.applyCategory(selected)` and on success updates `activeCategory`; passes `recorder.stop` as `onStopRecorder` and `player.stop` as `onStopPlayer`; depends on T053 (FR-020, FR-024, FR-025)

**Checkpoint**: Audio session category selection + Apply flow functional on iOS/Android; Web shows the tooltip variant. Recorder/player stop-before-apply invariants verified. `pnpm check` green.

---

## Phase 7: Cross-Platform Parity (Android + Web screens)

**Goal**: Ship `screen.android.tsx` and `screen.web.tsx` so all three platforms run the same module. Web `MediaRecorder` blob handling in the recorder hook works end-to-end on web; the Audio Session Card degrades to tooltips per FR-045.

### Tests (write FIRST)

- [x] T055 [P] Write `test/unit/modules/audio-lab/screen.android.test.tsx`: smoke-test the Android variant renders `RecorderCard`, `RecordingsList`, and the full `AudioSessionCard` (Apply button present); asserts `Platform.OS = 'android'` mock is honored; no `act()` warnings (FR-036)
- [x] T056 [P] Write `test/unit/modules/audio-lab/screen.web.test.tsx`: smoke-test the Web variant renders `RecorderCard`, `RecordingsList`, and a degraded `AudioSessionCard` (no Apply button — informational `<Text>` instead per FR-045); asserts `Platform.OS = 'web'` mock is honored; asserts `setAudioModeAsync` is never called from this screen (FR-045, R-007); no `act()` warnings (FR-036)

### Implementation

- [x] T057 [P] Implement `src/modules/audio-lab/screen.android.tsx`: same composition as `screen.tsx` (the platform behavior diff lives in the hooks/store/session modules, which are already platform-aware). Makes T055 pass (FR-036, FR-046)
- [x] T058 [P] Implement `src/modules/audio-lab/screen.web.tsx`: same composition as `screen.tsx` but does not render the Apply button on `AudioSessionCard` (the component already handles this via `Platform.OS === 'web'`); the rest of the screen is unchanged so a Web user can still record (via `MediaRecorder`), play back, delete, share-fallback, and pick a quality. Makes T056 pass (FR-036, FR-045, FR-046, R-005)

**Checkpoint**: All three platforms ship a fully functional screen. Web record/play/delete/share-fallback verified. Android record/play/delete/share/audio-session verified. `pnpm check` green.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Final hardening — accessibility passes, unmount tests under load, full `pnpm check` green, constitution re-verification, plugin sanity check via `npx expo prebuild --no-install --platform ios` dry-run (operator action — not run in CI).

- [ ] T059 [P] Verify accessibility labels across all 6 components (`RecorderCard`, `WaveformMeter`, `RecordingsList`, `RecordingRow`, `AudioSessionCard`, `PermissionBanner`): each interactive element has an `accessibilityLabel`; the record button's label changes between idle and recording; Delete/Share buttons name the recording they target ("Delete recording 2026-04-28-14-37-12"). Add or extend the corresponding component tests as needed (FR-027, FR-028 — accessibility surface)
- [ ] T060 [P] Run `pnpm check` and confirm green: `pnpm typecheck`, `pnpm lint`, and `pnpm test` all pass; no `act()` warnings; no `console.warn` / `console.error` other than the explicitly-tested ones in `recordings-store.test.ts` (FR-050, SC-011)
- [ ] T061 [P] Re-run the Constitution v1.1.0 check from `plan.md` §"Constitution Check" — confirm all 5 principles still pass (Cross-Platform Parity, Token-Based Theming, Platform File Splitting, StyleSheet Discipline, Test-First); update `plan.md` if any deviation is necessary (must be justified in `plan.md` §"Complexity Tracking")
- [ ] T062 [P] Operator-only verification (NOT run in CI): on macOS/Linux, run `npx expo prebuild --no-install --platform ios` and inspect the generated `ios/spot/Info.plist` to confirm exactly one `NSMicrophoneUsageDescription` entry is present (set by either 018's or 020's plugin depending on `app.json` order), `NSCameraUsageDescription` is preserved (017), `NSSpeechRecognitionUsageDescription` is preserved (018), and `UIBackgroundModes` does NOT include `audio` (D-04 / FR-044 / SC-009)
- [ ] T063 [P] Update `specs/020-audio-recording/research.md` §R-001 / §R-002 with the resolved versions of `expo-audio` (and `expo-sharing` if installed) recorded during T002 / T003; commit alongside the implementation
- [ ] T064 Final verification: with mocked timers, mount `<AudioLabScreen />`, drive 30 seconds of fake metering ticks, fake-tap stop, fake-tap play on the new row, fake-tap delete, unmount — assert zero `console.error`, zero `console.warn` (apart from intentional ones in `recordings-store`), zero `act()` warnings, zero leaked timers (use `jest.getTimerCount() === 0` after cleanup) (R-008, FR-031, SC-011)

**Checkpoint**: Feature complete. All 4 user stories verifiable on device. `pnpm check` green. Constitution re-verified. Plugin coexistence verified. Ready for `/speckit.implement` execution review or merge.

---

## Dependencies & Story Completion Order

```
Phase 1 (Setup) ──▶ Phase 2 (Foundational) ──▶ Phase 3 (US1, P1, MVP) ──▶ Phase 4 (US2, P2)
                                                       │
                                                       ├──▶ Phase 5 (US3, P2)
                                                       │
                                                       └──▶ Phase 6 (US4, P3)
                                                              │
                                                              ▼
                                                       Phase 7 (Cross-Platform) ──▶ Phase 8 (Polish)
```

**Notes**:
- Phase 3 (US1) is the **MVP slice** — recording + persistence + permission + iOS screen. Ship-able on its own.
- Phase 4 (US2), Phase 5 (US3), and Phase 6 (US4) are **independently executable** after Phase 3 — they touch disjoint hook/component surface (player vs. recorder-quality vs. session card). Could be parallelized across two engineers if desired.
- Phase 7 (Cross-Platform screens) has no story tag because the underlying hooks/store/session modules are already platform-aware; the screens are thin compositions.
- Phase 8 (Polish) is sequenced last so accessibility labels / pnpm check / constitution recheck see the final state.

## Parallel Execution Opportunities

**Within Phase 1 (Setup)**: T004, T005, T006 are all `[P]` (different directories).
**Within Phase 2 (Foundational)**:
- Test mocks T009, T010, T011, T012 are all `[P]` (different mock files).
- Foundational tests T013–T018 are all `[P]` (different test files).
- Foundational implementations T019, T020, T021, T023, T024 are `[P]` (different source files); T022 depends on T019; T025 depends on T019; T026 depends on T025.

**Within Phase 3 (US1)**: Tests T027, T028, T029, T030, T031, T035 are all `[P]`. Implementations T033, T034, T037 are `[P]`; T032 depends on T019/T020/T022; T036 depends on T034; T038 depends on T032/T036/T037.

**Within Phase 4 (US2)**: Tests T039, T040 are `[P]`. Implementations T041, T042 are `[P]`; T043 depends on T042; T044 depends on T041/T043.

**Within Phase 5 (US3)**: Tests T045, T046, T047 are `[P]` (extending existing test files). Implementations T048 depends on T020+T032; T049 / T050 are `[P]`; T051 depends on all three.

**Within Phase 6 (US4)**: T052 (test) and T053 (impl) sequential within the component; T054 depends on T053.

**Within Phase 7**: T055 ‖ T056 ‖ T057 ‖ T058 are all `[P]` (different files; the screen impls do not depend on each other).

**Within Phase 8**: All polish tasks T059–T063 are `[P]`; T064 sequenced last as the integration sanity check.

## Implementation Strategy

1. **Land Phase 1 + Phase 2 in one PR**: scaffolding + types + presets + session mapping + store + plugin + manifest + registry. Module tile appears in the grid; tapping it opens a placeholder screen.
2. **Land Phase 3 (US1) as the MVP PR**: end-to-end record on iOS works. Sharable demo even if US2–US4 are not yet shipped.
3. **Land Phase 4 + Phase 5 as the "playback + quality" PR**: feature is now demoable on iOS for all of US1–US3 except audio-session control.
4. **Land Phase 6 as the "audio session" PR**: the full FR-020 surface is now shipped on iOS/Android.
5. **Land Phase 7 as the cross-platform PR**: Android and Web screens. Now demoable on all 3 platforms.
6. **Land Phase 8 as the polish PR**: accessibility passes, final pnpm check, constitution recheck, plugin coexistence verification.

Each PR ends green under `pnpm check` (FR-050 / SC-011) and leaves the previous slice's behavior intact.
