# Phase 0 Research: Sensors Playground

All NEEDS CLARIFICATION items from the spec are resolved here. The one
explicit marker (numeric readout units & precision) is closed in
Decision 1. Library API surface is captured in Decision 2 from the
official `expo-sensors` docs and reconciled against the user's
description.

## Decision 1: Numeric precision and units (resolves spec NEEDS CLARIFICATION)

- **Decision**: All numeric readouts render to **3 decimal places**
  consistently across all four cards. Internal state retains the
  raw value as returned by `expo-sensors` (no rounding in the ring
  buffer). For Device Motion, the API returns angles in **radians**
  (`rotation.alpha` / `.beta` / `.gamma`); the Device Motion card
  **converts to degrees for display only** (`rad * 180 / Math.PI`)
  while keeping the raw radians in state. Accelerometer readouts are
  in g-force units (the API's native unit) with a small unit suffix.
  Gyroscope readouts are in rad/s. Magnetometer readouts are in μT.
- **Rationale**: The user-provided planning input pins this directly.
  Three decimals is enough resolution to feel responsive at 120 Hz
  without overflowing the readout column. Keeping raw radians in state
  preserves precision for the spirit-level computation; converting only
  at the text layer keeps the visualization math consistent with the
  API.
- **Alternatives considered**:
  - 2 decimals — too coarse; small tilts disappear in the readouts.
  - 4+ decimals — visually noisy and overflows the row at 120 Hz.
  - Convert to degrees in state — rejected: forces the spirit-level
    math to convert back, doubling the conversion cost and hiding the
    API's native units from anyone reading the code.

## Decision 2: `expo-sensors` API — actual surface vs user description

Source: `https://docs.expo.dev/versions/latest/sdk/sensors/` plus the
per-sensor pages (Accelerometer, Gyroscope, Magnetometer,
DeviceMotion), fetched 2026-05-21. **The actual API differs from the
description in the user request in five places — implementation MUST
defer to the docs.**

### Imports

```ts
import { Accelerometer, Gyroscope, Magnetometer, DeviceMotion } from 'expo-sensors';
```

All four classes extend a common `DeviceSensor<Measurement>` base and
share the same method surface.

### Method surface (per sensor class)

| Method | Returns | Notes |
|---|---|---|
| `addListener(listener)` | `EventSubscription` | `subscription.remove()` is the canonical teardown. |
| `removeSubscription(subscription)` | `void` | Equivalent to `subscription.remove()`. |
| `removeAllListeners()` | `void` | **Deprecated** per docs — use `subscription.remove()` per listener. |
| `setUpdateInterval(intervalMs)` | `void` | Sets next-update cadence. Android 12+ caps at 200 Hz unless `HIGH_SAMPLING_RATE_SENSORS` is granted (we stay under at 120 Hz). |
| `isAvailableAsync()` | `Promise<boolean>` | "You should always check the sensor availability before attempting to use it." |
| `getPermissionsAsync()` | `Promise<PermissionResponse>` | `{ status, granted, canAskAgain, expires }`. |
| `requestPermissionsAsync()` | `Promise<PermissionResponse>` | Same shape. |
| `getListenerCount()` | `number` | Diagnostic. |
| `hasListeners()` | `boolean` | Diagnostic. |

### Measurement shapes

| Class | Measurement | Units |
|---|---|---|
| `Accelerometer` | `{ x, y, z, timestamp }` | **g-force** (1 g ≈ 9.81 m/s²) |
| `Gyroscope` | `{ x, y, z, timestamp }` | rad/s |
| `Magnetometer` | `{ x, y, z, timestamp }` | μT |
| `DeviceMotion` | `{ acceleration, accelerationIncludingGravity, rotation: { alpha, beta, gamma, timestamp }, rotationRate, orientation, interval }` | radians for `rotation`, deg/s for `rotationRate`, m/s² for accelerations |

### DeviceMotion axis mapping (used by the Device Motion card)

The Device Motion card displays **pitch / roll / yaw**. The spec's
labels map to `expo-sensors` `rotation` axes as:

- `yaw`   = `rotation.alpha` (rotation about Z)
- `pitch` = `rotation.beta`  (rotation about X)
- `roll`  = `rotation.gamma` (rotation about Y)

These are radians; the card converts to degrees for display (Decision 1)
and uses the radian values directly to drive the spirit-level disc
offset.

### Platform availability

| Sensor | iOS | Android | Web |
|---|:-:|:-:|:-:|
| `Accelerometer` | ✅ | ✅ | ✅ (browser-dependent) |
| `Gyroscope` | ✅ | ✅ | ✅ (browser-dependent) |
| `Magnetometer` | ✅ | ✅ | ❌ (not listed in docs) |
| `DeviceMotion` | ✅ | ✅ | ✅ (requires HTTPS + user-gesture permission on iOS Safari) |

The Magnetometer card MUST therefore render the "Not supported in this
browser" notice on Web (FR-030). For the other three, `isAvailableAsync`
returns the runtime answer (some desktop browsers don't expose
DeviceMotion APIs).

### iOS permissions

`DeviceMotion` and `Magnetometer` use the system motion permission,
which requires `NSMotionUsageDescription` in `Info.plist`. The
`expo-sensors` config plugin sets it via:

```jsonc
// app.json
{
  "expo": {
    "plugins": [
      ["expo-sensors", {
        "motionPermission": "Allow Spot to access your device motion"
      }]
    ]
  }
}
```

`Accelerometer` and `Gyroscope` do **not** trigger a permission prompt
on iOS (FR-034). The hook gates the prompt by which class is being
streamed.

### Web permissions

iOS Safari requires `DeviceMotion.requestPermissionsAsync()` to be
called **inside a user gesture** (touch). The hook calls it inside
the per-card `Start` press handler, which is itself dispatched from
a `Pressable` `onPress` — that's a valid user gesture.

### Deviations from the user's description (recorded for clarity)

| User request said | Actual API |
|---|---|
| "addListener, removeAllListeners" | `addListener(cb): EventSubscription`; use `subscription.remove()`. `removeAllListeners()` is deprecated. |
| "setUpdateInterval(ms)" | ✅ matches |
| "isAvailableAsync, requestPermissionsAsync" | ✅ matches; also `getPermissionsAsync()` (used to detect already-granted state without prompting). |
| (implicit) "accelerometer in m/s²" | g-force units. We label readouts accordingly. |
| (implicit) "DeviceMotion exposes pitch/roll/yaw" | API exposes `rotation: { alpha, beta, gamma }` in radians; card maps them to pitch/roll/yaw labels and converts to degrees for display. |

None of these deviations require spec changes — the spec speaks at the
right altitude ("`addListener`", "`setUpdateInterval`", "permission
required on iOS for the magnetometer in particular"). They are
recorded so the implement phase doesn't have to re-derive them.

- **Decision**: Use `expo-sensors` directly via the four classes
  imported by name. Wrap each subscription cycle in the
  `useSensorStream` hook. Use `subscription.remove()` (not
  `removeAllListeners`) for teardown. Use `getPermissionsAsync` first;
  only call `requestPermissionsAsync` if status is `undetermined` and
  the user pressed Start.
- **Alternatives considered**:
  - Roll our own native bridge — rejected (FR-024-equivalent: no new
    tooling, no new native modules).
  - Use `react-native-sensors` — rejected: not in the project, adds a
    native dep; `expo-sensors` is the SDK-blessed choice.

## Decision 3: Sample handling and re-render strategy

- **Decision**: Each card's `useSensorStream` instance pushes every
  sample into a **ref-backed ring buffer** (`useRef<RingBuffer>`),
  *not* into React state. The hook also exposes a separate
  `displaySample` `useState({x, y, z, timestamp})` that the hook
  updates **on every sample at all three rates** (30 / 60 / 120 Hz).
  At 120 Hz this is one `setState` per ~8.3 ms, which React 19's
  automatic batching + the React Compiler handle without UI-thread
  starvation in practice. Visualizations that need the full window
  (BarChart, CompassNeedle smoothing) read from the ring buffer via a
  `subscribeToSnapshot(cb)` API exposed on the hook return: the hook
  notifies subscribers once per sample and the subscriber calls
  `ringBuffer.snapshot(30)` to get a copy.
- **Rationale**: Storing the raw stream in a ref keeps memory bounded
  (FR-026 / SC-005) without forcing every component re-render to
  rebuild a 60-element array. Driving the readouts from `displaySample`
  keeps the rendered text in sync with each frame the user can
  perceive (the visible text is the cheapest part of the render).
  Subscribers that need the chart can opt in.
- **If 120 Hz proves too aggressive on lower-end Android devices**
  (manual verification per `quickstart.md`), the implement phase MAY
  add a `requestAnimationFrame`-throttled UI tick that batches the
  most-recent sample for `setState`, while still pushing every raw
  sample into the ring buffer. Recorded as a fallback, not a v1
  requirement.
- **Alternatives considered**:
  - State-only (no ref buffer) — rejected: every sample re-builds the
    array, GC churn at 120 Hz is real.
  - Reanimated `useSharedValue` for visualizations — rejected: spec
    forbids the Animated API by name (Tech constraints), and
    Reanimated is permitted but adds a worklet boundary that's
    unnecessary for a v1 chart of 30 RN `<View>`s.
  - Skia / a chart library — rejected: spec explicitly forbids any
    chart library, and the bar chart is "animated `<View>` width
    only" (FR-017).

## Decision 4: Cross-card coordination (Start All / Stop All)

- **Decision**: Each card owns its own `useSensorStream` instance
  (and therefore its own state). The screen wires the header
  Start All / Stop All button via a small **in-module event bus** —
  a singleton `EventEmitter` exported from
  `screen.tsx` (or an internal `events.ts`) that each card
  subscribes to in `useEffect`. On a `'startAll'` event, each card
  calls its hook's `start()` if `isAvailable && permissionState !==
  'denied'`. On `'stopAll'`, each calls `stop()`. The header label
  derives from a parent-level "any card running?" boolean tracked
  via a count exposed by each card via the same emitter (`'started'`
  / `'stopped'` events). This satisfies FR-013 / FR-014 / FR-015
  without introducing a global store (FR-041).
- **Rationale**: An emitter local to one module is not a "global
  store" in the constitutional sense — it's an intra-module
  composition primitive. The per-card hook still owns the actual
  subscription state. Tests for `screen.test.tsx` instantiate the
  screen with mocked cards (or spy on the emitter) to verify the
  Start All / Stop All wiring without driving real sensor APIs.
- **Alternatives considered**:
  - React refs forwarded from each card to the screen — works but
    requires drilling four refs through the screen and exposing
    imperative handles, which is uglier than the emitter.
  - A React context — rejected by FR-041.
  - Lifting all state to the screen — rejected: bloats the screen
    component and complicates per-card unit testing.

## Decision 5: Permissions and "Open Settings" affordance

- **Decision**: The permission flow is owned by `useSensorStream`:
  1. On mount, call `Sensor.isAvailableAsync()` and
     `Sensor.getPermissionsAsync()` (where the sensor requires
     permission). Cache the results into the hook's
     `{ isAvailable, permissionState }` return.
  2. On `start()`: if `permissionState === 'undetermined'`, call
     `requestPermissionsAsync()` and re-evaluate before subscribing.
  3. If `permissionState === 'denied'`, do not subscribe; surface
     the state so the card can render `<PermissionNotice variant="denied" />`.
  4. The notice's "Open Settings" button calls
     `Linking.openSettings()` from `react-native`. (Per spec
     Assumptions: this is the standard affordance and is reliable on
     iOS for opening the host app's settings.)
- For Accelerometer and Gyroscope, the hook treats permission as
  `notRequired` (FR-034) and skips the get/request flow entirely.
- **Web**: iOS Safari requires `DeviceMotion.requestPermissionsAsync()`
  inside a user gesture; calling it from `Start`'s `onPress` satisfies
  this. Other browsers: `requestPermissionsAsync` resolves to
  `{ status: 'granted' }` for permissionless sensors.
- **Defensive wrapping** (FR-035): every probe is wrapped in
  `try/catch`; on throw, the hook records `isAvailable: false` and
  the card renders the "Not supported" notice rather than crashing.
- **Rationale**: Centralizing this in the hook keeps each card free
  of permission boilerplate and makes the seam testable: tests can
  return any permission state from the mock and assert the card's
  branching.

## Decision 6: Visualizations — math sketch

Recorded so the implement phase doesn't have to derive these:

- **BarChart**: Three rows, one per axis. Each row is a horizontal
  flexbox of 30 `<View>`s. Each `<View>` has a fixed height and a
  `width` proportional to `Math.min(1, Math.abs(sample) / SCALE)`.
  Sign is encoded by background color (positive vs negative). `SCALE`
  is per-sensor (e.g. ~2 g for accelerometer, ~5 rad/s for gyroscope,
  ~50 μT for magnetometer). Snapshot read via the hook's
  `subscribeToSnapshot(30)` API.
- **CompassNeedle**: Angle = `Math.atan2(y, x)` (radians). Render a
  thin rotated rect via `transform: [{ rotate: '${angleDeg}deg' }]`.
  Near-zero magnitude (`Math.hypot(x,y) < EPS`) holds the previous
  angle in a ref and renders a "no signal" tint (Edge Case from
  spec).
- **SpiritLevel**: Outer circle of fixed diameter D. Inner disc
  translated by `(roll * GAIN, pitch * GAIN)` clamped to a circle of
  radius `(D - innerD) / 2`. `GAIN` chosen so ~30° tilt saturates the
  edge. Reset to centre on Stop.
- **RotationIndicator** (Gyroscope card, FR-019): integrate `gyro.z *
  dt` since Start was tapped, where `dt` is derived from consecutive
  `sample.timestamp` values (seconds — `expo-sensors` doc explicitly
  says timestamps are in seconds). Render as an SF Symbol on iOS 17+
  via `expo-symbols`, fallback to a glyph (e.g. "↻") with a `rotate`
  transform on other platforms.

## Decision 7: Test strategy

- **Decision**: Jest with `@testing-library/react-native`. Three
  layers of mocking, applied per test:
  1. **`ring-buffer.test.ts`**: pure utility — no mocks. Covers
     `push`, `snapshot(n)`, `length`, `clear`, and the eviction
     invariant (61st `push` evicts oldest).
  2. **`hooks/useSensorStream.test.tsx`**: mocks `expo-sensors`
     (`jest.mock('expo-sensors', () => ({ Accelerometer: { ... } }))`).
     Covers: start/stop, rate change → `setUpdateInterval` call,
     permission denied path, `isAvailableAsync` false path,
     `subscription.remove()` called on unmount, throw-during-probe
     gracefully sets `isAvailable: false`.
  3. **`cards/<Sensor>Card.test.tsx`** and
     **`components/*.test.tsx`**: mock `useSensorStream` to a
     synchronous controllable stub and assert each card's reaction
     (readouts update, chart updates, denied notice renders, etc.).
- **`screen.test.tsx`**: mocks the four cards (or the emitter) and
  asserts the Start All / Stop All button label flips and the right
  events fire.
- **`manifest.test.ts`**: imports the manifest, asserts `id`,
  `platforms`, `title`, `description`, and that
  `MODULES.includes(manifest)` from `@/modules/registry`.
- **No native runtime is invoked** — Jest runs on Windows host.
- **Manual on-device verification** (real `expo-sensors` behavior, SC-002 cadence,
  SC-009 Open Settings round-trip) is in `quickstart.md`.

## Decision 8: Quality gates

- **Decision**: `pnpm check` (defined as `pnpm format:check && pnpm
  lint && pnpm typecheck && pnpm test`) must pass with no warnings
  introduced (SC-011 / FR-044).
- **Rationale**: Single project-wide gate, no new tooling.
- **Alternatives considered**: a module-scoped gate — rejected; the
  project canonical gate is `pnpm check`.

## Open items

None. All NEEDS CLARIFICATION items are closed; all API uncertainties
are resolved against the live `expo-sensors` documentation. If
implement-phase discovery reveals a behavior contradicting any
decision above (e.g. `setUpdateInterval` semantics differ on a given
platform), back-patch this file and the spec per the constitution's
spec back-patching workflow before the affected task is marked done.
