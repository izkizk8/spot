# Phase 0 — Research: Haptics Playground

All decisions below resolve `NEEDS CLARIFICATION` items implicit in the
plan template. No external proof-of-concept build is required (the
*Validate-Before-Spec* trigger does not fire — see plan §Constitution Check).

---

## R1 — Haptics library: `expo-haptics`

**Decision**: Use `expo-haptics` (Expo SDK 55 first-party, JS-pure).
Install with `npx expo install expo-haptics` so the version pin matches the
SDK.

**Rationale**:

- First-party Expo package, version-pinned to SDK 55. No native module work,
  no config plugin, no prebuild step.
- Provides the exact API surface the spec needs:
  `notificationAsync(NotificationFeedbackType.{Success|Warning|Error})`,
  `impactAsync(ImpactFeedbackStyle.{Light|Medium|Heavy|Soft|Rigid})`,
  `selectionAsync()`. That is 3 + 5 + 1 = 9 single-fire options, exactly
  matching FR-004 / FR-005 / FR-006 / FR-010.
- Cross-platform: iOS uses Taptic Engine, Android maps to closest vibrator
  pattern (FR-026), Web is a no-op-or-throw — we wrap the Web case in
  `haptic-driver.ts` so it is a guaranteed silent no-op (FR-028).

**Alternatives considered**:

- **`react-native-haptic-feedback`** — community package, requires its own
  autolink and ships no Web stub. Loses the "JS-only, no native work"
  property and forces us into a `.web.ts` split. Rejected.
- **Direct `Vibration` API from `react-native`** — only covers crude
  vibration patterns; no notification/impact taxonomy; no Taptic Engine on
  iOS. Rejected; would not satisfy the spec's nine-option taxonomy.
- **Custom Expo Modules API native module** — overkill for a feature whose
  whole point is to demo the existing `expo-haptics` taxonomy. Rejected.

---

## R2 — Single test seam: `haptic-driver.ts`

**Decision**: Wrap every `expo-haptics` call inside one tiny module
`src/modules/haptics-playground/haptic-driver.ts` with a single async
function:

```ts
play(kind: HapticKind, intensity?: HapticIntensity): Promise<void>
```

`kind ∈ {'notification','impact','selection'}`. `intensity` is required for
`'notification'` and `'impact'` and ignored (must be omitted) for
`'selection'`. On `Platform.OS === 'web'` the function returns a resolved
Promise without importing or calling any `expo-haptics` symbol at runtime
(the import is hoisted, but no call happens — see contract).

**Rationale** (FR-031):

- One file owns the third-party API surface. Every component, the composer,
  and the preset playback path call `driver.play(...)` and nothing else.
  This makes the entire feature unit-testable by mocking exactly one module
  (`expo-haptics`) in one place.
- Keeps the *Web no-op* and the iOS/Android dispatch in the same file, so
  the platform contract is grep-able as a single 30-line surface.
- Aligns with the spec 006 plug-in pattern: "modules own their seams".

**Alternatives considered**:

- **No wrapper, components call `expo-haptics` directly** — explodes the
  mock surface across 3+ component test files and forces the Web no-op
  guard into every call site. Rejected; would violate FR-031.
- **A class-based driver** — adds ceremony (instantiation, lifecycle) for
  zero benefit; the driver is stateless. Rejected in favour of a free
  async function.

---

## R3 — Persistence: AsyncStorage under `spot.haptics.presets`

**Decision**: Use `@react-native-async-storage/async-storage` (already a
dependency from spec 006). Store the entire preset list as a single
JSON-serialised array under the key `spot.haptics.presets`.

**Rationale**:

- Already in the dep tree; jest setup (`test/setup.ts`) already wires the
  official mock (`@react-native-async-storage/async-storage/jest/async-storage-mock`).
- Spec mandates the exact key in FR-018.
- Volume is tiny (a preset is ≤ 8 cells; an enthusiastic user might create
  ~10–50 presets — well under the AsyncStorage 6 MiB Android cap).
- Single-key whole-list-rewrite is the simplest correct strategy at this
  scale and removes the need for cross-key consistency or migration.

**Alternatives considered**:

- **One key per preset** (`spot.haptics.preset.<id>`) — saves a tiny amount
  of write bandwidth but adds list-key bookkeeping and partial-failure
  modes. Rejected at this volume.
