/**
 * Shared bridge contract types for feature 016 (CoreML Playground).
 *
 * @see specs/016-coreml-playground/contracts/coreml-bridge.contract.ts
 */

// ---------------------------------------------------------------------------
// Value types
// ---------------------------------------------------------------------------

/**
 * Compute units actually selected by CoreML for inference, as reported back
 * from the loaded model's `MLModelConfiguration`. The Neural Engine entry
 * is only present on hardware that exposes one (A12+ devices).
 */
export type ComputeUnit = 'cpu' | 'gpu' | 'neuralEngine';

/**
 * A single classification result. `confidence` is normalized to [0, 1].
 * `label` is the human-readable class name surfaced by the model
 * (MobileNetV2 emits ImageNet class names).
 */
export interface Prediction {
  /** Human-readable class label, e.g., "Labrador retriever". */
  label: string;
  /** Confidence in [0, 1]. */
  confidence: number;
}

/**
 * Result of a successful `loadModel` call. `loaded` is always `true` on
 * resolve (failures reject); the field is present for future-proofing
 * symmetry with the state machine and to make the JSON shape
 * self-describing.
 */
export interface LoadModelResult {
  loaded: boolean;
  /** Compute units the loaded model is configured to use. */
  computeUnits: ComputeUnit[];
  /** Echo of the model name resolved by the bridge. */
  modelName: string;
}

/** Result of a successful `classify` call. */
export interface ClassifyResult {
  /** Top-K predictions, sorted descending by `confidence`. */
  predictions: Prediction[];
  /** Wall-clock inference duration in milliseconds (positive integer). */
  inferenceMs: number;
}

// ---------------------------------------------------------------------------
// Error types
// ---------------------------------------------------------------------------

/**
 * Thrown / rejected on non-iOS platforms (Android, web) and on iOS < 13.
 * Indicates the underlying CoreML / Vision API surface is unavailable.
 */
export class CoreMLNotSupportedError extends Error {
  readonly code = 'CoreMLNotSupported' as const;
  constructor(message = 'CoreML is not available on this platform.') {
    super(message);
    this.name = 'CoreMLNotSupportedError';
  }
}

// ---------------------------------------------------------------------------
// Bridge surface
// ---------------------------------------------------------------------------

export interface CoreMLBridge {
  /**
   * Synchronous capability check. Returns `true` only on iOS 13+ AND when
   * the underlying expo-modules native module is registered. Never
   * throws.
   */
  isAvailable(): boolean;

  /**
   * Loads the named bundled CoreML model via `MLModel(contentsOf:)`.
   *
   * Resolves with the load result (including the compute units the model
   * is configured to use, read back from `MLModelConfiguration`).
   *
   * Rejects with `CoreMLNotSupportedError` on non-iOS / iOS < 13. On iOS, any
   * other load failure (missing `.mlmodelc` in the bundle, corrupt file,
   * version mismatch) MUST be caught in Swift and surfaced as a typed
   * rejection.
   */
  loadModel(name: string): Promise<LoadModelResult>;

  /**
   * Runs image classification against the most recently loaded model.
   *
   * @param imageBase64 base64-encoded image bytes (PNG / JPEG accepted).
   *   The Vision request handles resizing to the model's expected input
   *   dimensions; callers do not need to pre-resize.
   *
   * Resolves with the top-5 predictions sorted descending by confidence,
   * along with the wall-clock inference duration in milliseconds.
   *
   * Rejects with `CoreMLNotSupportedError` on non-iOS / iOS < 13. On iOS, any
   * runtime classification failure (no model loaded, undecodable image,
   * Vision request failure) MUST be caught in Swift and surfaced as a
   * typed rejection — never an uncaught native exception.
   */
  classify(imageBase64: string): Promise<ClassifyResult>;
}
