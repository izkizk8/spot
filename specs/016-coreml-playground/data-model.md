# Phase 1 — Data Model: CoreML Playground Module

This document defines the in-memory data shapes used by feature 016. The authoritative TypeScript declarations live in:

- `src/modules/coreml-lab/coreml-state.ts` — reducer state + action types
- `src/native/coreml.types.ts` — bridge contract types (covered in [contracts/](./contracts/))
- `src/modules/coreml-lab/model-registry.ts` — JS-side `ModelDescriptor` list

This feature **does not persist anything to disk**. All state is in-memory React reducer state for the lifetime of the screen instance. Selection, model handle, and results all reset when the screen unmounts.

---

## 1. Bridge value types

### `Prediction`

```ts
interface Prediction {
  /** Human-readable class label (ImageNet name for MobileNetV2). */
  label: string;
  /** Confidence in [0, 1]. */
  confidence: number;
}
```

**Validation rules**:
- `label` non-empty.
- `confidence` ∈ [0, 1].
- The `predictions` array returned by `bridge.classify()` is **always** sorted descending by `confidence`. The reducer trusts this invariant; the bridge enforces it in Swift (`sorted(by: { $0.confidence > $1.confidence })`).

### `ComputeUnit`

```ts
type ComputeUnit = 'cpu' | 'gpu' | 'neuralEngine';
```

The Swift bridge maps Apple's `MLComputeUnits` values to this string-literal union. The bridge returns the **set actually in use** (read back from the loaded `MLModel.configuration.computeUnits`), not the requested set — so if the model loaded with `.all` on an A11 device, the returned array omits `'neuralEngine'`.

### `LoadModelResult`

```ts
interface LoadModelResult {
  loaded: boolean;          // always true on resolve (failures reject)
  computeUnits: ComputeUnit[];
  modelName: string;        // echo of the requested name
}
```

### `ClassifyResult`

```ts
interface ClassifyResult {
  predictions: Prediction[]; // sorted desc by confidence
  inferenceMs: number;       // positive integer (rounded)
}
```

---

## 2. JS-side model registry

### `ModelDescriptor`

```ts
interface ModelDescriptor {
  /** Stable identifier passed to bridge.loadModel(). */
  name: string;
  /** Human-readable label for the Model Picker segment. */
  displayName: string;
  /** Resource basename (without extension) used by Bundle.main lookup. */
  resourceName: string;
}
```

**v1 contents** (`src/modules/coreml-lab/model-registry.ts`):

```ts
export const MODEL_REGISTRY: readonly ModelDescriptor[] = [
  {
    name: 'MobileNetV2',
    displayName: 'MobileNetV2',
    resourceName: 'MobileNetV2',
  },
] as const;
```

**Validation rules**:
- `MODEL_REGISTRY.length >= 1` (the Model Picker assumes a default).
- `name` is unique within the registry.
- The first entry is the default selection on screen mount.

---

## 3. JS reducer state (`CoreMLState`)

### `ImageSource`

```ts
type ImageSource = 'sample' | 'photo' | null;
```

| Value | Meaning |
|-------|---------|
| `null` | No image selected; "Run Inference" disabled. |
| `'sample'` | A bundled sample tile is selected. |
| `'photo'` | A Photo-Library image is selected. |

### `CoreMLStatus`

```ts
type CoreMLStatus =
  | 'idle'           // Fresh state, no model loaded yet.
  | 'loading-model'  // bridge.loadModel() in flight.
  | 'classifying'    // bridge.classify() in flight (button disabled).
  | 'ready'          // model loaded; awaiting / displaying results.
  | 'error';         // last operation failed; `error` field populated.
```

A single discriminator that drives all UI gating (button enabled/disabled, spinner visibility, banner choice).

### `CoreMLState`

```ts
interface CoreMLState {
  imageSource: ImageSource;
  imageData: string | null;       // asset URI for samples; picker URI for photos
  predictions: Prediction[];
  lastInferenceMs: number | null;
  modelLoaded: boolean;
  computeUnits: ComputeUnit[];
  modelName: string | null;
  error: string | null;
  status: CoreMLStatus;
}
```

### Initial state

```ts
const initialCoreMLState: CoreMLState = {
  imageSource: null,
  imageData: null,
  predictions: [],
  lastInferenceMs: null,
  modelLoaded: false,
  computeUnits: [],
  modelName: null,
  error: null,
  status: 'idle',
};
```

### State invariants

| Invariant | Enforced by |
|-----------|-------------|
| `status === 'classifying'` ⇒ "Run Inference" is non-interactive | Screen reads `status` and disables the button (FR-007 / FR-022). |
| `status === 'classifying'` ⇒ subsequent `classifyStart` actions are no-ops | Reducer guards `classifyStart` against re-entry. |
| `predictions.length` is either `0` or `topK` (default 5) | Bridge never returns partial sets; reducer trusts. |
| `predictions` is always sorted desc by `confidence` | Bridge enforces; reducer trusts. |
| On `*Success`, `error` is cleared (`null`) | Reducer success branches set `error = null`. |
| On `*Failure`, `status === 'error'` and `error !== null`; data fields unchanged | Reducer failure branches mutate only `status` + `error`. |
| `modelLoaded === true` ⇒ `modelName !== null` AND `computeUnits.length > 0` | `modelLoadSuccess` writes all three together. |
| `imageSource === null` ⇔ `imageData === null` | Both written together by `pickImage` / `reset`. |

