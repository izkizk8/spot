/**
 * ARKit Bridge Type Definitions
 * Feature: 034-arkit-basics
 *
 * Shared type surface for ARKit bridge across all platforms (iOS, Android, Web).
 * Native module and view names are exported as const to ensure test mocks and
 * production code reference identical identifiers.
 *
 * @see specs/034-arkit-basics/data-model.md (entities 1–6)
 * @see specs/034-arkit-basics/contracts/arkit-bridge.contract.ts
 */

// ─────────────────────────────────────────────────────────────────────────────
// Entity 1 — PlaneDetectionMode
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Plane detection mode mapped to ARWorldTrackingConfiguration.planeDetection.
 * - 'none': [] (empty option set)
 * - 'horizontal': .horizontal
 * - 'vertical': .vertical
 * - 'both': [.horizontal, .vertical]
 */
export type PlaneDetectionMode = 'none' | 'horizontal' | 'vertical' | 'both';

// ─────────────────────────────────────────────────────────────────────────────
// Entity 2 — SessionState
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Session lifecycle state for the CapabilitiesCard status pill.
 * Transitions: idle → running ↔ paused → error (reset returns to idle).
 */
export type SessionState = 'idle' | 'running' | 'paused' | 'error';

// ─────────────────────────────────────────────────────────────────────────────
// Entity 3 — TrackingState
// ─────────────────────────────────────────────────────────────────────────────

/**
 * ARCamera.TrackingState encoded as a string for cheap React key compares.
 */
export type TrackingState =
  | 'normal'
  | 'limited:initializing'
  | 'limited:excessiveMotion'
  | 'limited:insufficientFeatures'
  | 'limited:relocalizing'
  | 'notAvailable';

// ─────────────────────────────────────────────────────────────────────────────
// Entity 4 — ARKitConfiguration
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Configuration toggles passed to the ARKitView ViewDefinition as props.
 * worldMapPersistence is a v1 placeholder (JS-only state, not sent to Swift).
 */
export interface ARKitConfiguration {
  readonly planeDetection: PlaneDetectionMode;
  readonly peopleOcclusion: boolean;
  readonly lightEstimation: boolean;
  readonly worldMapPersistence: boolean; // v1 placeholder
}

export const DEFAULT_CONFIGURATION: ARKitConfiguration = {
  planeDetection: 'horizontal',
  peopleOcclusion: false,
  lightEstimation: true,
  worldMapPersistence: false,
};

// ─────────────────────────────────────────────────────────────────────────────
// Entity 5 — AnchorRecord
// ─────────────────────────────────────────────────────────────────────────────

/**
 * JS-side projection of a native AR anchor. Rotation is omitted for v1.
 * Position is in world-space metres derived from raycast hit worldTransform.
 */
export interface AnchorRecord {
  readonly id: string; // UUID v4 (36 chars); AnchorsPanel displays first 8
  readonly x: number; // metres
  readonly y: number; // metres
  readonly z: number; // metres
  readonly createdAt: number; // ms since epoch
}

// ─────────────────────────────────────────────────────────────────────────────
// Entity 6 — SessionInfo
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Return shape of arkit.getSessionInfo() (FR-010).
 * - fps: rolling 1-second average; 0 when paused
 * - duration: cumulative running time in seconds (paused intervals excluded)
 * - lastError: present iff state === 'error'
 */
export interface SessionInfo {
  readonly state: SessionState;
  readonly anchorCount: number; // non-negative integer
  readonly fps: number; // non-negative; 0 when paused
  readonly duration: number; // seconds
  readonly trackingState: TrackingState;
  readonly lastError?: string; // present iff state === 'error'
}

export const INITIAL_SESSION_INFO: SessionInfo = {
  state: 'idle',
  anchorCount: 0,
  fps: 0,
  duration: 0,
  trackingState: 'notAvailable',
};

// ─────────────────────────────────────────────────────────────────────────────
// Native module and view names
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Expo Module name registered in expo-module.config.json.
 * Referenced by requireOptionalNativeModule and test mocks.
 */
export const NATIVE_MODULE_NAME = 'ARKitBridge' as const;

/**
 * Expo ViewDefinition name registered in expo-module.config.json.
 * Referenced by requireNativeViewManager and test mocks.
 */
export const NATIVE_VIEW_NAME = 'ARKitView' as const;

// ─────────────────────────────────────────────────────────────────────────────
// ARKitBridge interface (contracts/arkit-bridge.contract.ts)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Typed bridge surface exposed by src/native/arkit.ts (iOS) and the
 * Android / Web variants (throws ARKitNotSupported).
 */
export interface ARKitBridge {
  /**
   * Raycast at the given screen-space point and place a textured cube anchor
   * on the first detected plane. Returns the anchor record on success, null
   * if raycast misses, rejects on error.
   */
  placeAnchorAt(x: number, y: number): Promise<AnchorRecord | null>;

  /**
   * Remove all anchors placed by this session and emit onAnchorRemoved for each.
   */
  clearAnchors(): Promise<void>;

  /**
   * Pause the underlying ARSession. FPS drops to 0, duration counter freezes.
   */
  pauseSession(): Promise<void>;

  /**
   * Resume the session with the current configuration. Duration counter continues.
   */
  resumeSession(): Promise<void>;

  /**
   * Poll current session info (state, anchorCount, fps, duration, trackingState).
   * Default polling cadence: 500 ms (R-D).
   */
  getSessionInfo(): Promise<SessionInfo>;

  /**
   * Returns true only on iOS when ARWorldTrackingConfiguration.isSupported is true.
   * Never throws; returns false on Android, Web, and unsupported iOS devices.
   */
  isAvailable(): boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// ARKitNotSupported error
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Typed error thrown by all bridge methods on Android, Web, and unsupported
 * iOS devices. Carries a stable code for classification.
 */
export class ARKitNotSupported extends Error {
  public readonly code = 'ARKIT_NOT_SUPPORTED' as const;

  constructor(message = 'ARKit is not available on this platform') {
    super(message);
    this.name = 'ARKitNotSupported';

    // Maintain proper stack trace for where our error was thrown (V8 only)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ARKitNotSupported);
    }
  }
}
