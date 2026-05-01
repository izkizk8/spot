/**
 * RealityKit USDZ Bridge Types
 * Feature: 062-realitykit-usdz
 *
 * Shared type definitions for the RealityKit USDZ AR preview bridge.
 * Covers device capability querying and AR Quick Look presentation.
 */

export const NATIVE_MODULE_NAME = 'RealityKitUsdz' as const;

/** Bundled USDZ model identifiers the demo ships with. */
export type ModelName = 'toy_drummer' | 'toy_biplane' | 'gramophone';

/** AR capability summary surfaced by `getCapabilities`. */
export interface RKCapabilities {
  /** Whether the device supports ARKit world-tracking. */
  arWorldTrackingSupported: boolean;
  /** Whether the device supports LiDAR scene reconstruction. */
  lidarSupported: boolean;
  /** Whether the device supports AR Quick Look (QLPreviewController). */
  arQuickLookSupported: boolean;
  /** Human-readable device AR tier: 'full', 'limited', or 'unsupported'. */
  tier: 'full' | 'limited' | 'unsupported';
}

/** Full bridge surface. */
export interface RealityKitUsdzBridge {
  getCapabilities(): Promise<RKCapabilities>;
  previewModel(modelName: ModelName): Promise<void>;
}

export class RealityKitUsdzNotSupported extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RealityKitUsdzNotSupported';
  }
}
