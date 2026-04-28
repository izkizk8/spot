/**
 * Pure reducer for the CoreML Lab screen (feature 016).
 *
 * State + action shapes follow the contracts in:
 * specs/016-coreml-playground/contracts/coreml-state.contract.ts
 *
 * @see specs/016-coreml-playground/data-model.md for the transition table
 */

import type { ComputeUnit, Prediction } from '@/native/coreml.types';

// ---------------------------------------------------------------------------
// Auxiliary value types
// ---------------------------------------------------------------------------

/** Origin of the currently selected image. */
export type ImageSource = 'sample' | 'photo' | null;

/**
 * Lifecycle phase of the screen as a single discriminator. UI uses this
 * directly to decide which controls are interactive and what spinners /
 * placeholders to render.
 */
export type CoreMLStatus = 'idle' | 'loading-model' | 'classifying' | 'ready' | 'error';

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
// Reducer
// ---------------------------------------------------------------------------

/**
 * Pure reducer. Enforces the invariants documented in data-model.md:
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
export function coreMLReducer(state: CoreMLState, action: CoreMLAction): CoreMLState {
  switch (action.type) {
    case 'pickImage':
      return {
        ...state,
        imageSource: action.payload.source,
        imageData: action.payload.data,
        error: null,
      };

    case 'modelLoadStart':
      return {
        ...state,
        status: 'loading-model',
        error: null,
      };

    case 'modelLoadSuccess':
      return {
        ...state,
        modelLoaded: true,
        modelName: action.payload.name,
        computeUnits: action.payload.computeUnits,
        status: 'ready',
        error: null,
      };

    case 'modelLoadFailure':
      return {
        ...state,
        modelLoaded: false,
        modelName: null,
        computeUnits: [],
        status: 'error',
        error: action.payload.error,
      };

    case 'classifyStart':
      // Re-entry guard: only allow one inference at a time
      if (state.status === 'classifying') {
        return state;
      }
      return {
        ...state,
        status: 'classifying',
        predictions: [],
        lastInferenceMs: null,
        error: null,
      };

    case 'classifySuccess':
      return {
        ...state,
        predictions: action.payload.predictions,
        lastInferenceMs: action.payload.inferenceMs,
        status: 'ready',
        error: null,
      };

    case 'classifyFailure':
      return {
        ...state,
        status: 'error',
        error: action.payload.error,
      };

    case 'switchModel':
      return {
        ...state,
        modelName: action.payload.name,
        modelLoaded: false,
        computeUnits: [],
        predictions: [],
        lastInferenceMs: null,
        status: 'loading-model',
        error: null,
      };

    case 'reset':
      return initialCoreMLState;

    default:
      return state;
  }
}
