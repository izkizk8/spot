# Phase 1 Data Model — ARKit Basics Module (034)

**Companion to**: [plan.md](./plan.md) §"Project Structure" + spec.md §"Key Entities"

This document captures the typed shape and invariants for every
entity transmitted, rendered, or held in memory by feature 034.
JS-side type definitions live in `src/native/arkit.types.ts`
(entities 1–6) and `src/modules/arkit-lab/hooks/useARKitSession.ts`
(entity 7). Swift-side analogues live in `ARKitBridge.swift` /
`ARKitView.swift`. The two sides MUST agree on the wire-format JSON
encoding of entities 1–6 documented below.

Unlike feature 033, feature 034 has **no JS-side persistent store**
and **no on-disk world-map persistence** (v1 placeholder only). All
state is in-memory, scoped to the screen's lifetime.

---

## Entity 1 — `PlaneDetectionMode`

A string enum mapped to `ARWorldTrackingConfiguration.planeDetection`
on the native side.

### Type

```ts
export type PlaneDetectionMode = 'none' | 'horizontal' | 'vertical' | 'both';
```

### Mapping (JS → Swift)

| JS value | Swift `ARWorldTrackingConfiguration.PlaneDetection` |
|----------|------------------------------------------------------|
| `'none'`       | `[]` (empty option set) |
| `'horizontal'` | `.horizontal` |
| `'vertical'`   | `.vertical` |
| `'both'`       | `[.horizontal, .vertical]` |

### Invariants

- Default value: `'horizontal'`.
- Round-trips losslessly through JSON (string).

---

## Entity 2 — `SessionState`

The CapabilitiesCard status pill driver.

### Type

```ts
export type SessionState = 'idle' | 'running' | 'paused' | 'error';
```

### State machine

```
idle ──► running ──► paused ──► running
  │         │         │            │
  └─────────┴─────────┴────────────┴─────► error
                                            │
                                            └─► (Reset) ─► idle
```

- `idle`: pre-mount or post-Reset before the next session start.
- `running`: `session.run(config)` succeeded; FPS > 0 expected
  within 5 s.
- `paused`: explicit `pauseSession()`. FPS reads 0 in StatsBar; the
  duration counter freezes.
- `error`: any unrecoverable failure (no root view, bridge not
  supported, native rejection). `lastError` field on `SessionInfo`
  carries the message.

---

## Entity 3 — `TrackingState`

Reflects `ARCamera.TrackingState`. Encoded as a string for cheap
React key compares.

### Type

```ts
export type TrackingState =
  | 'normal'
  | `limited:${'initializing' | 'excessiveMotion' | 'insufficientFeatures' | 'relocalizing'}`
  | 'notAvailable';
```

### Mapping

| Swift `ARCamera.TrackingState` | JS encoding |
|--------------------------------|-------------|
| `.normal` | `'normal'` |
| `.limited(.initializing)` | `'limited:initializing'` |
| `.limited(.excessiveMotion)` | `'limited:excessiveMotion'` |
| `.limited(.insufficientFeatures)` | `'limited:insufficientFeatures'` |
| `.limited(.relocalizing)` | `'limited:relocalizing'` |
| `.notAvailable` | `'notAvailable'` |

---

## Entity 4 — `ARKitConfiguration`

The toggle set passed to the `ARKitView` ViewDefinition as props.

### Type

```ts
export interface ARKitConfiguration {
  readonly planeDetection: PlaneDetectionMode;
  readonly peopleOcclusion: boolean;
  readonly lightEstimation: boolean;
  readonly worldMapPersistence: boolean; // v1 placeholder
}
```

### Defaults

```ts
export const DEFAULT_CONFIGURATION: ARKitConfiguration = {
  planeDetection: 'horizontal',
  peopleOcclusion: false,
  lightEstimation: true,
  worldMapPersistence: false,
};
```

### Wire format (JS → Swift, as ViewDefinition props)

```json
{
  "planeDetection": "horizontal",
  "peopleOcclusion": false,
  "lightEstimation": true
}
```

`worldMapPersistence` is **not** sent to the Swift side in v1; it is
a JS-only placeholder.

### Invariants

- `peopleOcclusion: true` is silently ignored by Swift on devices
  where `ARWorldTrackingConfiguration.supportsFrameSemantics(.personSegmentationWithDepth)`
  is false (R-G).
- The Reset action re-applies the same configuration with
  `[.resetTracking, .removeExistingAnchors]` options (R-G).

---

## Entity 5 — `AnchorRecord`

