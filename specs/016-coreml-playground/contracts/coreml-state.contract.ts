/**
 * Phase 1 contract — Reducer state + action shapes for feature 016.
 *
 * This file is the AUTHORITATIVE TypeScript contract for the reducer module
 * to be implemented at:
 *   - src/modules/coreml-lab/coreml-state.ts
 *
 * The reducer is a PURE function. Every transition in the data-model.md
 * transition table MUST be covered by
 * test/unit/modules/coreml-lab/coreml-state.test.ts.
 */

import type {
  ComputeUnit,
  Prediction,
} from './coreml-bridge.contract';

// ---------------------------------------------------------------------------
// Auxiliary value types
// ---------------------------------------------------------------------------

/** Origin of the currently selected image. */
export type ImageSource = 'sample' | 'photo' | null;

/**
 * Lifecycle phase of the screen as a single discriminator. UI uses this
 * directly to decide which controls are interactive and what spinners /
 * placeholders to render.
 *
 * - `idle`           — fresh state, no model loaded yet.
 * - `loading-model`  — `loadModel` in flight.
 * - `ready`          — model loaded; awaiting / displaying results.
 * - `classifying`    — `classify` in flight (button disabled).
 * - `error`          — last operation failed; `error` field is populated.
 */
export type CoreMLStatus =
  | 'idle'
  | 'loading-model'
  | 'classifying'
  | 'ready'
  | 'error';

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

export interface CoreMLState {
  /** Origin of the currently selected image (or null when nothing chosen). */
  imageSource: ImageSource;
  /**
   * Reference to the selected image's bytes. For `sample` images this is
   * the static asset URI (the result of `Asset.fromModule(require(...))`),
   * for `photo` images this is the picker's returned URI. The bridge
   * resolves bytes to base64 just before invoking `classify`.
   */
  imageData: string | null;
  /** Top-K predictions from the most recent successful classification. */
  predictions: Prediction[];
  /** Wall-clock inference duration of the most recent classification (ms). */
  lastInferenceMs: number | null;
  /** True once `loadModel` has resolved at least once. */
  modelLoaded: boolean;
  /** Compute units the loaded model is configured to use. */
  computeUnits: ComputeUnit[];
  /** Name of the currently loaded model (echoed from `loadModel`). */
  modelName: string | null;
  /** Most recent error message; cleared on the next successful transition. */
  error: string | null;
  /** Single-discriminator lifecycle phase (see `CoreMLStatus`). */
  status: CoreMLStatus;
}

export const initialCoreMLState: CoreMLState = {
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

// ---------------------------------------------------------------------------
// Actions (discriminated union)
// ---------------------------------------------------------------------------

export type CoreMLAction =
  /** User picked an image (sample tile or Photo Library). */
  | {
      type: 'pickImage';
      payload: { source: Exclude<ImageSource, null>; data: string };
    }
  /** Bridge call `loadModel` started. */
  | { type: 'modelLoadStart'; payload: { name: string } }
  /** Bridge call `loadModel` resolved successfully. */
  | {
      type: 'modelLoadSuccess';
      payload: { name: string; computeUnits: ComputeUnit[] };
    }
  /** Bridge call `loadModel` rejected. */
  | { type: 'modelLoadFailure'; payload: { error: string } }
  /** Bridge call `classify` started. */
  | { type: 'classifyStart' }
  /** Bridge call `classify` resolved successfully. */
  | {
      type: 'classifySuccess';
      payload: { predictions: Prediction[]; inferenceMs: number };
    }
  /** Bridge call `classify` rejected. */
  | { type: 'classifyFailure'; payload: { error: string } }
  /** User changed the active model in the Model Picker. */
  | { type: 'switchModel'; payload: { name: string } }
  /** Reset the screen back to `initialCoreMLState`. */
  | { type: 'reset' };

// ---------------------------------------------------------------------------
// Reducer signature
// ---------------------------------------------------------------------------

/**
 * Pure reducer. MUST be referentially transparent and free of side effects.
 *
 * Invariants enforced by the reducer:
 *   - On any *Success transition, `error` is cleared (set to `null`).
 *   - On any *Failure transition, `status` becomes `'error'` and `error` is
 *     populated; data fields (`predictions`, `lastInferenceMs`) are left
 *     unchanged so the UI can choose whether to clear or keep stale data.
 *   - `classifyStart` is a no-op when `status === 'classifying'` (FR-022:
 *     at most one inference in flight per screen instance).
 *   - `switchModel` clears `predictions`, `lastInferenceMs`, and resets
 *     `status` to `'loading-model'` so the consumer can dispatch a
 *     follow-up `modelLoadStart`.
 *   - `reset` returns `initialCoreMLState` byte-for-byte.
 */
export type CoreMLReducer = (
  state: CoreMLState,
  action: CoreMLAction,
) => CoreMLState;