---

## 4. Reducer actions (`CoreMLAction`)

A discriminated union; every action carries a literal `type` string used by the reducer's `switch`.

```ts
type CoreMLAction =
  | { type: 'pickImage';        payload: { source: 'sample' | 'photo'; data: string } }
  | { type: 'modelLoadStart';   payload: { name: string } }
  | { type: 'modelLoadSuccess'; payload: { name: string; computeUnits: ComputeUnit[] } }
  | { type: 'modelLoadFailure'; payload: { error: string } }
  | { type: 'classifyStart' }
  | { type: 'classifySuccess';  payload: { predictions: Prediction[]; inferenceMs: number } }
  | { type: 'classifyFailure';  payload: { error: string } }
  | { type: 'switchModel';      payload: { name: string } }
  | { type: 'reset' };
```

---

## 5. Lifecycle states + transitions

### State machine (status discriminator)

```text
                 modelLoadStart
       idle ─────────────────────► loading-model ─── modelLoadFailure ──► error
        ▲                              │                                   │
        │                              │ modelLoadSuccess                  │ modelLoadStart
        │ reset                        ▼                                   │ (retry)
        │                            ready ◄──────── modelLoadSuccess ─────┘
        │                              │
        │                              │ classifyStart  (only if imageData !== null)
        │                              ▼
        │                          classifying
        │                              │
        │              ┌───────────────┴───────────────┐
        │              │                               │
        │   classifySuccess                  classifyFailure
        │              │                               │
        │              ▼                               ▼
        └──────────── ready                          error
                       ▲                               │
                       │  classifyStart  ◄─────────────┘ classifyStart  (retry)
```

### Transition table

| Action | Pre-state guard | Post-state effect |
|--------|-----------------|-------------------|
| `pickImage` | `status !== 'classifying'` (defensive) | sets `imageSource`, `imageData`; clears `error`; status unchanged unless previously `'idle'` (no change there either — model load is a separate action) |
| `modelLoadStart` | always allowed | `status = 'loading-model'`; clears `error` |
| `modelLoadSuccess` | always allowed | `modelLoaded = true`; sets `modelName`, `computeUnits`; `status = 'ready'`; clears `error` |
| `modelLoadFailure` | always allowed | `modelLoaded = false`; clears `modelName`, `computeUnits`; `status = 'error'`; sets `error` |
| `classifyStart` | `status !== 'classifying'` (re-entry guard, FR-022) | `status = 'classifying'`; clears `error`; clears `predictions` and `lastInferenceMs` (chart resets to empty before re-animating) |
| `classifySuccess` | always allowed | `predictions = payload.predictions`; `lastInferenceMs = payload.inferenceMs`; `status = 'ready'`; clears `error` |
| `classifyFailure` | always allowed | `status = 'error'`; sets `error`; **leaves** `predictions` and `lastInferenceMs` unchanged so the UI can choose to keep stale results or clear them |
| `switchModel` | always allowed | clears `predictions`, `lastInferenceMs`; sets `modelName = payload.name`; `status = 'loading-model'`; `modelLoaded = false`; clears `computeUnits`; clears `error`. Consumer dispatches a follow-up `modelLoadStart` then awaits the bridge. |
| `reset` | always allowed | returns `initialCoreMLState` byte-for-byte |

All transitions are **pure functions** — `reducer(state, action) -> state` — and covered 1-for-1 by `coreml-state.test.ts`.

---

## 6. Cross-platform behaviour

On Android / web, the screen instantiates the same reducer with the same `initialCoreMLState`, but:

- The screen-level effect that would normally dispatch `modelLoadStart` on mount short-circuits when `bridge.isAvailable() === false`. The state remains `'idle'` for the lifetime of the screen.
- The screen renders the iOS-only banner unconditionally (FR-011).
- The "Run Inference" button reads `bridge.isAvailable()` directly (not `status`) and is disabled.
- `pickImage` still works (visual continuity) — the image preview renders, but no `classifyStart` is ever dispatched.

The reducer itself is platform-agnostic and does not need a separate code path; only the screen's bridge-call effects differ.

---

## 7. Entity relationships

```text
ModelDescriptor (JS, N=1 in v1)  ──name──►  bridge.loadModel(name)
                                                │
                                                ▼
                                        LoadModelResult ──reduced──► CoreMLState{modelLoaded, modelName, computeUnits}
                                                                                                 │
SelectedImage (sample tile / photo URI)  ──reduced──► CoreMLState{imageSource, imageData}        │
                                                              │                                  │
                                                              └──────────► bridge.classify(b64) ◄┘
                                                                                  │
                                                                                  ▼
                                                                          ClassifyResult ──reduced──► CoreMLState{predictions, lastInferenceMs}
                                                                                                                       │
                                                                                                                       ▼
                                                                                                              PredictionsChart (animated bars) + PerformanceMetrics
```

`CoreMLState` is the single source of truth for the screen; every component reads from it via the reducer's `state` and dispatches actions to mutate it. No global store, no persistence, no cross-screen sharing.
