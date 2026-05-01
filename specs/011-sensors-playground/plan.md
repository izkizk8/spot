# Implementation Plan: Sensors Playground

**Branch**: `011-sensors-playground` | **Date**: 2026-05-21 | **Spec**: [spec.md](./spec.md)
**Input**: [`specs/011-sensors-playground/spec.md`](./spec.md)

## Summary

Add a new module `sensors-playground` to the iOS Feature Showcase plugin
registry that visualizes live device sensor data — Accelerometer,
Gyroscope, Magnetometer, and DeviceMotion — via `expo-sensors`. The
screen stacks four cards vertically; each card owns its own subscription
through a generic `useSensorStream` hook (the single seam tests mock),
displays three numeric readouts at 3-decimal precision, a sample-rate
segmented control (30 / 60 / 120 Hz, default 60), a per-card Start/Stop
button, and a small visualization (3-axis sliding bar chart, rotation
glyph, compass needle, or spirit level). A header Start All / Stop All
control toggles every available card at once. Per-axis ring buffers are
fixed at 60 samples with a 30-sample sliding window for the bar chart.
Cross-platform parity is enforced at the card level: `isAvailableAsync`
gates each card's controls; `requestPermissionsAsync` is called on first
Start when needed (DeviceMotion / Magnetometer on iOS), and a denied
permission renders an inline "Open Settings" notice via
`Linking.openSettings()`. The change is purely additive: one import line
in `src/modules/registry.ts`, no edits to features 006/007/008/009/010
beyond that. Tests are JS-pure (Jest on Windows): every component, card,
hook, and the ring-buffer utility is unit-tested with the
`expo-sensors`-wrapping seam mocked.

## Technical Context

**Language/Version**: TypeScript 5.9 (strict), React 19.2, React
Native 0.83, Expo SDK 55. Constitution v1.0.1 / v1.1.0 — both impose
the same gates (TS strict, StyleSheet, ThemedText/ThemedView, `@/*`
alias, test-first, cross-platform parity).
**Primary Dependencies**: `expo-sensors` (~55.0.13, bundled with SDK 55)
— **not yet installed**. Plan adds it via `npx expo install
expo-sensors`. Existing: `react-native`, `expo`, `expo-router`,
`expo-symbols` (for the gyroscope rotation glyph on iOS 17+),
`@/components/themed-*`, `@/constants/theme` (`Spacing`).
**Storage**: N/A. All state is local to each card (`useState` /
`useRef`); ring buffers live in refs to avoid re-renders per sample.
Discarded on unmount (FR-036, Out of Scope: persistence).
**Testing**: Jest 29.7 + `@testing-library/react-native` 13.3 on
Windows host (no native runtime). The `useSensorStream` hook wraps
`expo-sensors` so tests mock that hook (or `expo-sensors` directly)
rather than touching native modules. Manual on-device verification on
iOS / Android / desktop Web documented in `quickstart.md`.
**Target Platform**: iOS 13+ (no `minIOS` set — `expo-sensors`
supports back to iOS 13), Android (full sensor support, with the
caveat that >200Hz needs `HIGH_SAMPLING_RATE_SENSORS` — at 120 Hz we
stay under the cap), Web (Accelerometer / Gyroscope / DeviceMotion
only on browsers exposing the relevant APIs; Magnetometer is
**iOS+Android only** per `expo-sensors` docs and renders the
"Not supported in this browser" notice).
**Project Type**: mobile-app (Expo Router single project).
**Performance Goals**: SC-002 — visible UI update cadence matches the
selected sample rate (30 / 60 / 120 Hz) within display refresh limits.
SC-006 — sample-rate change applies in <100 ms with no Stop+Start
cycle. SC-007 — every subscription torn down before next frame on
unmount. We render readouts and visualizations from `useState`
snapshots taken from a ref-backed ring buffer; we do **not** call
`setState` on every raw sample at 120 Hz unless React's batching
suffices — see Decision 3 in `research.md` for the rate-limit/sample
strategy.
**Constraints**: Additive only (SC-010 — exactly one line added to
`src/modules/registry.ts`). No new global state, contexts, or
persistence (FR-041). All styles via `StyleSheet.create()` and the
`Spacing` scale (FR-042). TypeScript strict, `@/*` alias (FR-043). No
new lint/test tooling (FR-043). All four cards' titles, readouts row,
sample-rate control, and Start button render on every platform even
when the sensor is unavailable (FR-030, SC-003).
**Scale/Scope**: 1 module, 4 cards, 4 visualization components, 1
shared seam hook, 1 ring-buffer utility, 1 sample-rate picker, 1
permission notice, 1 screen, 1 manifest. ~13 source files, ~13 test
files. No platform-split files needed at this layer because the
expo-sensors API surface is platform-agnostic; per-platform
divergence happens inside the hook via `isAvailableAsync` /
`requestPermissionsAsync`.

### Library decision: `expo-sensors`

`expo-sensors` is the canonical Expo binding for the four required
sensor classes (`Accelerometer`, `Gyroscope`, `Magnetometer`,
`DeviceMotion`). The actual API differs from the description in the
user request; `research.md` documents the deviations and the
implementation defers to the docs:

