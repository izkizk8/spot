# Phase 1 — Data Model: Camera + Vision Live Frames Module

This document defines the in-memory data shapes used by feature 017. The authoritative TypeScript declarations live in:

- `src/modules/camera-vision/vision-types.ts` — observation discriminated union + type guards (the primary file)
- `src/modules/camera-vision/hooks/useFrameAnalyzer.ts` — hook return shape (`FrameAnalyzerState`)
- `src/native/vision-detector.types.ts` — re-exports from `vision-types.ts` + bridge error classes (covered in [contracts/](./contracts/))

This feature **does not persist anything to disk**. All state is in-memory hook state for the lifetime of the screen instance. Observations, FPS, and timing data all reset when the screen unmounts.

---

## 1. Bounding-box convention

### `BoundingBox`

```ts
/**
 * Normalized [0, 1] rectangle against the captured image dimensions.
 *
 * Origin convention: TOP-LEFT (the React Native convention).
 *
 * The Swift bridge converts Apple Vision's native bottom-left origin
 * to top-left before crossing the JS boundary, so consumers do not
 * need to perform any axis flipping. See research.md R-003.
 *
 *   - x ∈ [0, 1]: distance from the LEFT edge of the captured image
 *   - y ∈ [0, 1]: distance from the TOP edge of the captured image
 *   - width  ∈ (0, 1]: rectangle width as a fraction of image width
 *   - height ∈ (0, 1]: rectangle height as a fraction of image height
 *
 * Invariant: x + width <= 1 and y + height <= 1.
 */
interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}
```

