# Phase 0 Research — Audio Recording + Playback Module (Feature 020)

**Branch**: `020-audio-recording` | **Date**: 2026-04-28 | **Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)

This document records the autonomous resolution of every NEEDS-CLARIFICATION-equivalent open question identified during the plan-phase Technical Context fill. All decisions link back to spec FRs / Decisions and to the active project constitution (`.specify/memory/constitution.md` v1.1.0).

---

## R-001 — `expo-audio` SDK 55 compatibility and feature surface

**Question**: Does `expo-audio` (the modern Expo audio package) on Expo SDK 55 expose everything this module needs (recorder + player + 100 ms metering + `setAudioModeAsync` for AVAudioSession category management) on iOS, Android, and Web in a single dependency?

**Decision**: **Yes.** `expo-audio` is the chosen single dependency for record / play / meter / session management on all three platforms (D-01 / spec). Install via `npx expo install expo-audio` (not raw `pnpm add`) so Expo's per-SDK compatibility matrix pins the version known to work with Expo SDK 55 / React Native 0.83 / React 19.2.

**Resolved version (T002 / Phase 1)**: `expo-audio@~55.0.14` recorded in `package.json` after `npx expo install expo-audio`. Confirmed compatible with Expo SDK 55 / React Native 0.83 / React 19.2 (T063, Phase 8).

**Rationale**:

- `expo-audio` consolidates what was historically split across `expo-av` (record + play) and platform-specific session APIs into one package with first-class iOS, Android, and Web backends.
- Recorder API includes a metering channel suitable for ~10 Hz sampling (FR-005 / SC-002).
- Player API supports load-from-file-uri, transport, and position polling (sufficient for FR-012 / FR-030).
- `setAudioModeAsync({ allowsRecording, playsInSilentMode, interruptionMode })` covers the five iOS categories required by FR-020.
- One dependency = one operator install = simpler quickstart (matches D-01 simplicity goal).

**Alternatives considered**:

- *`expo-av` (legacy)*: rejected. It is on the deprecation path in Expo SDK 55+; new modules should use `expo-audio` per Expo's own migration guidance.
- *`react-native-audio-recorder-player` + `react-native-track-player` separately*: rejected. Two non-Expo deps duplicate functionality, both require their own native autolinking story, and neither has a Web backend — that would force us to write a third Web-only adapter. Violates the project's "use Expo first" convention and inflates the test-mock surface.
- *Bespoke Swift wrapper around `AVAudioRecorder` / `AVAudioPlayer` / `AVAudioSession`*: rejected. It would duplicate `expo-audio`'s functionality on iOS only, leave Android and Web unsolved, and contradict A-07 (no bespoke native code for this feature).

**Citations**: Expo documentation — `expo-audio` (recorder / player / metering / session API), Expo SDK 55 release notes (deprecation of `expo-av`).

---

## R-002 — `expo-sharing` availability and runtime fallback strategy

**Question**: Is `expo-sharing` already a project dependency? If not, should it be added? What does the Share action do when `expo-sharing` is unavailable?

**Decision**: Check `package.json` during implement phase. If `expo-sharing` is **absent**, install it via `npx expo install expo-sharing`. The Share action calls `Sharing.isAvailableAsync()` at runtime; if it resolves `true`, call `Sharing.shareAsync(uri)`. If it resolves `false` (or the module import fails — wrapped in try/catch via dynamic import), fall back to a `Linking`-based action that copies the file URI to the clipboard (via `expo-clipboard` if available, else `Linking.openURL(uri)`). The fallback **never throws** (FR-014 / D-06).

**Resolved version (T003 / Phase 1)**: `expo-sharing@~55.0.18` recorded in `package.json` after `npx expo install expo-sharing` (T063, Phase 8).

**Rationale**:

- Sharing is a P2 user story; it must work where reasonable but must not block the MVP recording loop on iOS/Android if the sharing module is missing.
- Web's share story is inherently degraded — `Sharing.isAvailableAsync()` returns `false` on web, so the fallback path is exercised on every web invocation. Copying the blob URL to the clipboard is the most useful action available on web.
- Wrapping the `expo-sharing` import in a dynamic-require + try/catch keeps the Recordings list functional even if a downstream consumer of this feature uninstalls `expo-sharing`.

**Alternatives considered**:

- *Hard-require `expo-sharing` and let the import fail*: rejected. A Recordings list that crashes when `expo-sharing` is missing is worse UX than a Share button that silently degrades to "copy path". Spec FR-014 explicitly requires graceful fallback.
- *Use `react-native-share`*: rejected. Adds another dep, duplicates `expo-sharing`'s functionality on iOS/Android, and has worse Web support.

**Citations**: Expo `expo-sharing` documentation; Spec FR-014 / D-06.

---

## R-003 — Recording filename, on-disk path, and de-duplication

**Question**: What is the canonical recording filename, where does the file live on disk, and how are duplicate timestamps handled?

**Decision**:

- **Filename**: `YYYY-MM-DD-HH-MM-SS.m4a` (D-13). Hyphen separators (not colons) so the filename is filesystem-safe on all platforms.
- **Path on iOS/Android**: `FileSystem.documentDirectory + 'recordings/' + name`. The directory is created on first use via `FileSystem.makeDirectoryAsync({ intermediates: true })`.
- **Path on Web**: `URL.createObjectURL(blob)` returned by the `MediaRecorder` `dataavailable` event. The displayed `name` still follows the timestamp format even though the URI is an opaque blob URL.
- **Duplicate de-dup**: If a recording with the same timestamp name already exists in the store, append `-1`, `-2`, … to the *base* before the extension (e.g., `2026-04-28-14-37-12-1.m4a`). De-dup is checked at `saveRecording` time; the on-disk filename is updated to match before the file is written so the URI in the store always equals the on-disk path.

**Rationale**:

- A stable, sortable, filesystem-safe filename is a small but high-leverage UX detail (recordings naturally sort newest-first by name in addition to by `createdAt`).
- `.m4a` is the natural container for AAC audio on iOS and Android (`expo-audio`'s default codec).
- Document directory survives app updates (vs. cache directory), so recordings persist across app upgrades.

**Alternatives considered**:

- *Random UUID filenames*: rejected. Less debuggable, harder to identify in a file inspector, no natural sort order.
- *Cache directory*: rejected. Recordings would be wiped on OS-level cache pressure — a poor UX for a feature whose entire value is "I made this recording, now I can play it back later".

**Citations**: `expo-file-system` documentation; Spec D-13.

---

## R-004 — Metering polling cadence and waveform render rate

**Question**: At what cadence does `expo-audio` produce metering frames, and how does the WaveformMeter render at ~10 Hz?

**Decision**: The recorder hook polls at **100 ms** (`setInterval(100ms)`) reading the recorder's current metering value. If `expo-audio` exposes a push-style metering subscription, the hook subscribes and uses that instead — but the JS surface contract is the same: `meterLevel: number ∈ [0,1]` updated at ~10 Hz. The WaveformMeter component reads `meterLevel` from the hook and shifts a fixed-length ring buffer of recent values into the `<View>`-based bar chart on each render. Bars fade out via Reanimated `useAnimatedStyle` to give the meter its characteristic "decay" look.

**Rationale**:

- 100 ms (10 Hz) is a sweet spot: fast enough to feel live, slow enough to avoid driving 60 Hz re-renders on a list-heavy screen.
- A fixed-length ring buffer (e.g., 32 frames = 3.2 seconds of history) keeps the render cost O(constant) regardless of recording length.
- Reanimated handles the bar fade on the UI thread, so the actual metering poll's cadence doesn't have to be perfectly regular for the visual to feel smooth.

**Alternatives considered**:

- *60 Hz polling*: rejected. Six times the React work per second for no perceived improvement; risks `requestAnimationFrame` starvation on lower-end Android.
- *Sound-activated bar height (Web Audio AnalyserNode)*: rejected. Adds a Web-only code path duplicating `expo-audio`'s metering. The `expo-audio` web backend already provides a metering value — use it.

**Citations**: `expo-audio` recorder API documentation; Spec FR-005 / SC-002; D-10 (BarChart visual idiom from feature 011).

---

## R-005 — Web `MediaRecorder` codec and quality preset mapping

**Question**: What codec / container does the Web `MediaRecorder` produce, and how do the Low/Medium/High quality presets map onto the browser's recording configuration?

**Decision**:

- **Chromium**: produces `audio/webm; codecs=opus` by default. Bitrate hint via `MediaRecorderOptions.audioBitsPerSecond`. Sample rate is determined by the browser/source and not generally controllable from JS.
- **Safari (15+)**: produces `audio/mp4; codecs=mp4a.40.2` (AAC-LC). Bitrate hint also via `audioBitsPerSecond`.
- **Quality preset mapping on web**:
  - `LOW` → `{ audioBitsPerSecond: 64000 }` (mono is not directly selectable; channels follow the source `MediaStream`).
  - `MEDIUM` → `{ audioBitsPerSecond: 128000 }`.
  - `HIGH` → `{ audioBitsPerSecond: 192000 }`.
- The displayed `quality` badge on each Recording row reflects the user's selection at record time even when the underlying bitrate hint was not honored by the browser.

**Rationale**:

- Browser-side bitrate control is the only quality knob portable across Chromium and Safari.
- SC-005's "≥ 30 % size delta between adjacent tiers" is primarily an iOS / Android assertion; on Web it is best-effort (R-005 caveat called out in plan.md Technical Context).

**Alternatives considered**:

- *Re-encode in JS via Web Audio + `OfflineAudioContext` to enforce sample rate*: rejected. Adds enormous complexity, doubles file processing time, and produces marginal benefit for a demo-quality module.
- *Web-only "quality unavailable" UI*: rejected. The selector is a primary affordance — hiding it on Web fragments the UX. Better to attempt the bitrate hint and let the displayed badge reflect the *intent*.

**Citations**: WHATWG `MediaRecorder` specification; MDN `MediaRecorder.audioBitsPerSecond`; Spec FR-035 / SC-005.

---

## R-006 — Plugin coexistence with 017 (`with-vision`) and 018 (`with-speech-recognition`)

**Question**: Both 017 and 018 ship Expo config plugins that edit the iOS Info.plist. Specifically, **018 already adds `NSMicrophoneUsageDescription`**. How does 020's plugin avoid duplicating, overwriting, or conflicting with these?

**Decision**: 020's plugin uses the same `withInfoPlist` + "set if absent" pattern that 017 and 018 use. Concretely:

```ts
// plugins/with-audio-recording/index.ts (sketch)
const DEFAULT_MIC_USAGE = 'Audio Lab uses the microphone to demonstrate recording and playback.';

const withAudioRecording: ConfigPlugin = (config) =>
  withInfoPlist(config, (cfg) => {
    if (!cfg.modResults.NSMicrophoneUsageDescription) {
      cfg.modResults.NSMicrophoneUsageDescription = DEFAULT_MIC_USAGE;
    }
    return cfg;
  });
```

Because `withInfoPlist` is order-deterministic given a fixed `app.json` plugins array, and because every plugin uses "set if absent", **the final Info.plist contains exactly one `NSMicrophoneUsageDescription` entry whose value is supplied by whichever plugin runs first**. Either ordering (`[..., with-speech-recognition, with-audio-recording]` or the reverse) yields a valid build. Operator preference for one default copy over the other is honored by ordering the plugins; operator override of both is honored by setting `ios.infoPlist.NSMicrophoneUsageDescription` in `app.json` directly (in which case both plugins are no-ops on that key).

**Plugin test coverage** (mirrors `test/unit/plugins/with-speech-recognition/index.test.ts`):

1. Adds `NSMicrophoneUsageDescription` with the default copy when absent.
2. Preserves an existing operator-set `NSMicrophoneUsageDescription` (string equality after plugin run).
3. Idempotent: running plugin twice yields a deep-equal Info.plist (SC-009).
4. Coexists with 017's plugin: running `withVision` then `withAudioRecording` yields both `NSCameraUsageDescription` and `NSMicrophoneUsageDescription` with no other side effects.
5. Coexists with 018's plugin in either order: when 018 runs first, 020 preserves 018's value; when 020 runs first, 018 preserves 020's value.
6. Does NOT add `UIBackgroundModes` (D-04 / FR-044).
7. Does NOT modify entitlements, App Groups, `NSCameraUsageDescription`, or `NSSpeechRecognitionUsageDescription`.

**Rationale**:

- The "set if absent" pattern is a one-line idempotency guarantee that composes cleanly across N plugins.
- Operators who care about the exact copy can always override it in `app.json` — no plugin can clobber an operator-set value.
- Asserting both orderings in the test is cheap (~4 lines per ordering) and prevents a future plugin-ordering refactor from silently overwriting the wrong copy.

**Alternatives considered**:

- *Have 020's plugin always overwrite to its own default*: rejected. Hostile to operators and to feature 018; produces non-deterministic builds when two plugins disagree.
- *Have 020's plugin defer to 018 when 018 is also installed*: rejected. Plugins shouldn't introspect each other; the "set if absent" pattern already gives the right outcome with no coupling.

**Citations**: `plugins/with-vision/index.ts`; `plugins/with-speech-recognition/index.ts`; `test/unit/plugins/with-speech-recognition/index.test.ts`; Spec FR-040 / FR-041 / D-11.

---

## R-007 — `setAudioModeAsync` mapping for the five iOS categories (cross-platform)

**Question**: How do the five iOS audio session categories (Playback / Record / PlayAndRecord / Ambient / SoloAmbient) map to `expo-audio`'s `setAudioModeAsync` options object on each platform?

**Decision**: Authoritative mapping table lives in `contracts/audio-session-mapping.md`. Summary:

| Category | iOS (canonical) | Android (approximated) | Web |
|----------|-----------------|------------------------|-----|
| `Playback` | `{ allowsRecording: false, playsInSilentMode: true }` | Honored: `playsInSilentMode` ↔ `STREAM_MUSIC` routing | No-op (informational tooltip) |
| `Record` | `{ allowsRecording: true, playsInSilentMode: false }` | Honored: enables `RECORD_AUDIO` routing | No-op |
| `PlayAndRecord` | `{ allowsRecording: true, playsInSilentMode: true }` | Honored | No-op |
| `Ambient` | `{ allowsRecording: false, playsInSilentMode: false, interruptionMode: 'mixWithOthers' }` | Honored where Android supports `mixWithOthers` (via `AudioFocusRequest` ducking config) | No-op |
| `SoloAmbient` | `{ allowsRecording: false, playsInSilentMode: false, interruptionMode: 'duckOthers' }` | Honored similarly | No-op |

`mapCategoryToOptions(cat)` is pure and returns the same options object on every platform; the screen's `Platform.OS === 'web'` branch decides whether to render an Apply button (iOS / Android) or an informational tooltip (Web). This keeps `audio-session.ts` testable without platform mocks.

**Rationale**:

- Returning identical options on every platform isolates platform behavior to a single screen-level branch and keeps the mapping function trivially unit-testable.
- The Web no-op is documented behavior of `expo-audio`'s web backend; the screen-level tooltip explains it to the user.
- The Android approximation is best-effort: the Android audio framework does not have a 1:1 equivalent of every iOS category, but `playsInSilentMode` and `interruptionMode` cover the practically observable behaviors (silent-mode bypass for Playback; ducking / mixing for Ambient variants).

**Alternatives considered**:

- *Web-specific options object*: rejected. Adds a `Platform.OS` branch inside `audio-session.ts` for no behavioral benefit (the result is a no-op either way).
- *Direct call to `setAudioModeAsync` from inside `mapCategoryToOptions`*: rejected. Mixing pure mapping with side-effecting transport call complicates testing and violates the screen's "I own transport state" invariant.

**Citations**: `expo-audio` documentation — `setAudioModeAsync`; Apple `AVAudioSession` category reference; Spec FR-018 / FR-020 / FR-024 / FR-025 / D-09.

---

## R-008 — Hook cleanup on unmount

**Question**: How do `useAudioRecorder` and `useAudioPlayer` ensure clean teardown without `act()` warnings or leaked native handles?

**Decision**: Each hook installs a single `useEffect(() => () => { ... }, [])` cleanup that:

1. Calls the recorder's `stop()` / the player's `unload()` if a native instance is held (wrapped in try/catch to swallow benign "already stopped" errors).
2. `clearInterval` on the metering (recorder) / position (player) poll handle.
3. Removes any `expo-audio` event listener registrations.
4. Nulls the `useRef` holding the native instance.

Tests use RNTL's `cleanup()` (auto-invoked between tests) and assert no `console.error` / `console.warn` was emitted during teardown, mirroring 018's hook tests.

**Rationale**:

- A single cleanup function per hook keeps the teardown order deterministic and easy to audit.
- Wrapping the stop/unload call in try/catch is necessary because `expo-audio` can be in any of several internal states at unmount time; the cleanup must be defensive.

**Alternatives considered**:

- *Spread cleanup across multiple `useEffect` returns*: rejected. Easier to forget one; harder to reason about teardown order.
- *Rely on garbage collection*: rejected. Native handles aren't GC'd; without explicit `stop()`/`unload()` the OS-level recorder/player can keep the microphone or audio output engaged.

**Citations**: React docs — effect cleanup; `expo-audio` lifecycle documentation; Spec FR-031.

---

## R-009 — File-size humanization

**Question**: How is `sizeBytes` displayed in the Recordings list rows?

**Decision**: A small pure helper `bytesToHuman(n: number): string` (~10 LOC) returns:

- `< 1024` → `"NNN B"`
- `< 1024 * 1024` → `"N.N KB"`
- `< 1024 * 1024 * 1024` → `"N.N MB"`
- otherwise → `"N.N GB"`

(Decimal places trimmed to one for KB/MB/GB.) Used by `RecordingRow.tsx`. Source value comes from `FileSystem.getInfoAsync(uri).size` on iOS/Android and from `Blob.size` on Web (read at record-stop time and stored verbatim in the `Recording` record so the row formatter never needs to re-stat the file).

**Rationale**:

- Storing `sizeBytes` at record time avoids per-row I/O on list render.
- A pure helper is trivially unit-testable and avoids pulling in a dependency for one trivial formatting concern.

**Citations**: Spec FR-010; `expo-file-system` documentation.

---

## R-010 — Validation-Before-Spec assessment (Constitution v1.1.0)

**Question**: Does this feature trigger the Validate-Before-Spec mandate (proof-of-concept required before spec is finalized)?

**Decision**: **No.** This feature does not introduce a new build pipeline, infrastructure layer, or external service integration. It introduces:

- One new Expo package (`expo-audio`) with a documented Expo SDK 55 backend on iOS, Android, and Web — no novel-untested toolchain.
- Optionally one more Expo package (`expo-sharing`) with the same characteristic.
- One new Expo config plugin that mirrors the `withInfoPlist` + "set if absent" pattern already shipped twice in this repo (017 and 018) — JS-testable in CI with a mocked `@expo/config-plugins`.
- One additive Info.plist key (`NSMicrophoneUsageDescription`) — the system permission flow is well-documented and exercised on every iOS device today.

No EAS dry-run is needed because the plugin's merge logic is pure JS and is unit-tested. The existing `pnpm check` pipeline is sufficient validation.

**Citations**: `.specify/memory/constitution.md` v1.1.0 — Development Workflow §Validate-Before-Spec; precedent set by features 017 / 018 / 019.
