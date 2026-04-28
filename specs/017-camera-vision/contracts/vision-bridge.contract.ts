/**
 * Phase 1 contract — JS bridge for feature 017 (Camera + Vision Live Frames).
 *
 * This file is the AUTHORITATIVE TypeScript contract for the bridge module
 * that will be implemented at:
 *   - src/native/vision-detector.ts          (iOS, requireOptionalNativeModule)
 *   - src/native/vision-detector.android.ts  (Android stub)
 *   - src/native/vision-detector.web.ts      (Web stub)
 *   - src/native/vision-detector.types.ts    (shared types — re-exports
 *                                             from src/modules/camera-vision/
 *                                             vision-types.ts plus the
 *                                             error class declarations
 *                                             below)
 *
 * The bridge mirrors the precedent set by feature 016's
 * `src/native/coreml.ts`, feature 015's `src/native/screentime.ts`, and
 * feature 014's `src/native/widget-center.ts`.
 *
 * Behavior contract (FR-019 .. FR-022):
 *   - `isAvailable()` is SYNCHRONOUS. Returns false on non-iOS or iOS < 13.
 *   - On non-iOS, `analyze()` MUST reject with `VisionNotSupported`.
 *   - On iOS, native failures MUST be caught inside Swift and surface as
 *     one of the three typed rejections — never an uncaught native
 *     exception.
 *   - `analyze` returns observations whose bounding boxes are in
 *     normalized [0, 1] coordinates with origin at the TOP-LEFT (the
 *     Swift bridge converts from Vision's bottom-left convention before
 *     crossing the JS boundary — see research.md R-003).
 *   - `analysisMs` is the wall-clock duration of the
 *     VNImageRequestHandler.perform([request]) call (excluding base64
 *     decode and the Swift→JS marshal step).
 */

// ---------------------------------------------------------------------------
// Value types — the discriminated observation union.
//
// These declarations are mirrored verbatim in
// src/modules/camera-vision/vision-types.ts (the authoritative location).
// The bridge contract re-exports them for ergonomic imports from the
// `src/native/vision-detector.types` module.
// ---------------------------------------------------------------------------

/**
 * Normalized [0, 1] rectangle with TOP-LEFT origin.
 *
 *   x ∈ [0, 1]: distance from the LEFT edge of the captured image.
 *   y ∈ [0, 1]: distance from the TOP edge of the captured image.
 *   width  ∈ (0, 1]: rectangle width as a fraction of image width.
 *   height ∈ (0, 1]: rectangle height as a fraction of image height.
 *
 * Invariant: x + width <= 1 and y + height <= 1 (1-in-10000 tolerance).
 */
export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Output of VNDetectFaceRectanglesRequest. No payload string. */
export interface FaceObservation {
  kind: 'face';
  boundingBox: BoundingBox;
}

/** Output of VNRecognizeTextRequest. `text` is the top text candidate. */
export interface TextObservation {
  kind: 'text';
  boundingBox: BoundingBox;
  /** Recognized string (Vision's topCandidates(1).first?.string). */
  text: string;
}

/** Output of VNDetectBarcodesRequest. */
export interface BarcodeObservation {
  kind: 'barcode';
  boundingBox: BoundingBox;
  /** Decoded payload string (VNBarcodeObservation.payloadStringValue). */
  payload: string;
  /**
   * Symbology, e.g., 'QR', 'EAN-13', 'Code128'. Optional because the
   * Swift side strips the 'VNBarcodeSymbology' prefix and a future
   * Vision revision could surface a symbology for which the bridge
   * has not yet been updated; in that case we omit rather than emit
   * a raw enum string.
   */
  symbology?: string;
}

/** Discriminated union over all three observation kinds. */
export type Observation =
  | FaceObservation
  | TextObservation
  | BarcodeObservation;

// ---------------------------------------------------------------------------
// Mode
// ---------------------------------------------------------------------------

/**
 * The analysis mode driving each cycle.
 *
 *   'faces'    — VNDetectFaceRectanglesRequest
 *   'text'     — VNRecognizeTextRequest (recognitionLevel = .fast)
 *   'barcodes' — VNDetectBarcodesRequest
 *   'off'      — Loop halted; no requests are issued.
 *
 * The `analyze` bridge method accepts only the active subset
 * ('faces' | 'text' | 'barcodes'); callers are responsible for
 * checking for 'off' before invoking the bridge.
 */
export type VisionMode = 'faces' | 'text' | 'barcodes' | 'off';

export type ActiveVisionMode = Exclude<VisionMode, 'off'>;

// ---------------------------------------------------------------------------
// Bridge result shape
// ---------------------------------------------------------------------------

/**
 * Result of a successful `analyze` call. `observations` may be empty
 * (no detections is a valid result; the bridge does not reject on an
 * empty result).
 */
export interface AnalysisResult {
  /** Discriminated-union observation array. May be empty. */
  observations: Observation[];
  /** Wall-clock duration of the Vision request in ms (positive int, rounded). */
  analysisMs: number;
  /** Captured-image pixel width (used by JS for letterbox math). */
  imageWidth: number;
  /** Captured-image pixel height (used by JS for letterbox math). */
  imageHeight: number;
}

// ---------------------------------------------------------------------------
// Bridge input shape
// ---------------------------------------------------------------------------

/**
 * Exactly one of `base64` or `uri` MUST be present. Both present, or
 * neither present, MUST cause the bridge to reject with `InvalidInput`
 * before invoking any Vision API.
 *
 * `base64`: raw base64-encoded image bytes (PNG / JPEG accepted). The
 *           bridge decodes to CGImage and feeds VNImageRequestHandler.
 * `uri`:    a file:// URI to an on-disk image. The bridge loads via
 *           VNImageRequestHandler(url:options:).
 *
 * The hook's default tick uses `base64` (the result of takePictureAsync
 * with { base64: true }). The `uri` path exists for future flows that
 * want to skip the base64 round-trip.
 */
export interface AnalyzePayload {
  base64?: string;
  uri?: string;
}

// ---------------------------------------------------------------------------
// Error types
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
    mode: ActiveVisionMode,
    payload: AnalyzePayload,
  ): Promise<AnalysisResult>;
}

// ---------------------------------------------------------------------------
// Type-guard helpers (mirrored in vision-types.ts)
// ---------------------------------------------------------------------------

export const isFace = (o: Observation): o is FaceObservation =>
  o.kind === 'face';

export const isText = (o: Observation): o is TextObservation =>
  o.kind === 'text';

export const isBarcode = (o: Observation): o is BarcodeObservation =>
  o.kind === 'barcode';

/**
 * Returns the accessibility label for an overlay rectangle drawn over
 * the given observation:
 *   - face:    the literal 'Face'
 *   - text:    the recognized string (truncated to MAX_LABEL_CHARS)
 *   - barcode: the decoded payload (truncated to MAX_LABEL_CHARS)
 *
 * MAX_LABEL_CHARS is 80, per FR-007.
 */
export const labelFor = (o: Observation): string => {
  const MAX = 80;
  if (isFace(o)) return 'Face';
  if (isText(o)) return o.text.length > MAX ? `${o.text.slice(0, MAX)}…` : o.text;
  return o.payload.length > MAX ? `${o.payload.slice(0, MAX)}…` : o.payload;
};
