/**
 * Visual Look Up Bridge Types
 * Feature: 060-visual-look-up
 *
 * Shared type definitions for the VisionKit ImageAnalysisInteraction /
 * VNImageAnalyzer bridge. iOS 15+ only.
 */

export const NATIVE_MODULE_NAME = 'VisualLookUp' as const;

/**
 * Normalised bounding box in the image coordinate space.
 * All values are in the range [0, 1] (origin at top-left).
 */
export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * A single subject detected by VNImageAnalyzer.
 */
export interface Subject {
  id: string;
  label: string;
  confidence: number;
  boundingBox: BoundingBox;
}

/**
 * The result returned by `analyzeImage`. Timestamps are epoch ms.
 */
export interface AnalysisResult {
  supported: boolean;
  imageUri: string;
  subjects: readonly Subject[];
  hasSaliencyMap: boolean;
  analyzedAt: number;
}

export interface VisualLookUpBridge {
  isSupported(): Promise<boolean>;
  analyzeImage(imageUri: string): Promise<AnalysisResult>;
}

export class VisualLookUpNotSupported extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'VisualLookUpNotSupported';
  }
}
