/**
 * Bridge types and error classes for vision-detector.
 *
 * Re-exports value types from vision-types.ts, declares the VisionBridge
 * interface, and defines the three typed error classes.
 *
 * @see specs/017-camera-vision/contracts/vision-bridge.contract.ts
 */

// Re-export value types from vision-types
export type {
  BoundingBox,
  FaceObservation,
  TextObservation,
  BarcodeObservation,
  Observation,
  VisionMode,
  ActiveVisionMode,
  AnalysisResult,
  AnalyzePayload,
} from '@/modules/camera-vision/vision-types';

export { isFace, isText, isBarcode, labelFor } from '@/modules/camera-vision/vision-types';

// ---------------------------------------------------------------------------
// Error classes
// ---------------------------------------------------------------------------

/**
 * Thrown / rejected on non-iOS platforms (Android, web) and on iOS < 13.
 * Indicates the underlying Vision API surface is unavailable.
 */
export class VisionNotSupported extends Error {
  readonly code = 'VisionNotSupported' as const;
  constructor(message = 'Vision is not available on this platform.') {
    super(message);
    this.name = 'VisionNotSupported';
  }
}

/**
 * Rejected when the underlying Vision request itself failed at runtime
 * (e.g., a malformed image that decoded but could not be analyzed, an
 * internal Vision error). The JS hook surfaces this through its `error`
 * field; the next successful cycle clears it.
 */
export class VisionAnalysisFailed extends Error {
  readonly code = 'VisionAnalysisFailed' as const;
  constructor(message = 'Vision analysis failed.') {
    super(message);
    this.name = 'VisionAnalysisFailed';
  }
}

/**
 * Rejected when the bridge input violates the contract (both `base64`
 * and `uri` present, neither present, malformed base64, unreadable
 * uri). This is a programmer error rather than a runtime detection
 * failure; the hook surfaces it via `error` but does not retry.
 */
export class InvalidInput extends Error {
  readonly code = 'InvalidInput' as const;
  constructor(message = 'Invalid bridge input.') {
    super(message);
    this.name = 'InvalidInput';
  }
}

// ---------------------------------------------------------------------------
// Bridge surface
// ---------------------------------------------------------------------------

export interface VisionBridge {
  /**
   * Synchronous capability check. Returns `true` only on iOS 13+ AND
   * when the underlying expo-modules native module is registered.
   * Never throws.
   */
  isAvailable(): boolean;

  /**
   * Runs the requested Vision analysis against the given image.
   *
   * @param mode    one of 'faces' | 'text' | 'barcodes'.
   * @param payload exactly one of `base64` or `uri`; otherwise rejects
   *                with `InvalidInput`.
   *
   * Resolves with an `AnalysisResult` whose `observations` carry
   * normalized, top-left-origin bounding boxes and per-kind payload
   * fields.
   *
   * Rejects with `VisionNotSupported` on non-iOS / iOS < 13.
   * Rejects with `InvalidInput` when the payload contract is violated.
   * Rejects with `VisionAnalysisFailed` when the Vision request itself
   *   fails at runtime.
   *
   * MUST NOT propagate uncaught native exceptions.
   */
  analyze(
    mode: import('@/modules/camera-vision/vision-types').ActiveVisionMode,
    payload: import('@/modules/camera-vision/vision-types').AnalyzePayload
  ): Promise<import('@/modules/camera-vision/vision-types').AnalysisResult>;
}
