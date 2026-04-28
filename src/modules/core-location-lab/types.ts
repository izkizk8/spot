/**
 * Type definitions for Core Location Lab (feature 025).
 *
 * All entities are in-memory only — not persisted across app restarts.
 */

/** Valid radius values for region monitoring (meters) */
export type RegionRadiusMeters = 50 | 100 | 500;

/** A monitored circular region (geofence) */
export interface MonitoredRegion {
  readonly id: string;
  readonly latitude: number;
  readonly longitude: number;
  readonly radius: RegionRadiusMeters;
  state: 'inside' | 'outside' | 'unknown';
}

/** A region entry/exit event */
export interface RegionEvent {
  readonly id: string;
  readonly regionId: string;
  readonly type: 'enter' | 'exit';
  readonly timestamp: Date;
}

/** A location sample from watchPositionAsync */
export interface LocationSample {
  readonly latitude: number;
  readonly longitude: number;
  readonly altitude: number | null;
  readonly accuracy: number | null;
  readonly speed: number | null;
  readonly heading: number | null;
  readonly timestamp: Date;
}

/** A heading sample from watchHeadingAsync */
export interface HeadingSample {
  readonly magHeading: number;
  readonly trueHeading: number;
  /** 0 = uncalibrated, 1-3 = calibrated to varying degrees */
  readonly accuracy: number;
  readonly timestamp: Date;
}

/** A significant location change event */
export interface SignificantChangeEvent {
  readonly id: string;
  readonly latitude: number;
  readonly longitude: number;
  readonly timestamp: Date;
}
