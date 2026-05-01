# Implementation Plan: Audio Recording + Playback Module

**Branch**: `020-audio-recording` | **Date**: 2026-04-28 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/020-audio-recording/spec.md`

## Summary

Ship a code-complete educational module ("Audio Lab") that demonstrates audio capture, playback, and audio-session category management on iOS, Android, and Web through a single dependency: **`expo-audio`** (the modern Expo audio package, installed via `npx expo install expo-audio`). The screen renders three sections — a **Recorder** (large pulsing record button, `HH:MM:SS` elapsed-time readout, vertical waveform meter driven by `expo-audio`'s 100 ms `metering` callback, Low/Medium/High quality selector); a **Recordings list** (rows with timestamp name, duration, file size, and Play / Delete / Share actions, persisted under AsyncStorage key `spot.audio.recordings`); and an **Audio Session Card** (5-segment Playback / Record / PlayAndRecord / Ambient / SoloAmbient picker with an Apply button that invokes `setAudioModeAsync` per the mapping documented in `audio-session.ts`). Recording quality is encoded by `quality-presets.ts` (`LOW = 22050 / 64 kbps / mono`, `MEDIUM = 44100 / 128 kbps / mono`, `HIGH = 48000 / 192 kbps / stereo`). All transport state is owned by two hooks — `useAudioRecorder` and `useAudioPlayer` — that wrap `expo-audio`'s recorder/player primitives and expose a stable JS surface to the components.

The module is **purely additive** at the integration boundary:

1. `src/modules/registry.ts` — one new import line + one new array entry (matches the 006 registry pattern used by features 007–019).
2. `app.json` `plugins` array — one new entry (`./plugins/with-audio-recording`), inserted alongside the existing 007 / 014 / 015 / 016 / 017 / 018 plugins.
3. `package.json` / `pnpm-lock.yaml` — new `expo-audio` dependency (resolved by `npx expo install`); `expo-sharing` is added if not already present (D-06 / FR-014).
4. `plugins/with-audio-recording/` — a new Expo config plugin that idempotently adds **`NSMicrophoneUsageDescription`** to the iOS `Info.plist` and coexists cleanly with feature 017's `with-vision` plugin and feature 018's `with-speech-recognition` plugin (both of which use the same `withInfoPlist` + "set if absent" pattern; 018 already adds `NSMicrophoneUsageDescription`, so 020's plugin is a defensive no-op when 018 ran first — see R-006 below).

The module ships **functional cross-platform behavior** on all three targets:

- **iOS**: full record / playback / metering / category management via `expo-audio` (which wraps `AVAudioRecorder`, `AVAudioPlayer`, and `AVAudioSession`).
- **Android**: full record / playback / metering via `expo-audio`'s Android backend; the Audio Session Card maps the five iOS categories to `setAudioModeAsync` flags that approximate Android equivalents (see R-007).
- **Web**: recording via the browser's `MediaRecorder` (through `expo-audio`'s web implementation); the Audio Session Card categories degrade to informational no-ops with tooltips per FR-045.

The two hooks (`useAudioRecorder`, `useAudioPlayer`) are platform-agnostic and live in `src/modules/audio-lab/hooks/`; the screens (`screen.tsx`, `screen.android.tsx`, `screen.web.tsx`) compose the same components but adjust for platform-specific UX (e.g., the Web screen replaces the Audio Session Card content with informational tooltips). All tests are JS-pure (Jest + jest-expo + RNTL), runnable on Windows under the existing `pnpm check` pipeline; no native unit tests are added.

This feature complies with **Constitution v1.1.0**: cross-platform parity (FR-045 / FR-046), token-based theming (`ThemedText` / `ThemedView` / `useTheme()` throughout), platform file splitting (`screen.tsx` / `screen.android.tsx` / `screen.web.tsx`), `StyleSheet.create()` discipline, and test-first via FR-047 / FR-048 / FR-049.

## Technical Context

**Language/Version**: TypeScript 5.9 strict (sole language for this feature). No new Swift / Kotlin / native code is written — all native APIs are reached through `expo-audio`.
**Primary Dependencies**: Expo SDK 55, React Native 0.83, React 19.2 (React Compiler enabled), `expo-router` (typed routes), **`expo-audio`** (NEW — primary recorder/player/metering/`setAudioModeAsync` surface; install via `npx expo install expo-audio`), `expo-sharing` (NEW — added if not already present; runtime-detected with Linking fallback per D-06), `@react-native-async-storage/async-storage` (already a project dep; key `spot.audio.recordings`), `react-native-reanimated` + `react-native-worklets` (record button pulse; waveform bar fade), `expo-file-system` (already a project dep; used to compute file size and to delete recordings on disk).
**Storage**: AsyncStorage key **`spot.audio.recordings`** — JSON array of `Recording` records (`id`, `name`, `uri`, `durationMs`, `sizeBytes`, `createdAt`, `quality`). Recording binaries live on the platform file system (`FileSystem.documentDirectory + 'recordings/'` on iOS/Android; blob URLs on web). No other persistence; selected quality and selected audio session category are per-screen-session only (D-08).
**Testing**: Jest 29 + `jest-expo@55.0.16` + `@testing-library/react-native` under `test/unit/` mirroring `src/`. JS-pure layer only. Test files: `quality-presets.test.ts`, `audio-session.test.ts`, `recordings-store.test.ts`, `useAudioRecorder.test.tsx`, `useAudioPlayer.test.tsx`, six component tests (one per `components/*.tsx`), three screen tests (`screen.test.tsx`, `screen.android.test.tsx`, `screen.web.test.tsx`), one manifest test, and one plugin test (`with-audio-recording/index.test.ts`) covering idempotency and coexistence with the 017 vision plugin and the 018 speech-recognition plugin. `expo-audio`, `expo-sharing`, and `expo-file-system` are mocked under `test/__mocks__/` mirroring the precedent set by features 017 / 018.
**Target Platform**: iOS 11+ (per FR-001 / `minIOS: '11.0'`), Android (current Expo SDK 55 minimum), Web (current Chromium and Safari with `MediaRecorder` support).
**Project Type**: Mobile app module — additive feature inside the existing spot showcase.
**Performance Goals**:
- First-time user can complete record→stop→see-row-appear within 10 seconds on iOS, Android, and Web (SC-001).
- Elapsed-time readout updates ≥ 1 Hz; waveform meter updates ≈ 10 Hz from the 100 ms `metering` poll (SC-002).
- Tap Play → audible playback within 500 ms on iOS/Android, 1 s on Web (SC-003).
- Quality presets produce file-size differences ≥ 30 % between adjacent tiers for the same spoken duration (SC-005).
**Constraints**:
- Purely additive — no edits to existing modules, hooks, plugins, or registry entries beyond the single-line registry append and the single-entry `app.json` plugin append (FR-052 / SC-007).
- Plugin MUST coexist with `with-vision` (017) and `with-speech-recognition` (018) without modifying their keys; specifically, when 018 has already set `NSMicrophoneUsageDescription`, 020's plugin MUST preserve 018's value (FR-041 / D-11 / SC-009).
- No `UIBackgroundModes: audio` (D-04 / FR-044).
- No bespoke Swift / Kotlin module — all native access goes through `expo-audio` (A-07).
- No code path may surface an uncaught JS exception or native crash; all bridge errors typed and routed through hook state.
- Hooks MUST clean up timers, subscriptions, and player/recorder instances on unmount with no `act()` warnings (FR-031).
- Recording filename format **MUST** be `YYYY-MM-DD-HH-MM-SS.m4a` on iOS/Android; on Web the displayed `name` follows the same format even though the underlying URI is a blob URL (D-13).
- Microphone permission requested **lazily** on first record tap, never on screen mount (D-14 / FR-026).
- AsyncStorage parse failures MUST be tolerated (treat as empty + console warning; FR-034).
**Scale/Scope**: One new module slug (`audio-lab`), one new plugin (`with-audio-recording`), three platform screens, six components, two hooks, three pure data/mapping files (`recordings-store.ts`, `quality-presets.ts`, `audio-session.ts`), ~15 JS-pure test files, two new dependencies (`expo-audio`, optionally `expo-sharing`).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Constitution version consulted: `1.1.0` (`.specify/memory/constitution.md`). FR-051 in the spec already targets `1.1.0`. The five core principles plus the v1.1.0 Validate-Before-Spec workflow guidance govern this gate.

| Principle | Status | Evidence in this plan |
|-----------|--------|-----------------------|
| **I. Cross-Platform Parity** | ✅ Pass | Module registers for `['ios','android','web']` (FR-001). All three platforms ship a functional record + playback path through `expo-audio`. Audio Session Card categories are functional on iOS/Android (mapped to `setAudioModeAsync` flags) and degrade to informational tooltips on Web per FR-045 — an explicitly permitted platform-specific UX adjustment. |
| **II. Token-Based Theming** | ✅ Pass | All components use `ThemedText` / `ThemedView` and the `Spacing` scale from `src/constants/theme.ts`. Record button pulse, waveform bars, recording-row surfaces, segmented-control selection, and status pill all derive from `useTheme()`; no hardcoded hex. The waveform meter reuses 011's BarChart visual idiom (D-10) inheriting the same theme tokens. |
| **III. Platform File Splitting** | ✅ Pass | Screens split as `screen.tsx` (iOS, default) / `screen.android.tsx` / `screen.web.tsx` per FR-036. The hooks, store, presets, and components are platform-agnostic and live in their unsuffixed files (no `Platform.OS` branches inside them). The single permitted inline branch is the runtime guard inside `audio-session.ts` that returns a no-op options object on Web — this is a single-value difference per the principle's allowance. |
| **IV. StyleSheet Discipline** | ✅ Pass | All component styles via `StyleSheet.create()` co-located with the component. No CSS-in-JS, no inline objects, no utility framework. Reanimated styles for the record-button pulse and waveform-bar fade use `useAnimatedStyle` merged with `StyleSheet.create()` skeletons — the standard Reanimated pattern, also used by features 011 and 017. All spacing values from the `Spacing` scale. |
| **V. Test-First** | ✅ Pass | FR-047 / FR-048 / FR-049 enumerate the required test surface and Phase 1 enumerates ~15 JS-pure test files. Tests are written alongside or before implementation. The `with-audio-recording` plugin test covers idempotency and coexistence with 017 (and, defensively, 018) — mirrors the precedent set by `test/unit/plugins/with-speech-recognition/index.test.ts`. The two hooks (`useAudioRecorder`, `useAudioPlayer`) are tested with a mocked `expo-audio` module under `test/__mocks__/`. No native test framework is required — the feature has zero net-new native code. |

**Validate-Before-Spec** (constitution v1.1.0): This feature does not introduce a new build pipeline, infrastructure layer, or external service integration. It introduces one new Expo package (`expo-audio`) and one new Expo config plugin that mirrors the well-precedented `withInfoPlist` + "set if absent" pattern from `plugins/with-vision/` (017) and `plugins/with-speech-recognition/` (018). The plugin's idempotency and coexistence behavior are JS-testable in CI (mocked `@expo/config-plugins`) — no EAS dry-run is needed because the merge logic is pure. **No build / EAS proof-of-concept is required.**

**Gate decision**: PASS. No violations to justify.

## Project Structure

### Documentation (this feature)

```text
specs/020-audio-recording/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   ├── audio-bridge.contract.ts        # JS-facing contract for the two hooks + the store
│   └── audio-session-mapping.md        # iOS-category → setAudioModeAsync options table
└── tasks.md             # Phase 2 output (NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── modules/
│   ├── registry.ts                                   # +1 import line, +1 array entry (ONLY edit)
│   └── audio-lab/                                    # NEW
│       ├── index.tsx                                 # ModuleManifest export (id 'audio-lab', label 'Audio Lab',
│       │                                             # platforms ['ios','android','web'], minIOS: '11.0')
│       ├── screen.tsx                                # iOS — full functional path
│       ├── screen.android.tsx                        # Android — full functional path
│       ├── screen.web.tsx                            # Web — recorder/list functional; Audio Session Card → tooltips
│       ├── recordings-store.ts                       # AsyncStorage `spot.audio.recordings` CRUD (FR-032..FR-034)
│       ├── quality-presets.ts                        # LOW / MEDIUM / HIGH presets (FR-035, D-12)
│       ├── audio-session.ts                          # Category → setAudioModeAsync options mapping (FR-020)
│       ├── audio-types.ts                            # Recording, QualityPreset, AudioSessionCategory,
│       │                                             # RecorderState, PlayerState, PermissionStatus, MeterFrame
│       ├── hooks/
│       │   ├── useAudioRecorder.ts                   # Recorder lifecycle + 100 ms metering poll + permission (FR-029)
│       │   └── useAudioPlayer.ts                     # Player lifecycle + single-active-player guarantee (FR-030)
│       └── components/
│           ├── RecorderCard.tsx                      # Big pulsing button + elapsed time + WaveformMeter + quality selector
│           ├── WaveformMeter.tsx                     # Vertical bars driven by metering frames (D-10)
│           ├── RecordingsList.tsx                    # FlatList of rows + empty state
│           ├── RecordingRow.tsx                      # Name / duration / size + Play / Delete / Share actions
│           ├── AudioSessionCard.tsx                  # 5-segment picker + Apply + status pill
│           └── PermissionBanner.tsx                  # Non-blocking banner + "Request permission" action

plugins/
└── with-audio-recording/                             # NEW — sibling of with-vision, with-speech-recognition
    ├── index.ts                                      # withInfoPlist: idempotently set NSMicrophoneUsageDescription
    └── package.json                                  # name "with-audio-recording", main+types "./index.ts"

test/unit/
├── modules/audio-lab/
│   ├── manifest.test.ts                              # Asserts ModuleManifest fields + registry entry
│   ├── recordings-store.test.ts                     # CRUD + parse-failure tolerance
│   ├── quality-presets.test.ts                      # Preset shape + tier ordering
│   ├── audio-session.test.ts                        # Mapping table coverage for all 5 categories + Web no-op
│   ├── screen.test.tsx                              # iOS screen smoke
│   ├── screen.android.test.tsx                      # Android screen smoke
│   ├── screen.web.test.tsx                          # Web screen smoke (Audio Session Card degraded)
│   ├── hooks/
│   │   ├── useAudioRecorder.test.tsx                # Recorder lifecycle + metering + permission state machine
│   │   └── useAudioPlayer.test.tsx                  # Single-active-player invariant + cleanup on unmount
│   └── components/
│       ├── RecorderCard.test.tsx
│       ├── WaveformMeter.test.tsx
│       ├── RecordingsList.test.tsx                  # Empty state + populated state + missing-file cleanup
│       ├── RecordingRow.test.tsx                    # Play / Delete / Share button behavior + sharing fallback
│       ├── AudioSessionCard.test.tsx                # Segment selection + Apply + recorder-stops-first behavior
│       └── PermissionBanner.test.tsx
└── plugins/with-audio-recording/
    └── index.test.ts                                # Idempotency + preserves 018's NSMicrophoneUsageDescription
                                                    # + coexists with 017 NSCameraUsageDescription untouched
                                                    # + does not modify entitlements / App Groups / UIBackgroundModes

# Edits to existing files:
package.json                                          # +1 dep: expo-audio  (+expo-sharing if not present)
app.json                                              # +1 plugin entry: "./plugins/with-audio-recording"
src/modules/registry.ts                              # +1 import + +1 array entry (additive, FR-002)
```

**Structure Decision**: Standard spot module layout (mirrors features 006–019; `speech-synthesis-lab` directly precedes this feature). The module slug is `audio-lab` (matching the `-lab` convention for educational-demo modules: `coreml-lab`, `widgets-lab`, `screentime-lab`, `swift-charts-lab`, `app-intents-lab`, `sf-symbols-lab`, `speech-recognition-lab`, `speech-synthesis-lab`). The plugin slug is `with-audio-recording` (matching `with-vision` / `with-speech-recognition`). **There is intentionally no `native/ios/audio-lab/` Swift folder** — A-07 / D-01 forbid bespoke native code; all platform access flows through `expo-audio`.

## Module Boundaries & Hook Contract (summary)

The contracts/ directory holds the authoritative declarations. Short summary:

- **`useAudioRecorder()` → `{ status, elapsedMs, meterLevel, quality, setQuality, start, stop, hasPermission, requestPermission }`** (FR-029):
  - `status: RecorderState` — `'idle' | 'requesting-permission' | 'recording' | 'stopping'`.
  - `elapsedMs: number` — milliseconds since the current recording started; `0` when idle. Updated via `setInterval` at 250 ms cadence (drives the ≥ 1 Hz `HH:MM:SS` readout per FR-004 / SC-002).
  - `meterLevel: number` — last sample from the 100 ms `metering` poll, normalized to `[0, 1]`. `0` when idle.
  - `quality: 'Low' | 'Medium' | 'High'` — selected preset; default `'Medium'` (FR-007 / D-03).
  - `setQuality(q)` — no-op while `status === 'recording'` (FR-008).
  - `start(): Promise<void>` — requests permission lazily if needed (FR-026 / D-14), then begins recording with the configuration from `quality-presets.ts[quality]`. Rejects with a typed error if permission is denied or `expo-audio` rejects.
  - `stop(): Promise<Recording>` — finalizes the file, computes `durationMs` and `sizeBytes`, persists via `recordings-store.saveRecording`, and resolves with the new record. Idempotent.
  - `hasPermission: PermissionStatus` — `'undetermined' | 'granted' | 'denied'`.
  - `requestPermission(): Promise<PermissionStatus>` — explicit re-prompt for the PermissionBanner action (FR-027).

- **`useAudioPlayer()` → `{ status, currentUri, positionMs, durationMs, play, pause, stop }`** (FR-030):
  - Single-active-player invariant: `play(uri)` first calls `stop()` on any in-flight player and only then loads + plays the new URI (FR-012 / D-05).
  - Cleans up on unmount: `stop()` is invoked, subscriptions removed, no `act()` warnings (FR-031).

- **`recordings-store`** (FR-032 / FR-033 / FR-034):
  - `loadRecordings(): Promise<Recording[]>` — JSON-parse-tolerant; returns `[]` on parse failure with `console.warn`.
  - `saveRecording(r: Recording): Promise<Recording[]>` — appends and persists; returns the new full list.
  - `deleteRecording(id: string): Promise<Recording[]>` — removes from list and from disk via `FileSystem.deleteAsync({ idempotent: true })`.
  - `clearRecordings(): Promise<void>` — wipes both the AsyncStorage key and the on-disk recordings directory.

- **`audio-session.ts`** (FR-020 / FR-024 / FR-025):
  - `mapCategoryToOptions(cat: AudioSessionCategory) → AudioModeOptions` — pure, table-driven mapping per `contracts/audio-session-mapping.md`.
  - `applyCategory(cat)` — convenience wrapper that calls `setAudioModeAsync(mapCategoryToOptions(cat))`. The screen is responsible for stopping any in-progress recorder/player **before** calling this (FR-024 / FR-025 / D-09); the wrapper itself does not introspect transport state.

- **`quality-presets.ts`** (FR-035 / D-12):
  - Three named exports — `LOW`, `MEDIUM`, `HIGH` — each a complete `RecordingOptions`-shaped object suitable for `expo-audio`'s recorder API (sample rate, bitrate, channels, format defaulting to `aac` / `.m4a`). Web variants live in the same file behind a `Platform.OS === 'web'` branch (single-value difference, principle-compliant) and map to the closest `MediaRecorder`-supported configuration (R-005).

The screen owns the controlled selectors (`quality`, `category`) and the recordings list state hydrated from the store. No component reads from `expo-audio` directly; all native access is mediated by the two hooks and the store.

## Why a Plugin Is Required (vs. 019's "no plugin" choice)

Feature 019 (Speech Synthesis) ships **zero** plugin and zero `Info.plist` keys because `AVSpeechSynthesizer` is an output-only API requiring no privacy-protected resource. Feature 020 is different: **microphone capture requires `NSMicrophoneUsageDescription`**, an Apple-mandated privacy key without which the App Store rejects the binary and the system permission prompt cannot be shown. Therefore:

- A new Expo config plugin **MUST** ship at `plugins/with-audio-recording/` (FR-040).
- It **MUST** be registered in `app.json` `plugins` (FR-042).
- It **MUST** be idempotent and **MUST** preserve any pre-existing `NSMicrophoneUsageDescription` value (FR-041 / D-11). This matters because feature 018's `with-speech-recognition` plugin **already adds `NSMicrophoneUsageDescription`** with a feature-018-specific default copy (`"Used to capture audio for live speech-to-text"`). When both plugins are active, the merge order in `app.json` determines whose default copy "wins" — but because both plugins use the "set if absent" pattern, **whichever runs first sets the key and the other is a no-op**. Either ordering yields a valid Info.plist with one `NSMicrophoneUsageDescription` entry. The plugin test at `test/unit/plugins/with-audio-recording/index.test.ts` asserts both orderings produce a deep-equal Info.plist (SC-009 — extended to cover 018 in addition to 017).
- It **MUST NOT** add `UIBackgroundModes: audio` (D-04 / FR-044). Background-mode recording is out of scope for v1.
- It **MUST NOT** add Android permissions — `expo-audio`'s autolinking handles `RECORD_AUDIO` via its own AndroidManifest merge at build time (FR-043).

The default copy this plugin sets is `"Audio Lab uses the microphone to demonstrate recording and playback."` (operator-overridable by setting the key in `app.json`'s `ios.infoPlist` before this plugin runs).

## Phase 0: Research

Output → `research.md`. Key items:

- **R-001** — `expo-audio` SDK 55 compatibility & feature surface verification. Action item for implement phase: install via `npx expo install expo-audio` (not raw `pnpm add`) so Expo's compatibility matrix pins the right version. Confirm the resolved version supports: `useAudioRecorder` / `useAudioPlayer` (or the imperative equivalents we wrap), 100 ms metering polling, `setAudioModeAsync({ allowsRecording, playsInSilentMode, interruptionMode })`, and a documented Android + Web backend. Document the resolved version in research.md after install.
- **R-002** — `expo-sharing` availability. Check whether `expo-sharing` is already in `package.json`; if not, install via `npx expo install expo-sharing`. The Share action calls `Sharing.isAvailableAsync()` at runtime and falls back to a Linking / clipboard copy-path action if `false` (D-06 / FR-014). The fallback never throws.
- **R-003** — Recording filename strategy. Files named `YYYY-MM-DD-HH-MM-SS.m4a` (D-13). Path on iOS/Android: `FileSystem.documentDirectory + 'recordings/' + name`. Path on Web: `URL.createObjectURL(blob)` from `MediaRecorder` output; the displayed `name` follows the same timestamp format even though the URI is opaque. Duplicate-timestamp de-dup: append `-1`, `-2`, … suffix (spec Edge Case + R-003).
- **R-004** — Metering polling cadence. `expo-audio` exposes a metering callback or polling API; the recorder hook polls at 100 ms via `setInterval` if a push-callback is not available. The waveform meter renders ≈ 10 Hz from these frames (FR-005 / SC-002). If the underlying cadence differs slightly, the WaveformMeter buffers / interpolates to maintain the visual rate.
- **R-005** — Web recording format mapping. The browser's `MediaRecorder` typically supports `audio/webm; codecs=opus` (Chromium) or `audio/mp4` (Safari). Quality presets on web map to the closest supported configuration; if neither bitrate nor sample rate hints are honored by the browser, the preset still affects the displayed badge but the underlying file may be platform-default. SC-005's "≥ 30 % size delta between tiers" is primarily an iOS/Android assertion.
- **R-006** — Plugin coexistence with 017 (`with-vision`) and 018 (`with-speech-recognition`). Both 017 and 018 use the `withInfoPlist` + "set if absent" pattern (`if (!cfg.modResults.NSMicrophoneUsageDescription) cfg.modResults.NSMicrophoneUsageDescription = ...`). 020's plugin uses the same pattern, so the order of plugin execution in `app.json` does not affect the final Info.plist — exactly one `NSMicrophoneUsageDescription` entry remains, set by whichever plugin runs first. The plugin test must cover: (a) running 020 alone produces the expected key; (b) running 020 after 018 preserves 018's value; (c) running 020 after 017 produces both `NSMicrophoneUsageDescription` and 017's `NSCameraUsageDescription`; (d) running 020 twice in a row produces a deep-equal Info.plist (SC-009).
- **R-007** — Cross-platform `setAudioModeAsync` mapping. The five iOS categories map to combinations of `allowsRecording`, `playsInSilentMode`, and `interruptionMode` per spec FR-020. On Android, `setAudioModeAsync`'s flags are honored where the Android audio framework supports the analogous concept (`playsInSilentMode` ↔ `STREAM_MUSIC` routing; `interruptionMode` ↔ `AudioFocusRequest` ducking). On Web, `setAudioModeAsync` is documented as a no-op by `expo-audio` — the `mapCategoryToOptions` function still returns the same options object for symmetry, but the screen's Audio Session Card reads `Platform.OS === 'web'` and renders informational tooltips instead of an Apply button. The full table is captured in `contracts/audio-session-mapping.md`.
- **R-008** — `useAudioRecorder` / `useAudioPlayer` cleanup. Both hooks register a `useEffect` cleanup that: stops any in-flight recorder/player, clears the metering interval, removes any subscription handles, and nulls the player/recorder ref. Tests assert no `act()` warnings on unmount via `cleanup()` from RNTL.
- **R-009** — File-size computation. `FileSystem.getInfoAsync(uri)` returns `{ size }` in bytes; the row formatter humanizes via a small pure helper (`bytesToHuman`). On Web, the `Blob.size` property is read directly from the `MediaRecorder` output blob.
- **R-010** — Validation-before-spec assessment: NOT required for this feature. No new build pipeline, no new infrastructure, no external service. The plugin's idempotency is JS-testable in CI; `expo-audio` is a mature Expo package precedented by the project's prior modules. Documented per constitution v1.1.0 workflow guidance.

## Phase 1: Design Outputs

1. **`data-model.md`** — entities (`Recording`, `QualityPreset`, `AudioSessionCategory`, `RecorderState`, `PlayerState`, `PermissionStatus`, `MeterFrame`, `AudioModeOptions`), the JSON shape persisted under `spot.audio.recordings`, the recorder and player state machine diagrams, and the typed `Error` subclasses used by the hooks.
2. **`contracts/audio-bridge.contract.ts`** — TypeScript contract for the two hooks and the store, plus the `audio-session.ts` mapping function signature. Implementation files re-export types from this contract verbatim during implement phase.
3. **`contracts/audio-session-mapping.md`** — Markdown table mapping each of `Playback / Record / PlayAndRecord / Ambient / SoloAmbient` to its full `setAudioModeAsync` options object, with per-platform behavior notes (iOS canonical, Android approximated, Web no-op).
4. **`quickstart.md`** — operator install steps (`npx expo install expo-audio`, possibly `expo-sharing`; add the plugin entry to `app.json`), on-device verification mapped to spec user stories US-1 through US-4, and explicit callouts for the coexistence behavior with 017 and 018 plugins.
5. **Agent context update**: Replace the `<!-- SPECKIT START --> … <!-- SPECKIT END -->` block in `.github/copilot-instructions.md` to point to `specs/020-audio-recording/plan.md`.

Re-evaluation of Constitution Check after Phase 1 design: still PASS. The data model adds no new dependencies, the contracts confirm the additive-only delta (one registry line, one `app.json` plugin entry, one new dep `expo-audio` plus optional `expo-sharing`), and the quickstart documents the install + plugin registration. No principle is touched negatively by the design artifacts.

## Phasing (informational — for /speckit.tasks)

Per the SDD lifecycle, plan generation completes Phase 0 (research) and Phase 1 (data model + contracts + quickstart). Implementation phasing — once `/speckit.tasks` runs — will follow the spec's user-story priorities:

- **MVP slice (US-1, P1)**: `useAudioRecorder` + `RecorderCard` (button + elapsed time only, no waveform yet) + `recordings-store` + `RecordingsList` (basic rows, no Play/Share yet) + iOS `screen.tsx` + module manifest + registry entry + plugin + `app.json` plugin entry + plugin test + the JS-pure tests for recorder hook, store, manifest, plugin. Validates the end-to-end record → persist → re-hydrate loop on iOS.
- **Second slice (US-2, P2)**: `useAudioPlayer` + `RecordingRow` Play / Delete / Share actions + `expo-sharing` runtime detection + Linking fallback. Validates single-active-player invariant + sharing fallback path.
- **Third slice (US-3, P2)**: `quality-presets.ts` + quality selector inside `RecorderCard` + the metering poll wired into `WaveformMeter`. Validates D-12 preset numbers + SC-002 metering cadence + SC-005 file-size deltas.
- **Fourth slice (US-4, P3)**: `audio-session.ts` + `AudioSessionCard` + the recorder-stops-first / playback-stops-first guards (FR-024 / FR-025). Validates category mapping + transport-stop-on-apply behavior.
- **Fifth slice (cross-platform parity)**: `screen.android.tsx` + `screen.web.tsx` + Web no-op tooltips for the Audio Session Card + Web `MediaRecorder` blob handling in the store + the Android/Web screen tests. Can technically land any time after US-1 because the hook + store + components are platform-agnostic; sequencing it last keeps the iOS feedback loop tight.
- **Sixth slice (`PermissionBanner`)**: Permission re-request flow + disabled record button + accessibility labels (FR-027 / FR-028). Lands close to US-1 because permission denial blocks the MVP, but the banner UI is a cosmetic layer over the already-functional permission state.

Each slice ends green under `pnpm check` (FR-050 / SC-011) and leaves the previous slice's behavior intact.

## Complexity Tracking

> No Constitution Check violations to justify. The feature stays inside the established additive-module pattern. The two atypical aspects:
>
> 1. **Two hooks instead of one.** `useAudioRecorder` and `useAudioPlayer` are split because their lifecycles, error surfaces, and cleanup logic are independent — co-locating them inside one hook would couple the recorder's metering interval to the player's position polling and complicate cleanup. The split mirrors `expo-audio`'s own API shape.
> 2. **A new config plugin.** Required by Apple's `NSMicrophoneUsageDescription` mandate (no microphone capture without it). The plugin reuses the well-precedented `withInfoPlist` + "set if absent" pattern from 017 and 018; it is one file (~25 lines) plus its package.json and one test file.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| _(none)_ | _(n/a)_ | _(n/a)_ |
