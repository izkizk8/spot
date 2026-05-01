/**
 * RoomPlan (LiDAR) bridge — shared type surface (feature 048).
 *
 * Pure module: no React, no native imports. Used by all four
 * `src/native/roomplan*.ts` siblings, the `useRoomCapture` hook,
 * and the AsyncStorage-backed `room-store`.
 */

export const NATIVE_MODULE_NAME = 'RoomCaptureBridge' as const;

/** Coarse phases reported by the native capture session. */
export type ScanPhase = 'idle' | 'scanning' | 'processing' | 'completed' | 'error';

export const SCAN_PHASES: readonly ScanPhase[] = Object.freeze([
  'idle',
  'scanning',
  'processing',
  'completed',
  'error',
]);

/** Width / length / height in metres. */
export interface RoomDimensions {
  readonly widthM: number;
  readonly lengthM: number;
  readonly heightM: number;
}

/** Per-category surface counts returned by `RoomCaptureResult`. */
export interface SurfaceCounts {
  readonly walls: number;
  readonly windows: number;
  readonly doors: number;
  readonly openings: number;
  readonly objects: number;
}

/** Result returned by `bridge.startCapture()`. */
export interface RoomCaptureResult {
  readonly id: string;
  readonly name: string;
  readonly dimensions: RoomDimensions;
  readonly surfaces: SurfaceCounts;
  /** ISO-8601 timestamp. */
  readonly createdAt: string;
  /** On-disk URI of the persisted USDZ asset, or null. */
  readonly usdzPath: string | null;
}

export type ScanPhaseListener = (phase: ScanPhase) => void;

export interface RoomPlanBridge {
  isSupported(): boolean;
  startCapture(): Promise<RoomCaptureResult>;
  stopCapture(): Promise<void>;
  exportUSDZ(roomId: string): Promise<string>;
  subscribe(listener: ScanPhaseListener): () => void;
}

export const ZERO_DIMENSIONS: RoomDimensions = Object.freeze({
  widthM: 0,
  lengthM: 0,
  heightM: 0,
});

export const ZERO_SURFACES: SurfaceCounts = Object.freeze({
  walls: 0,
  windows: 0,
  doors: 0,
  openings: 0,
  objects: 0,
});

/**
 * Typed error thrown by Android / Web variants and by the iOS
 * variant when the native module is missing or the device lacks
 * a LiDAR scanner.
 */
export class RoomPlanNotSupported extends Error {
  public readonly code = 'ROOMPLAN_NOT_SUPPORTED' as const;

  constructor(message = 'RoomPlan is not available on this platform') {
    super(message);
    this.name = 'RoomPlanNotSupported';
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, RoomPlanNotSupported);
    }
  }
}
