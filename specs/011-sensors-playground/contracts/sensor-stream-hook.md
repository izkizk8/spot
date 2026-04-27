# Contract: `useSensorStream`

The single seam through which every card subscribes to `expo-sensors`.
Tests MUST mock this hook (or `expo-sensors` itself) — no card may
import `expo-sensors` directly. (FR-040, satisfied by a generic seam
per the deviation note in `plan.md`.)

## Signature

```ts
import { Accelerometer, Gyroscope, Magnetometer, DeviceMotion } from 'expo-sensors';

/** Any of the four sensor classes. */
export type SensorClass =
  | typeof Accelerometer
  | typeof Gyroscope
  | typeof Magnetometer
  | typeof DeviceMotion;

export interface UseSensorStreamOptions<TSample> {
  /** The expo-sensors class instance to subscribe to. */
  sensor: SensorClass;
  /** Map the API's measurement object to the card's sample type. */
  mapSample: (raw: unknown) => TSample;
  /** Whether this sensor needs a runtime permission (true for DeviceMotion + Magnetometer on iOS). */
  requiresPermission: boolean;
  /** Sample rate in Hz; the hook converts to ms and calls setUpdateInterval. */
  rate: SampleRate;
  /** Ring-buffer capacity. Defaults to 60. */
  capacity?: number;
}

export function useSensorStream<TSample>(
  options: UseSensorStreamOptions<TSample>,
): SensorStreamHandle<TSample>;

export interface SensorStreamHandle<TSample> {
  readonly isAvailable: boolean;
  readonly permissionState: PermissionState;
  readonly isRunning: boolean;
  readonly latest: TSample | null;
  /** Most-recent N samples in chronological order. */
  snapshot(n: number): readonly TSample[];
  /** Subscribe to per-sample ticks without re-rendering. Returns unsubscribe. */
  subscribeToSnapshot(listener: () => void): () => void;
  /** Start subscription; requests permission first if needed. */
  start(): Promise<void>;
  /** Stop subscription; safe to call when already stopped. */
  stop(): void;
  /** Force a permission request flow. */
  requestPermission(): Promise<PermissionState>;
}
```

## Behavior

### Mount

1. Call `sensor.isAvailableAsync()` (wrapped in try/catch).
   - On `false` or throw → `isAvailable = false`, `permissionState =
     'notRequired'`. The card MUST render `<PermissionNotice
     variant="unsupported" />` and disable controls (FR-030, FR-035).
2. If `requiresPermission`, call `sensor.getPermissionsAsync()`
   (try/catch). Set `permissionState` from `response.status` mapped to
   one of `'granted' | 'denied' | 'undetermined'`. On throw →
   `permissionState = 'undetermined'` (the Start press will trigger
   `request`).
3. If `!requiresPermission`, set `permissionState = 'notRequired'`.
4. Allocate a `RingBuffer<TSample>` of `capacity` (default 60) in a
   `useRef`.

### `start()`

1. If `!isAvailable`, no-op (return resolved void).
2. If `requiresPermission`:
   - If `permissionState === 'undetermined'`, call
     `requestPermissionsAsync()`. Update state. If denied, no-op.
   - If `permissionState === 'denied'`, no-op.
3. Call `sensor.setUpdateInterval(RATE_TO_INTERVAL_MS[rate])`.
4. Call `sensor.addListener(handler)` and store the returned
   `EventSubscription` in a ref.
5. Set `isRunning = true`.
6. The handler:
   - Maps the raw measurement via `mapSample`.
   - Pushes into the ring buffer (ref).
   - Calls `setLatest(sample)` (state — drives readouts).
   - Notifies all `subscribeToSnapshot` subscribers.

### `stop()`

1. If a subscription is held, call `subscription.remove()` and clear
   the ref.
2. Set `isRunning = false`.
3. Do **not** clear the ring buffer (so the visualization can freeze
   on the last samples — FR-005, FR-008).

### Rate change (`rate` prop change while `isRunning`)

The hook's `useEffect([rate])` MUST call `sensor.setUpdateInterval(...)`
immediately, **without** removing and re-adding the listener (FR-011,
SC-006). If `!isRunning`, the new value is recorded for the next
`start()` (FR-012).

### Unmount

1. If `isRunning`, call `subscription.remove()` (FR-036, SC-007).
2. Drop all `subscribeToSnapshot` subscribers.

### Defensive wrapping (FR-035)

Every call into `expo-sensors` is wrapped in `try/catch`. On any
unexpected throw during a probe, the hook treats the sensor as
`isAvailable = false`. On a throw inside the listener, the hook
catches and logs (`console.warn`) without re-throwing.

## Test invariants

`test/unit/modules/sensors-playground/hooks/useSensorStream.test.tsx`
MUST cover:

| Scenario | Assertion |
|---|---|
| Sensor available, no permission needed | After `start()`, mocked `addListener` called once, `setUpdateInterval` called with mapped ms |
| `isAvailableAsync` returns false | `isAvailable === false`; `start()` is a no-op (no `addListener` call) |
| `isAvailableAsync` throws | Same as above; no unhandled rejection |
| Permission `undetermined` → `start()` triggers `requestPermissionsAsync` | mocked request called; on `granted`, listener attaches |
| Permission `denied` | `start()` does not subscribe; `permissionState === 'denied'` |
| Rate change while running | `setUpdateInterval` re-called; `addListener` NOT re-called |
| Sample handler updates `latest` and pushes to ring buffer | `latest` reflects most-recent sample; `snapshot(N)` returns N most-recent |
| `subscribeToSnapshot` listener fires once per sample | Counter increments per emitted sample; unsubscribe stops it |
| Unmount while running | Mocked `subscription.remove()` called once |
| `stop()` after `start()` | `subscription.remove()` called; `isRunning === false`; ring buffer NOT cleared |

## Why a generic seam (vs four per-sensor hooks)

The spec's wording (FR-040) lists `useAccelerometer` /
`useGyroscope` / `useMagnetometer` / `useDeviceMotion` as examples.
The plan refines this to a single generic `useSensorStream` because:

- The four sensors share an identical method surface (`addListener`,
  `setUpdateInterval`, `isAvailableAsync`, `getPermissionsAsync`,
  `requestPermissionsAsync`).
- The only sensor-specific bit is the measurement shape — captured by
  the `mapSample` callback.
- The seam property the spec demands ("tests can mock the seam rather
  than the underlying library") is preserved: tests mock the single
  `useSensorStream` import per card.
- Four near-identical hooks would duplicate ~80 lines each of
  permission / availability / lifecycle plumbing for zero benefit.

This is a structural refinement, not a requirement change.
