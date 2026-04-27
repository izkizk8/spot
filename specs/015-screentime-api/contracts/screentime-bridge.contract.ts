/**
 * Phase 1 contract — JS bridge for feature 015 (ScreenTime / FamilyControls).
 *
 * This file is the AUTHORITATIVE TypeScript contract for the bridge module
 * that will be implemented at:
 *   - src/native/screentime.ts          (iOS, requireOptionalNativeModule)
 *   - src/native/screentime.android.ts  (Android stub)
 *   - src/native/screentime.web.ts      (Web stub)
 *   - src/native/screentime.types.ts    (shared types — copies of the
 *                                        declarations below)
 *
 * The bridge mirrors the precedent set by feature 014's
 * `src/native/widget-center.ts` and feature 007's
 * `src/native/live-activity.ts`.
 *
 * Behavior contract (FR-011, FR-012, FR-013):
 *   - `isAvailable()` is SYNCHRONOUS. Returns false on non-iOS or iOS < 16.
 *   - `entitlementsAvailable()` NEVER throws. It probes the FamilyControls
 *     framework via Swift's `AuthorizationCenter.shared.authorizationStatus`
 *     wrapped in do/catch. Any failure → false.
 *   - On non-iOS, every async method (other than `isAvailable` and
 *     `entitlementsAvailable`) MUST reject with
 *     `ScreenTimeNotSupportedError`.
 *   - On iOS without entitlement, every async method (other than
 *     `isAvailable` and `entitlementsAvailable`) MUST reject with
 *     `EntitlementMissingError`.
 *   - `pickActivity()` MAY also reject with `PickerCancelledError` if the
 *     user dismissed the system picker without confirming.
 */

// ---------------------------------------------------------------------------
// Value types
// ---------------------------------------------------------------------------

export type AuthorizationStatus = 'notDetermined' | 'approved' | 'denied';

export interface SelectionSummary {
  /** Number of individual applications selected. */
  applicationCount: number;
  /** Number of activity categories selected. */
  categoryCount: number;
  /** Number of web domains selected. */
  webDomainCount: number;
  /**
   * Opaque, base64-encoded `FamilyActivitySelection`. JS treats this as
   * a black box. Only the Swift bridge decodes it.
   */
  rawSelectionToken: string;
}

export interface MonitoringSchedule {
  /** 0–23 */ startHour: number;
  /** 0–59 */ startMinute: number;
  /** 0–23 */ endHour: number;
  /** 0–59 */ endMinute: number;
}

// ---------------------------------------------------------------------------
// Error types
// ---------------------------------------------------------------------------

/**
 * Thrown on non-iOS platforms (Android / web) and on iOS versions < 16.
 * Indicates the underlying API surface does not exist for this build.
 */
export class ScreenTimeNotSupportedError extends Error {
  readonly code = 'ScreenTimeNotSupported' as const;
  constructor(message = 'ScreenTime APIs are not available on this platform.') {
    super(message);
    this.name = 'ScreenTimeNotSupportedError';
  }
}

/**
 * Rejected by every async bridge method when the
 * `com.apple.developer.family-controls` entitlement is not granted.
 *
 * The bridge's `entitlementsAvailable()` probe (called once at init) is
 * the source of truth that gates this rejection.
 */
export class EntitlementMissingError extends Error {
  readonly code = 'EntitlementMissing' as const;
  constructor(
    message = 'com.apple.developer.family-controls entitlement is required. See specs/015-screentime-api/quickstart.md.',
  ) {
    super(message);
    this.name = 'EntitlementMissingError';
  }
}

/**
 * Rejected when the user dismissed `FamilyActivityPicker` without confirming
 * a selection. Distinct from `EntitlementMissingError` so callers can
 * silently ignore cancellation without surfacing it as an error.
 */
export class PickerCancelledError extends Error {
  readonly code = 'PickerCancelled' as const;
  constructor(message = 'The activity picker was dismissed without a selection.') {
    super(message);
    this.name = 'PickerCancelledError';
  }
}

// ---------------------------------------------------------------------------
// Bridge surface
// ---------------------------------------------------------------------------

export interface ScreenTimeBridge {
  /**
   * Synchronous capability check. Returns true only on iOS 16+ AND when
   * the underlying native module is registered. Does NOT consult the
   * entitlement (use `entitlementsAvailable()` for that).
   */
  isAvailable(): boolean;

  /**
   * Probes the FamilyControls framework for entitlement availability.
   * NEVER throws — catches internally. Memoized for the process lifetime.
   * Returns false on non-iOS, on iOS < 16, and when the entitlement is
   * absent.
   */
  entitlementsAvailable(): Promise<boolean>;

  /**
   * Presents the system FamilyControls authorization prompt and resolves
   * with the resulting status.
   *
   * Rejects:
   *   - `EntitlementMissingError` if entitlement is absent
   *   - `ScreenTimeNotSupportedError` on non-iOS / iOS < 16
   */
  requestAuthorization(): Promise<AuthorizationStatus>;

  /**
   * Reads the current authorization status without surfacing a prompt.
   *
   * Rejects: same as `requestAuthorization`.
   */
  getAuthorizationStatus(): Promise<AuthorizationStatus>;

  /**
   * Presents `FamilyActivityPicker` and resolves with a summary of the
   * user's selection. The bridge is responsible for persisting the
   * `rawSelectionToken` to the App Group `UserDefaults`.
   *
   * Rejects:
   *   - `EntitlementMissingError`
   *   - `ScreenTimeNotSupportedError`
   *   - `PickerCancelledError` if the user dismissed without selecting
   */
  pickActivity(): Promise<SelectionSummary>;

  /**
   * Applies shielding for the apps / categories / web domains encoded in
   * `token` (the `rawSelectionToken` returned by `pickActivity`).
   * Idempotent: calling twice with the same token has the same effect as
   * calling once.
   *
   * Rejects: `EntitlementMissingError` | `ScreenTimeNotSupportedError`.
   */
  applyShielding(token: string): Promise<void>;

  /**
   * Clears all shielding currently applied via this module's
   * `ManagedSettingsStore`. No-op if nothing is shielded.
   *
   * Rejects: `EntitlementMissingError` | `ScreenTimeNotSupportedError`.
   */
  clearShielding(): Promise<void>;

  /**
   * Registers a `DeviceActivitySchedule` with `DeviceActivityCenter`.
   * The activity is given a stable name (`spot.screentime.daily`) so it
   * can later be stopped. The selection `token` is persisted so the
   * monitor extension can scope its callbacks.
   *
   * Rejects: `EntitlementMissingError` | `ScreenTimeNotSupportedError`.
   */
  startMonitoring(token: string, schedule: MonitoringSchedule): Promise<void>;

  /**
   * Removes the active monitoring schedule. No-op if no schedule is
   * registered (does NOT reject in that case).
   *
   * Rejects: `EntitlementMissingError` | `ScreenTimeNotSupportedError`.
   */
  stopMonitoring(): Promise<void>;
}
