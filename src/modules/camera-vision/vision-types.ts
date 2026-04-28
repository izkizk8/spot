/**
 * Vision types — Discriminated observation union + type guards.
 *
 * This file is the AUTHORITATIVE location for the `Observation` discriminated
 * union and associated types. The bridge contract (contracts/vision-bridge.contract.ts)
 * mirrors these declarations; src/native/vision-detector.types.ts re-exports them.
 *
 * @see specs/017-camera-vision/data-model.md §1–§2
 * @see specs/017-camera-vision/contracts/vision-bridge.contract.ts
 */

/**
 * Normalized [0, 1] rectangle with TOP-LEFT origin.
 *
 *   x ∈ [0, 1]: distance from the LEFT edge of the captured image.
 *   y ∈ [0, 1]: distance from the TOP edge of the captured image.
 *   width  ∈ (0, 1]: rectangle width as a fraction of image width.
 *   height ∈ (0, 1]: rectangle height as a fraction of image height.
 *
 * Invariant: x + width <= 1 and y + height <= 1 (1-in-10000 tolerance).
 *
 * The Swift bridge converts from Vision's bottom-left origin to this top-left
 * convention before crossing the JS boundary.
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
export type Observation = FaceObservation | TextObservation | BarcodeObservation;

/**
 * The analysis mode driving each cycle.
 *
 *   'faces'    — VNDetectFaceRectanglesRequest
 *   'text'     — VNRecognizeTextRequest (recognitionLevel = .fast)
 *   'barcodes' — VNDetectBarcodesRequest
 *   'off'      — Loop halted; no requests are issued.
 */
export type VisionMode = 'faces' | 'text' | 'barcodes' | 'off';

export type ActiveVisionMode = Exclude<VisionMode, 'off'>;

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

/**
 * Exactly one of `base64` or `uri` MUST be present. Both present, or
 * neither present, MUST cause the bridge to reject with `InvalidInput`
 * before invoking any Vision API.
 */
export interface AnalyzePayload {
  base64?: string;
  uri?: string;
}

// ---------------------------------------------------------------------------
// Type-guard helpers
// ---------------------------------------------------------------------------

export const isFace = (o: Observation): o is FaceObservation => o?.kind === 'face';

export const isText = (o: Observation): o is TextObservation => o?.kind === 'text';

export const isBarcode = (o: Observation): o is BarcodeObservation => o?.kind === 'barcode';

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
  if (isText(o)) {
    return o.text.length > MAX ? `${o.text.slice(0, MAX)}…` : o.text;
  }
  // Barcode
  return o.payload.length > MAX ? `${o.payload.slice(0, MAX)}…` : o.payload;
};
