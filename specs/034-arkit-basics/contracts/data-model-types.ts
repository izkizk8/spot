/**
 * Internal type aliases shared by the contracts in this folder.
 * Mirror the entity types in data-model.md so each contract file is
 * self-contained for readers without coupling to the implementation.
 *
 * @feature 034-arkit-basics
 * @see specs/034-arkit-basics/data-model.md
 *
 * These types are documentation-only; the production source of truth
 * is `src/native/arkit.types.ts`.
 */

export type PlaneDetectionMode = 'none' | 'horizontal' | 'vertical' | 'both';

export type SessionState = 'idle' | 'running' | 'paused' | 'error';

export type TrackingState =
  | 'normal'
  | `limited:${'initializing' | 'excessiveMotion' | 'insufficientFeatures' | 'relocalizing'}`
  | 'notAvailable';

export interface ARKitConfiguration {
  readonly planeDetection: PlaneDetectionMode;
  readonly peopleOcclusion: boolean;
  readonly lightEstimation: boolean;
  readonly worldMapPersistence: boolean;
}

export interface AnchorRecord {
  readonly id: string;
  readonly x: number;
  readonly y: number;
  readonly z: number;
  readonly createdAt: number;
}

export interface SessionInfo {
  readonly state: SessionState;
  readonly anchorCount: number;
  readonly fps: number;
  readonly duration: number;
  readonly trackingState: TrackingState;
  readonly lastError?: string;
}