- **`expo-sqlite`** — overkill; no relational queries needed. Rejected.
- **`MMKV`** — faster, but adds a new native dependency (config plugin
  territory). Rejected; keeps spec 008 a pure JS feature.

---

## R4 — Error tolerance for the presets store

**Decision**:

- `list()` catches *any* error from `AsyncStorage.getItem` or `JSON.parse`
  and resolves to `[]`. Per-entry shape validation is performed during
  parse and *invalid entries are skipped*; valid entries in the same blob
  are still returned (FR-024, FR-025).
- `save(pattern)` catches errors from `AsyncStorage.setItem` and resolves
  to `{ ok: false, error }` (or throws a typed `PresetsStoreError` —
  contract finalised in `contracts/presets-store.md`). The screen renders
  an inline notice; in-memory composer state is preserved (edge case
  "AsyncStorage write failure").
- `delete(id)` is a no-op for unknown ids; never throws.

**Rationale**: Matches FR-024 / FR-025 and the "AsyncStorage read failure"
/ "Corrupted presets payload" edge cases. A playground module must not
crash the host app on bad storage state.

**Alternatives considered**:

- **Throw on read failure** — would crash the screen on first cold launch
  after a corrupted write. Rejected.
- **Schema-validate via zod** — pulls in a runtime dep for a 4-field
  object. Rejected; hand-rolled type guards are sufficient at this scope.

---

## R5 — Auto-generated id and name

**Decision**:

- `id` = `${Date.now()}-${randomSuffix}` where `randomSuffix` is a 6-char
  base36 string from `Math.random()`. Collision probability across a
  human-paced save flow is effectively zero. (No `crypto.randomUUID()`
  reliance because RN doesn't ship it on every platform without a polyfill,
  and pulling in `expo-crypto` for a debug playground id is overkill.)
- `name` = `Preset N` where `N` is the smallest positive integer such that
  no existing preset already has that name. Computed by parsing the
  trailing integer out of existing names; entries that don't match the
  pattern are ignored for numbering purposes (FR-019).

**Rationale**: FR-019 mandates "next integer not already in use". Computing
N from the *parsed names* (not the array length) handles deletions
correctly: deleting `Preset 2` then saving a new preset must produce
`Preset 2`, not `Preset 4`.

**Alternatives considered**:

- **Sequence by `presets.length + 1`** — produces gaps after deletes that
  drift from the user's mental model. Rejected; FR-019 explicitly says
  "next integer not already in use".
- **`uuid` package** — extra dep for no functional gain on a debug
  playground. Rejected.

---

## R6 — 120 ms inter-cell spacing & cancellation

**Decision**: Implement playback in `PatternSequencer.tsx` as a single
`setTimeout`-chained loop — fire cell *i*, schedule cell *i+1* at 120 ms,
recurse — guarded by a cancel token held in a `useRef`. Cancel on:
re-press of Play, Save preset press, screen unmount, and on starting a
preset playback (so a composer playback and a preset playback can never
overlap). Tests use `jest.useFakeTimers()` and assert
`driver.play` is called with the right args after each `jest.advanceTimersByTime(120)`.

**Rationale**:

- `setTimeout` chains (rather than `setInterval`) make cancellation atomic
  and let us short-circuit cleanly mid-sequence (FR-016, edge case
  "Sequence playing while user navigates away").
- 120 ms is the spec target (FR-013) and the ±30 ms tolerance (SC-004) is
  comfortably above the JS event-loop jitter on a current-gen device.
- Fake timers are the standard jest-expo recipe for deterministic timing
  assertions; documented in `contracts/test-plan.md`.

**Alternatives considered**:

- **`setInterval` + counter** — harder to cancel mid-tick (the next tick
  may already be queued). Rejected.
- **Reanimated worklet timer** — pulls UI-thread complexity into a
  feature whose timing is JS-thread native. Rejected; the visual pulse
  uses Reanimated, but the *cadence* lives on the JS thread.

---

## R7 — Visual pulse via Reanimated Keyframe API

**Decision**: Each `HapticButton` exposes an imperative `pulse()` (or, more
ergonomically, internal trigger via a state increment) that runs a
Reanimated `Keyframe` animation: scale 1 → 1.08 → 1 over ~180 ms with
opacity 1 → 0.85 → 1. Honors the constitution's "Reanimated Keyframe API +
worklets; no Animated API" rule. Reduced-motion fallback: when
`AccessibilityInfo.isReduceMotionEnabled()` is true, swap to a single
opacity flash (no scale).

