# Phase 1 Data Model: Sensors Playground

All entities live in-memory only. No persistence, no global stores,
no network calls. Every entity is local to a single card or to the
generic seam hook (one instance per card).

## Type aliases

```ts
/** The four sensor identities surfaced in the UI. */
export type SensorKind =
  | 'accelerometer'
  | 'gyroscope'
  | 'magnetometer'
  | 'deviceMotion';

/** Allowed sample rates in Hz. */
export type SampleRate = 30 | 60 | 120;

/** Maps Hz → ms for setUpdateInterval. */
export const RATE_TO_INTERVAL_MS: Record<SampleRate, number> = {
  30: Math.round(1000 / 30),   // 33
  60: Math.round(1000 / 60),   // 17
  120: Math.round(1000 / 120), // 8
};

/** Per-card permission state. */
export type PermissionState =
  | 'granted'
  | 'denied'
  | 'undetermined'
  | 'notRequired';

/** Per-card runtime availability. */
export type Availability =
  | 'available'
  | 'unsupported'      // isAvailableAsync → false (or threw)
  | 'permissionDenied';
```

## Entities

### `SensorSample`

A single reading. Two shapes — one for the three xyz sensors, one for
DeviceMotion's orientation block.

```ts
/** Accelerometer / Gyroscope / Magnetometer sample. */
export interface XYZSample {
  readonly x: number;
  readonly y: number;
  readonly z: number;
  /** Seconds, as expo-sensors provides. */
  readonly timestamp: number;
}

/** DeviceMotion sample (radians, raw from rotation block). */
export interface MotionSample {
  /** rotation.beta — rotation about X, "pitch". Radians. */
  readonly pitch: number;
  /** rotation.gamma — rotation about Y, "roll". Radians. */
  readonly roll: number;
  /** rotation.alpha — rotation about Z, "yaw". Radians. */
  readonly yaw: number;
  /** Seconds, from rotation.timestamp. */
  readonly timestamp: number;
}
```

**Validation**:

- `x`, `y`, `z`, `pitch`, `roll`, `yaw` are unbounded floats; the UI
  clamps to `[-SCALE, +SCALE]` for visualization but stores raw.
- `timestamp` is monotonically non-decreasing within a single
  subscription. The hook does NOT enforce this — it trusts the API.

### `RingBuffer<T>`

Pure utility (`src/modules/sensors-playground/ring-buffer.ts`).
Fixed-capacity FIFO with O(1) push and O(n) snapshot.

```ts
export interface RingBuffer<T> {
  /** Append; if length === capacity, evict oldest first. */
  push(value: T): void;
  /** Most-recent N items in chronological order (oldest first). */
  snapshot(n: number): readonly T[];
  /** Current number of stored items (0..capacity). */
  length: number;
  /** Drop all items. */
  clear(): void;
  /** Immutable. */
  readonly capacity: number;
}

export function createRingBuffer<T>(capacity: number): RingBuffer<T>;
```

**Invariants** (asserted by `ring-buffer.test.ts`):

- `capacity > 0` (constructor throws otherwise).
- `length <= capacity` always.
- After `capacity` pushes, the next push evicts the oldest.
- `snapshot(n)` returns at most `min(n, length)` items, always in
  chronological order.
- `clear()` resets `length` to 0 without changing `capacity`.

### `CardState` (per-card local state)

Lives inside each `*Card.tsx` and the hook it consumes.