**Validation rules** (enforced by the Swift bridge before crossing the boundary):
- All four components ∈ `[0, 1]` (closed interval).
- `width > 0` and `height > 0`.
- `x + width <= 1.0001` and `y + height <= 1.0001` (a 1-unit-in-10000 tolerance covers Vision's floating-point rounding at frame edges).

The JS-side `OverlayCanvas` trusts these invariants and does not re-validate. Type-guard helpers in `vision-types.ts` (`isFace`, `isText`, `isBarcode`) check `kind` only — bounding-box validity is a bridge contract, not a guard concern.

---

## 2. Observation discriminated union

### `FaceObservation`

```ts
interface FaceObservation {
  kind: 'face';
  boundingBox: BoundingBox;
}
```

Output of `VNDetectFaceRectanglesRequest`. No payload string. Accessibility label on the rendered overlay rectangle is the literal `"Face"` (FR-007).

### `TextObservation`

```ts
interface TextObservation {
  kind: 'text';
  boundingBox: BoundingBox;
  /** Recognized string from the top text candidate (Vision's `topCandidates(1).first?.string`). */
  text: string;
}
```

Output of `VNRecognizeTextRequest` with `recognitionLevel = .fast` (R-002). The bridge surfaces only the top candidate; multi-candidate exposure is out of scope. Accessibility label on the rendered overlay rectangle is `text` (truncated to ~80 chars per FR-007).

### `BarcodeObservation`

```ts
interface BarcodeObservation {
  kind: 'barcode';
  boundingBox: BoundingBox;
  /** Decoded payload string. */
  payload: string;
  /** Symbology, e.g., 'QR', 'EAN-13', 'Code128'. Optional because Vision can occasionally return nil. */
  symbology?: string;
}
```

Output of `VNDetectBarcodesRequest`. `payload` is `VNBarcodeObservation.payloadStringValue`; `symbology` is the rawValue of `VNBarcodeObservation.symbology` (e.g., `"VNBarcodeSymbologyQR"` → `"QR"` after the bridge strips the prefix). Accessibility label is `payload` (truncated per FR-007).

### `Observation` (union)

```ts
type Observation = FaceObservation | TextObservation | BarcodeObservation;
```

The discriminator is `kind`. `OverlayCanvas` iterates over `Observation[]` and renders one rectangle per entry, reading `boundingBox` polymorphically and the accessibility label per-kind via a small `labelFor(observation: Observation): string` helper exported from `vision-types.ts`.

### Type guards

```ts
const isFace    = (o: Observation): o is FaceObservation    => o.kind === 'face';
const isText    = (o: Observation): o is TextObservation    => o.kind === 'text';
const isBarcode = (o: Observation): o is BarcodeObservation => o.kind === 'barcode';
```

Each guard is covered 1-for-1 by `vision-types.test.ts` for valid, invalid, and adversarial inputs (extra fields, missing fields, wrong `kind` literal).

---

## 3. Mode

```ts
type VisionMode = 'faces' | 'text' | 'barcodes' | 'off';
```

| Value | Meaning |
|-------|---------|
| `'faces'` | Run `VNDetectFaceRectanglesRequest` each cycle. (Default on first mount, FR-005.) |
| `'text'` | Run `VNRecognizeTextRequest` each cycle. |
| `'barcodes'` | Run `VNDetectBarcodesRequest` each cycle. |
| `'off'` | Halt the analysis loop without unmounting the preview (FR-005). |

`'off'` is a first-class value (not `null`) so the dispatch table is exhaustive and TypeScript flags any missing branch in a `switch (mode)`. The bridge contract's `analyze(mode, …)` signature uses the *active* subset `'faces' | 'text' | 'barcodes'` (callers must check for `'off'` themselves; the hook does this in its tick callback).

---

## 4. AnalysisResult (bridge return shape)

```ts
interface AnalysisResult {
  /** Discriminated-union observation array; may be empty (no detections is valid). */
  observations: Observation[];
  /** Wall-clock duration of the Vision request in milliseconds (positive integer, rounded). */
  analysisMs: number;
  /**
   * Captured-image pixel dimensions, used by the OverlayCanvas to compute
   * the letterbox mapping when the preview's aspect ratio differs from
   * the captured image's.
   */
  imageWidth: number;
  imageHeight: number;
}
```

**Validation rules** (enforced by the Swift bridge):
- `observations` is always an array (never `null` / `undefined`); empty is legal.
- `analysisMs >= 0`.
- `imageWidth > 0` and `imageHeight > 0`.

---

## 5. FrameAnalyzerState (hook output)

The shape exposed by `useFrameAnalyzer({ mode, intervalMs, cameraRef })` and consumed by `OverlayCanvas` and `StatsBar`.

```ts
interface FrameAnalyzerState {
  /**
   * Rolling-average FPS over the last ~8 cycles (R-009).
   * Display-formatted to one decimal place by `StatsBar`.
   * Retains its last value when mode transitions to 'off' (FR-018).
   */
  fps: number;

  /**
   * Wall-clock duration of the most recent successful analysis cycle (ms).
   * `null` before the first cycle completes; positive integer otherwise.
   * Retains its last value when mode transitions to 'off' (FR-018).
   */
  lastAnalysisMs: number | null;

  /** Count of observations in the most recent result. Zero on `'off'`. */
  detected: number;

  /** Most recent observation array. Empty array on `'off'`. */
  observations: Observation[];

  /**
   * Most recent typed bridge error. Cleared on the next successful cycle.
   * Surfaces VisionAnalysisFailed / InvalidInput / VisionNotSupported.
   */
  error: BridgeError | null;
}
```

Where `BridgeError` is:

```ts
type BridgeError =
  | { code: 'VisionNotSupported';   message: string }
  | { code: 'VisionAnalysisFailed'; message: string }
  | { code: 'InvalidInput';         message: string };
```

(Surfaced into JS as instances of the corresponding error subclasses; the `BridgeError` shape above is the shape of the captured-and-stored value in the hook state, not the wire shape.)

### Initial state

```ts
const initialFrameAnalyzerState: FrameAnalyzerState = {
  fps: 0,
  lastAnalysisMs: null,
  detected: 0,
  observations: [],
  error: null,
};
```

### State invariants

| Invariant | Enforced by |
|-----------|-------------|
| `observations.length === detected` | Hook writes both atomically on each successful cycle. |
| `mode === 'off'` ⇒ `detected === 0` AND `observations === []` | Hook clears both on the `mode → 'off'` transition (FR-018). |
| `error !== null` ⇒ the most recent cycle failed; `observations` is unchanged from the prior successful cycle (so the canvas does not flicker on a single transient failure). | Hook failure branch sets only `error`; data fields untouched. |
| Successful cycle ⇒ `error === null` | Hook success branch clears `error`. |
| `lastAnalysisMs > 0` ⇒ at least one cycle has completed | Hook only writes a positive value on success. |
| `fps >= 0` always; `fps > 0` only after at least 2 successful cycles within the FPS window | Ring-buffer FPS calculator returns 0 until 2 samples are collected. |

---

## 6. Hook input shape

```ts
interface UseFrameAnalyzerInput {
  /** Active analysis mode. The hook re-keys its loop on every change. */
  mode: VisionMode;
  /** Snapshot interval in milliseconds. Default 250. */
  intervalMs?: number;
  /** Ref to the expo-camera CameraView; takePictureAsync is called on .current. */
  cameraRef: React.RefObject<CameraView | null>;
  /**
   * Test-only override of the bridge module. Production code passes nothing
   * (the real bridge is imported via @/native/vision-detector). Tests inject
   * a mocked bridge to drive deterministic analyze() resolutions / rejections.
   */
  bridgeOverride?: VisionBridge;
}
```

The `bridgeOverride` parameter exists solely to make `useFrameAnalyzer.test.tsx` deterministic without resorting to module-level `jest.mock` calls (which interact poorly with React 19's strict-mode renderer). Production callers omit it; the screen never sets it.

---

## 7. State machine (analyzer lifecycle)

The hook's internal state machine drives the snapshot loop. This is *internal* to the hook and not exposed; it is documented here so the test suite can name the transitions it asserts.

```text
                     mount
                       │
                       ▼
                    'idle' ─────────────────────┐
                       │                        │
                       │ mode !== 'off'         │ mode === 'off' or
                       │  AND permission granted│  permission revoked
                       │  AND cameraRef.current │
                       ▼                        │
                   'running' ───── tick (no in-flight) ──► 'analyzing'
                       ▲                                       │
                       │                                       │ resolve / reject
                       │                                       ▼
                       │                              ┌────────────────┐
                       │       discard if mode changed│  consume result │
                       │       or unmounted           │  update state   │
                       │                              └────────────────┘
                       │                                       │
                       └───────────────────────────────────────┘
                       │
                       │ unmount
                       ▼
                   'torn-down' (terminal — no further timer ticks, no setState)
```

Transitions covered by `hooks/useFrameAnalyzer.test.tsx`:

| Trigger | From | To | Test assertion |
|---------|------|----|----|
| Mount with `mode: 'faces'`, granted permission, non-null `cameraRef.current` | `idle` | `running` | First `takePictureAsync` call within `intervalMs` |
| `mode → 'off'` | `running` / `analyzing` | `idle` | `observations` cleared; no further ticks; in-flight result discarded |
| `mode` changes between two non-`'off'` values mid-cycle | `analyzing` | `running` (after discard) | In-flight result discarded; next tick uses the new mode |
| Tick fires while `inFlight === true` | `analyzing` | `analyzing` (no transition) | No additional `analyze` call |
| `analyze` rejects with `VisionAnalysisFailed` | `analyzing` | `running` | `error` populated; `observations` unchanged from previous cycle |
| Unmount | any | `torn-down` | No further timer ticks; no `setState` warnings |
| Permission revoked (next `takePictureAsync` throws) | `analyzing` | `idle` | Loop pauses; `error` populated; screen re-shows permission affordance |

All transitions are exercised with `jest.useFakeTimers()` to keep tests deterministic.

---

## 8. Cross-platform behavior

On Android / web, the screen instantiates **no `useFrameAnalyzer` instance at all**. The non-iOS screens render only the `CameraPreview` (Android: live; web: placeholder) + the inert `ModePicker` + the `IOSOnlyBanner`. There is no analyzer lifecycle to manage and no hook state to track.

This is intentionally simpler than 016's data-model approach (where the reducer is platform-agnostic and only the side-effecting layer differs). Because 017's hook owns *both* state and side effects, a fully separate non-iOS screen is cleaner than parameterizing the hook to "do nothing".

The `vision-types.ts` types themselves are platform-agnostic and importable everywhere; they are pure data shapes with no platform-conditional logic.

---

## 9. Entity relationships

```text
expo-camera CameraView (refed by cameraRef)
       │
       │ takePictureAsync() ─► base64 / uri
       ▼
useFrameAnalyzer ─── bridge.analyze(mode, payload) ──► VisionDetector.swift
       │                                                        │
       │ FrameAnalyzerState                                     │ AnalysisResult
       │ { fps, lastAnalysisMs, detected, observations, error } │ { observations, analysisMs,
       │                                                        │   imageWidth, imageHeight }
       ├──────────► OverlayCanvas (one Animated.View per Observation, sized from BoundingBox)
       ├──────────► StatsBar (fps, lastAnalysisMs, detected)
       └──────────► Screen (renders error banner when error !== null)
```

`FrameAnalyzerState` is the single source of truth for the analysis-driven UI on iOS; the Mode and Permission states live above the hook and are consumed by both the screen and the hook (the hook reads `mode` as input; the screen reads permission state to gate the hook's instantiation). No global store, no persistence, no cross-screen sharing.