**Rationale**: FR-008 requires the pulse on every press regardless of
haptic support, and the constitution forbids the Animated API. Keyframe
plays on the UI thread so the pulse stays smooth even if the JS thread is
busy scheduling the next sequencer cell. Reduced-motion is the spec's
edge case ("Visual pulses MUST respect the platform reduced-motion
setting").

**Alternatives considered**:

- **`useSharedValue` + `withTiming` chain** — works, but Keyframe is the
  declarative idiom the constitution names explicitly. Rejected for
  consistency.
- **CSS animations on web** — would require a third codepath. Rejected;
  Reanimated runs on web too.

---

## R8 — Web banner placement

**Decision**: Render the banner inside `screen.tsx` at the top of the
content area, gated by a single `Platform.OS === 'web'` check (constitution
III explicitly permits a single-value branch). Banner is a `ThemedView`
with text "Haptics not supported on this platform" using `ThemedText`.
Components below the banner are unchanged — visual pulses still fire,
composer/play still work, presets still persist (FR-027 / FR-028 / FR-029).

**Rationale**: The banner is one line in one file; splitting `screen.tsx`
into `.web.tsx` would duplicate ~150 LOC for a 3-line difference. The
single-value-branch carve-out in constitution III is exactly designed for
this case.

**Alternatives considered**:

- **`screen.web.tsx` split** — duplication burden vs. clarity is a clear
  loss. Rejected.
- **A dedicated `<WebBanner />` component that returns `null` off-web** —
  cleaner abstraction; we'll do this if the banner grows beyond a
  one-liner. For v1 the inline branch is the right amount of structure.

---

## R9 — Test surface

**Decision**: Seven test files under `test/unit/modules/haptics-playground/`
(see plan §Project Structure). Each file's responsibility:

- `manifest.test.ts` — id matches `/^[a-z][a-z0-9-]*$/`, platforms ⊆
  {ios,android,web}, no `minIOS`, `render` is a function. (Complements the
  global `manifest.test.ts` from spec 006 — same assertions, scoped to this
  module.)
- `haptic-driver.test.ts` — for each `(kind, intensity)` pair, assert the
  expected `expo-haptics` API was called with the expected enum; assert
  Web returns a resolved promise without calling any `expo-haptics` API;
  assert `play('selection')` ignores the intensity argument.
- `presets-store.test.ts` — CRUD round-trip; corrupt-JSON tolerance;
  per-entry skip; id uniqueness across rapid saves; FR-019 N-numbering
  after delete.
- `components/HapticButton.test.tsx` — press calls
  `driver.play` with the right args; reduced-motion path doesn't crash.
- `components/PatternSequencer.test.tsx` — single tap cycles a cell
  through all 9 options + back to off; play with empty composer is a
  no-op (FR-015); play with mixed cells fires only the non-empty ones, in
  order, with 120 ms spacing (jest fake timers); re-pressing Play during
  playback cancels (FR-016).
- `components/PresetList.test.tsx` — renders names, tap-to-play invokes
  the parent `onPlay` with the saved pattern; delete removes the row.
- `screen.test.tsx` — integration: all three sections render; composer
  saves a preset that shows up in the list; web banner renders only when
  `Platform.OS === 'web'`.

**Rationale**: FR-035 and constitution V. Story-to-test mapping is
documented in `contracts/test-plan.md`.

---

## R10 — Story → quality gate mapping (for tasks.md)

| Story | Files touched | Tests that cover it |
|---|---|---|
| Story 1 — single-fire haptics | `index.tsx`, `screen.tsx`, `haptic-driver.ts`, `components/HapticButton.tsx`, registry update | `haptic-driver.test.ts`, `components/HapticButton.test.tsx`, `screen.test.tsx`, `manifest.test.ts` |
| Story 2 — composer | `components/PatternSequencer.tsx`, `screen.tsx` | `components/PatternSequencer.test.tsx`, `screen.test.tsx` |
| Story 3 — presets | `presets-store.ts`, `components/PresetList.tsx`, `screen.tsx` | `presets-store.test.ts`, `components/PresetList.test.tsx`, `screen.test.tsx` |
| Story 4 — cross-platform | `screen.tsx` (web banner branch), `haptic-driver.ts` (web no-op) | `haptic-driver.test.ts` (web case), `screen.test.tsx` (banner case) |

`pnpm check` (format → lint → typecheck → test) is the final gate — see
quickstart §Quality Gates.