The JS-side projection of a native AR anchor. Rotation is
intentionally omitted for v1 (spec FR-013).

### Type

```ts
export interface AnchorRecord {
  readonly id: string;        // UUID generated on the Swift side
  readonly x: number;         // metres
  readonly y: number;         // metres
  readonly z: number;         // metres
  readonly createdAt: number; // ms since epoch
}
```

### Invariants

- `id` is a 36-char UUID v4 from `UUID().uuidString`. The
  AnchorsPanel displays only the first 8 characters (FR-013).
- `(x, y, z)` are world-space metres derived from the raycast hit's
  `worldTransform.columns.3`.
- `createdAt` is `Date().timeIntervalSince1970 * 1000` at the
  moment the anchor was placed; used for "newest first" ordering in
  the AnchorsPanel.

### Wire format (Swift → JS)

```json
{
  "id": "0e6f7c1a-...-...-...-............",
  "x": 0.123,
  "y": -0.045,
  "z": -0.872,
  "createdAt": 1731680000123
}
```

---

## Entity 6 — `SessionInfo`

The return shape of `arkit.getSessionInfo()` (FR-010).

### Type

```ts
export interface SessionInfo {
  readonly state: SessionState;
  readonly anchorCount: number;     // non-negative integer
  readonly fps: number;             // non-negative; 0 when paused
  readonly duration: number;        // seconds; cumulative running time
  readonly trackingState: TrackingState;
  readonly lastError?: string;      // present iff state === 'error'
}
```

### Invariants

- `anchorCount === arkit.getAnchors().length` from the Swift side.
- `fps` is the number of frames in the last 1.0 s window (R-E).
- `duration` excludes paused intervals (FR-009 + spec US4-AS2).
- `lastError` is present iff `state === 'error'` and is the human-
  readable message (truncated to 200 chars on the Swift side).

### Default (idle / pre-start)

```ts
export const INITIAL_SESSION_INFO: SessionInfo = {
  state: 'idle',
  anchorCount: 0,
  fps: 0,
  duration: 0,
  trackingState: 'notAvailable',
};
```

---

## Entity 7 — `ARKitSession` (hook state)

The composite state object returned by `useARKitSession()`.

### Type

```ts
export interface ARKitSession {
  readonly config: ARKitConfiguration;
  readonly anchors: readonly AnchorRecord[];
  readonly info: SessionInfo;

  // actions (stable identities; reducer-backed)
  readonly placeAnchorAt: (x: number, y: number) => Promise<void>;
  readonly clearAnchors: () => Promise<void>;
  readonly pause: () => Promise<void>;
  readonly resume: () => Promise<void>;
  readonly reset: () => Promise<void>;
  readonly setConfig: (next: Partial<ARKitConfiguration>) => void;
}
```

### Invariants

- All action functions have stable identities across renders
  (memoised by the reducer pattern).
- `setConfig` is **synchronous**; if the session is `paused` the
  config delta is queued in reducer state and a `session.run(config)`
  is dispatched on the next `resume()` (FR-025).
- `placeAnchorAt` failures are **never** surfaced as unhandled
  rejections (FR-024); the hook catches the error and dispatches
  `{ type: 'error', error: classify(e) }`.
- `anchors` is sorted newest-first by `createdAt` descending.
- The hook is the **only** public surface consumed by the screen
  variants. Components do not import `src/native/arkit.ts` directly.

### Lifecycle

| Phase | Behaviour |
|-------|-----------|
| Mount | One immediate `getSessionInfo()` call; start 500 ms `setInterval` (R-D). |
| Tick | If `mounted`, dispatch `info/update` with the result. |
| Action | Bridge call inside `enqueue`; on success, dispatch the corresponding action; on `ARKitNotSupported`, dispatch `error/unsupported`. |
| Unmount | Synchronously set `cancelled = true`; `clearInterval`; best-effort `pauseSession()` (rejection swallowed). |

---

## Cross-entity invariants

1. The Swift side encodes Entity 5 (`AnchorRecord`) and Entity 6
   (`SessionInfo`) as JSON-equivalent dictionaries with exactly the
   field names declared above; the JS bridge re-types them via the
   contract in `arkit-bridge.contract.ts`.
2. Entity 4 (`ARKitConfiguration`) is split between JS state (4
   fields) and Swift props (3 fields, `worldMapPersistence`
   excluded). The hook test asserts the prop subset matches.
3. Entity 7 is the only entity exposed across the
   `src/modules/arkit-lab/` ↔ `src/modules/arkit-lab/components/`
   boundary; components receive primitives or the relevant
   sub-shape, never the whole hook return.