| Field | Type | Source | Notes |
|---|---|---|---|
| `running` | `boolean` | `useState` in card | Reflects "is the subscription active" — set by Start / Stop. |
| `rate` | `SampleRate` | `useState` in card | Defaults to `60`. Persisted only for the lifetime of the card mount. |
| `availability` | `Availability` | from hook | Derived: `unsupported` if `isAvailableAsync` returned false or threw; `permissionDenied` if `permissionState === 'denied'`; else `available`. |
| `permissionState` | `PermissionState` | from hook | `'notRequired'` for Accelerometer / Gyroscope. |
| `displaySample` | `XYZSample \| MotionSample \| null` | `useState` in hook | Most-recent sample; drives readouts. `null` before first sample. |
| `ringBuffer` | `RingBuffer<XYZSample \| MotionSample>` | `useRef` in hook | Capacity 60 (FR-026). One per axis is **not** needed — one buffer of compound samples is enough; per-axis snapshots are derived in the consumer (`samples.map(s => s.x)`). |
| `integratedYaw` | `number` (radians) | `useRef` in GyroscopeCard | Accumulated `gyro.z * dt` since last Start. Reset to 0 on first Start; preserved across Stop/Start within the same mount (FR-020). |

**Transitions**:

```text
Stopped --tap Start--> (Permission check) --[granted]--> Started
                                          --[denied]--> Stopped + denied notice
Started --tap Stop--> Stopped
Started --rate change--> Started (calls setUpdateInterval immediately)
Stopped --rate change--> Stopped (only updates the value next Start uses)
Started --unmount--> teardown (subscription.remove(), ring buffer GC'd)
Started --permission revoked OS-side--> Stopped + denied notice
```

### `SensorStreamHandle` (return type of `useSensorStream`)

```ts
export interface SensorStreamHandle<TSample> {
  readonly isAvailable: boolean;
  readonly permissionState: PermissionState;
  readonly isRunning: boolean;
  /** Most-recent sample, or null before the first one arrives. */
  readonly latest: TSample | null;
  /** Snapshot of up to N most-recent samples in chronological order. */
  snapshot(n: number): readonly TSample[];
  /** Subscribe to per-sample notifications without re-rendering on every sample. */
  subscribeToSnapshot(listener: () => void): () => void;
  start(): Promise<void>;
  stop(): void;
  requestPermission(): Promise<PermissionState>;
}
```

See [`contracts/sensor-stream-hook.md`](./contracts/sensor-stream-hook.md)
for the full contract including error semantics.

### `ModuleManifest` (re-uses `@/modules/types`)

```ts
{
  id: 'sensors-playground',
  title: 'Sensors Playground',
  description: 'Live accelerometer, gyroscope, magnetometer, and motion data',
  icon: { ios: 'gauge.with.dots.needle.bottom.50percent', fallback: '📡' },
  platforms: ['ios', 'android', 'web'],
  // No minIOS — expo-sensors works on iOS 13+
  render: () => <SensorsPlaygroundScreen />,
}
```

The exact SF Symbol name MAY be revised at implement time if the
chosen one is not available before iOS 17; a safe fallback is
`'sensor.tag.radiowaves.forward'` or `'waveform.path.ecg'`. The
fallback glyph is for the Modules grid card on Android / Web.

## Relationships

```text
SensorsPlaygroundScreen
├── useEventEmitter (in-module bus for Start All / Stop All)
└── 4× <SensorCard variant=...>
    ├── useSensorStream(<expo-sensors class>, rate, capacity=60)
    │   ├── RingBuffer<Sample>          (ref)
    │   ├── displaySample                (state)
    │   └── EventSubscription            (ref)
    ├── <readouts row>                   (reads latest)
    ├── <visualization>                  (reads snapshot or latest)
    │   ├── AccelerometerCard → BarChart
    │   ├── GyroscopeCard      → RotationIndicator (integrates yaw)
    │   ├── MagnetometerCard   → CompassNeedle
    │   └── DeviceMotionCard   → SpiritLevel
    ├── <SampleRatePicker value={rate} onChange=...>
    ├── <Start/Stop button>
    └── <PermissionNotice variant=... /> // when unavailable or denied
```

## Memory budget (FR-028 / SC-005)

- `RingBuffer` capacity is fixed at 60 per card.
- A single `XYZSample` is 4 numbers × 8 bytes = 32 B. A `MotionSample`
  is the same.
- 60 samples × 32 B = **1.92 KiB per card**.
- 4 cards × 1.92 KiB ≈ **7.7 KiB** total retained sample memory for
  the entire screen. Bounded; does not grow with run time.
