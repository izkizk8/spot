/**
 * Live Text Bridge Types
 * Feature: 080-live-text
 *
 * Type definitions for the Live Text OCR bridge.
 * Covers three iOS tiers:
 *   - VNRecognizeTextRequest  (iOS 13+) — Vision-based OCR on static images
 *   - DataScannerViewController (iOS 16+) — live camera scanning
 *   - ImageAnalysisInteraction  (iOS 16+) — system long-press text overlay
 */

export const NATIVE_MODULE_NAME = 'LiveText' as const;

/** Which APIs are available on the current device. */
export interface LiveTextCapabilities {
  /** VNRecognizeTextRequest — iOS 13+ */
  visionOCR: boolean;
  /** DataScannerViewController — iOS 16+, requires camera */
  dataScanner: boolean;
  /** ImageAnalysisInteraction — iOS 16+ */
  imageAnalysis: boolean;
  /** OS version string, e.g. "16.4" */
  osVersion: string;
}

/** Recognition language hint. */
export type RecognitionLanguage = 'en-US' | 'zh-Hans' | 'zh-Hant' | 'fr-FR' | 'de-DE' | 'auto';

/** A single recognised text block returned by OCR. */
export interface TextBlock {
  text: string;
  confidence: number;
  /** Normalised bounding box [x, y, width, height] in 0–1 range. */
  boundingBox: [number, number, number, number];
}

/** Result of a Vision OCR pass on a static image. */
export interface OCRResult {
  blocks: readonly TextBlock[];
  /** Concatenated text of all blocks. */
  fullText: string;
  /** ISO 8601 timestamp of the recognition pass. */
  recognisedAt: string;
}

/** Configuration for a live scanner session. */
export interface ScannerConfig {
  languages: readonly RecognitionLanguage[];
  /** Whether to also scan barcodes. */
  includeBarcodes: boolean;
}

/** Opaque live scanner session handle. */
export interface ScanSession {
  sessionId: string;
  active: boolean;
}

export interface LiveTextBridge {
  getCapabilities(): Promise<LiveTextCapabilities>;
  recognizeText(base64Image: string, language?: RecognitionLanguage): Promise<OCRResult>;
  startScanner(config: ScannerConfig): Promise<ScanSession>;
  stopScanner(sessionId: string): Promise<void>;
}

export class LiveTextNotSupported extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LiveTextNotSupported';
  }
}