- `addListener(cb)` returns an `EventSubscription` with a `.remove()`
  method. `removeAllListeners()` exists but is **deprecated** — use
  `subscription.remove()` per subscription instead.
- Permissions: `getPermissionsAsync()` and `requestPermissionsAsync()`
  return a `PermissionResponse` (`status`, `granted`, `canAskAgain`,
  `expires`).
- `Accelerometer` reports values in **g-force units** (1g ≈ 9.81
  m/s²), not m/s² as the user request loosely implied.
- `DeviceMotion` reports `rotation: { alpha, beta, gamma }` in
  **radians** where `alpha` ≈ yaw (Z), `beta` ≈ pitch (X), `gamma` ≈
  roll (Y). The Device Motion card maps these to its
  pitch/roll/yaw labels and converts to degrees for display.
- `Magnetometer` is iOS + Android only; it is **not** documented as
  Web-supported. The Magnetometer card MUST render its "Not supported"
  notice on Web (FR-030).

If `expo-sensors` is missing from `package.json` (verified: it is, as
of this plan), the very first implementation task is:

```sh
npx expo install expo-sensors
```

followed by `pnpm install` and `pnpm typecheck` to confirm types
resolve. If the iOS native config requires `NSMotionUsageDescription`
(it does — see Decision 5 in `research.md`), update `app.json` to add
the `expo-sensors` config plugin entry with the project's standard
permission copy.

## Constitution Check

Constitution at `.specify/memory/constitution.md` (v1.0.1 per spec
SC-008; file currently shows v1.1.0 — both versions impose the same
gates evaluated below).

| Principle | Status | How this plan complies |
|---|---|---|
| I. Cross-Platform Parity | ✅ | Module declares all three platforms (FR-001). Every card renders its title / readouts row / sample-rate control / Start button on every platform regardless of sensor availability (FR-030, SC-003). Cards whose sensor is unavailable render the "Not supported" notice and disable controls (FR-030); they don't hide. |
| II. Token-Based Theming | ✅ | All static surfaces use `ThemedText` / `ThemedView` and theme colors via `useTheme()`. The compass needle's rotation, the spirit-level disc's offset, and the bar-chart row widths derive from runtime sensor state (animated values), not hardcoded literals (FR-042). |
| III. Platform File Splitting | ✅ | `expo-sensors` is platform-agnostic (the package handles iOS / Android / Web internally), so no `.android.tsx` / `.web.tsx` siblings are required for this module. Per-sensor availability is detected at runtime via `isAvailableAsync`. The constitution permits inline `Platform.OS` for single-value differences; this module avoids even that — all branches are runtime-availability driven. |
| IV. StyleSheet Discipline | ✅ | All styles via `StyleSheet.create()` using the `Spacing` scale (FR-042). Animated style values (compass-needle `rotate`, spirit-level disc `translateX/Y`, bar-chart row widths) are passed as inline style **values** computed from state — permitted as a "single-value difference" by the constitution. No CSS-in-JS, no inline style objects defined outside StyleSheet. |
| V. Test-First for New Features | ✅ | Per FR-045 plus the user's expanded test list: `ring-buffer.test.ts`, `hooks/useSensorStream.test.tsx`, `components/{BarChart,CompassNeedle,SpiritLevel,SampleRatePicker}.test.tsx`, `cards/<each>.test.tsx`, `screen.test.tsx`, `manifest.test.ts`. Tests are written alongside or before each implementation file. JS-only; on-device manual verification documented in `quickstart.md`. |
| Tech constraints (TS strict, `@/*` alias, no Animated, no inline-style libs) | ✅ | Module is plain RN + `expo-sensors`. No animation framework needed for v1 (compass / spirit level / bar chart use direct style-value updates from state — see Decision 3 in `research.md`). Imports use `@/modules/...`, `@/components/...`, `@/constants/theme`. |
| Validate-Before-Spec (build-pipeline features) | n/a | This is a feature module, not a build/infra change. The library's behavior is validated indirectly via the live API docs cited in `research.md` and on-device runs in `quickstart.md`. |

**Gate result**: PASS. No Complexity Tracking entries required.

### Deliberate deviations from spec wording (non-violations)

The user's planning instructions (treated as authoritative — see User
Input) elaborate on the spec's structural intent in two places that
read literally as departures from FR-038 / FR-040 wording. Both are
deliberate refinements and are recorded here for the implement phase:

1. **Hook seam (FR-040)**. The spec wording suggests "one hook per
   sensor — `useAccelerometer`, `useGyroscope`, `useMagnetometer`,
   `useDeviceMotion`" wrapping `expo-sensors`. The plan instead
   provides a single generic `useSensorStream(module, rate, capacity)`
   that takes any of the four sensor classes by reference. The seam
   property the spec asks for ("tests can mock the seam rather than
   the underlying library") is preserved — tests mock
   `useSensorStream` (or `expo-sensors` itself). This reduces
   four near-identical hooks to one, which the user identified as the
   correct generalization.
2. **File layout (FR-038)**. The spec wording lists every component
   in a flat `components/` directory. The plan splits them into
   `cards/` (the four `*Card.tsx` files), `components/` (the
   reusable visualization primitives + `SampleRatePicker`), and
   `hooks/` (the seam). `index.tsx` (manifest) and `screen.tsx`
   remain at the module root. Every name the spec calls out is
   present; the only difference is which subdirectory it lives in.
   `catalog.ts` is omitted (no per-card metadata array is needed —
   the screen composes the four cards directly).

Both deviations make the module easier to test and read, and neither
weakens any requirement. The implement phase MAY back-patch the spec's
FR-038 / FR-040 wording on cleanup per the constitution's spec
back-patching workflow — but no change to the requirements' intent is
needed.

Re-check after Phase 1: PASS — design artifacts (data-model,
contracts, quickstart) introduce no new violations.

## Project Structure

### Documentation (this feature)

```text
specs/011-sensors-playground/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output (manual on-device steps)
├── contracts/
│   ├── module-manifest.md   # Manifest contract (extends @/modules/types)
│   ├── sensor-stream-hook.md # useSensorStream seam contract
│   └── ring-buffer.md       # Ring-buffer utility contract
├── spec.md
└── checklists/
```

### Source Code (repository root)

```text
src/modules/sensors-playground/
├── index.tsx                       # ModuleManifest export
├── screen.tsx                      # Header (Start All / Stop All) + 4 cards stacked
├── ring-buffer.ts                  # Pure utility: push, snapshot(n), length, clear
├── hooks/
│   └── useSensorStream.ts          # Generic seam wrapping any expo-sensors class
├── cards/
│   ├── AccelerometerCard.tsx       # x/y/z readouts + BarChart
│   ├── GyroscopeCard.tsx           # x/y/z readouts + RotationIndicator (SF Symbol on iOS 17+)
│   ├── MagnetometerCard.tsx        # x/y/z readouts + CompassNeedle
│   └── DeviceMotionCard.tsx        # pitch/roll/yaw readouts (degrees) + SpiritLevel
└── components/
    ├── BarChart.tsx                # 3-row sliding-window chart from RN Views
    ├── CompassNeedle.tsx           # Rotated needle from magnetometer x/y
    ├── SpiritLevel.tsx             # Inner disc offset from pitch/roll
    ├── SampleRatePicker.tsx        # 3-segment 30 / 60 / 120 Hz control
    ├── RotationIndicator.tsx       # SF Symbol on iOS 17+, fallback glyph elsewhere
    └── PermissionNotice.tsx        # "Not supported" / "Permission denied + Open Settings"

src/modules/registry.ts             # +1 import line, +1 array entry (only edit outside the module dir)
app.json                            # +expo-sensors config plugin entry (NSMotionUsageDescription)
```

```text
test/unit/modules/sensors-playground/
├── manifest.test.ts                       # id/platforms invariant
├── screen.test.tsx                        # Header label, 4 cards rendered, Start All / Stop All wiring
├── ring-buffer.test.ts                    # push/snapshot/length/clear + 61st-sample evicts oldest
├── hooks/
│   └── useSensorStream.test.tsx           # Mocks expo-sensors module; covers start/stop, rate change, permission flow, availability, cleanup-on-unmount
├── cards/
│   ├── AccelerometerCard.test.tsx         # Mocks useSensorStream; asserts readouts + chart updates
│   ├── GyroscopeCard.test.tsx             # Mocks useSensorStream; asserts integrated-yaw rotation
│   ├── MagnetometerCard.test.tsx          # Mocks useSensorStream; asserts compass direction + denied-state notice
│   └── DeviceMotionCard.test.tsx          # Mocks useSensorStream; asserts pitch/roll/yaw readouts + spirit-level offset
└── components/
    ├── BarChart.test.tsx                  # Sliding window of 30 from a 60-cap buffer
    ├── CompassNeedle.test.tsx             # Angle math from x/y; near-zero magnitude holds previous angle
    ├── SpiritLevel.test.tsx               # Inner disc offset saturates at outer edge
    └── SampleRatePicker.test.tsx          # Three options, default 60, change emits 30/60/120
```

**Structure Decision**: Mirrors the per-module manifest pattern of
`src/modules/sf-symbols-lab/` and `src/modules/swiftui-interop/`.
Unlike `swiftui-interop`, this module needs **no** platform-split
files because `expo-sensors` is itself a platform-agnostic API —
per-platform behavior is detected at runtime via `isAvailableAsync` /
`requestPermissionsAsync` and surfaced through the same `<PermissionNotice />`
component on every platform. The `useSensorStream` hook is the
single mock seam (FR-040) — it's the only file in the module that
imports `expo-sensors`, which makes per-card tests trivial: they
mock `@/modules/sensors-playground/hooks/useSensorStream` and feed
synthetic samples in via the returned object.

## Complexity Tracking

> No constitutional violations. Section intentionally empty.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| — | — | — |
