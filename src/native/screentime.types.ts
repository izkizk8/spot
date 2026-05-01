/**
 * Shared bridge contract types for feature 015 (ScreenTime / FamilyControls).
 *
 * @see specs/015-screentime-api/contracts/screentime-bridge.contract.ts
 */

export type AuthorizationStatus = 'notDetermined' | 'approved' | 'denied';

export interface SelectionSummary {
  /** Number of individual applications selected. */
  applicationCount: number;
  /** Number of activity categories selected. */
  categoryCount: number;
  /** Number of web domains selected. */
  webDomainCount: number;
  /** Opaque, base64-encoded `FamilyActivitySelection`. */
  rawSelectionToken: string;
}

export interface MonitoringSchedule {
  /** 0–23 */
  startHour: number;
  /** 0–59 */
  startMinute: number;
  /** 0–23 */
  endHour: number;
  /** 0–59 */
  endMinute: number;
}

export class ScreenTimeNotSupportedError extends Error {
  readonly code = 'ScreenTimeNotSupported' as const;
  constructor(message = 'ScreenTime APIs are not available on this platform.') {
    super(message);
    this.name = 'ScreenTimeNotSupportedError';
  }
}

export class EntitlementMissingError extends Error {
  readonly code = 'EntitlementMissing' as const;
  constructor(
    message = 'com.apple.developer.family-controls entitlement is required. See specs/015-screentime-api/quickstart.md.',
  ) {
    super(message);
    this.name = 'EntitlementMissingError';
  }
}

export class PickerCancelledError extends Error {
  readonly code = 'PickerCancelled' as const;
  constructor(message = 'The activity picker was dismissed without a selection.') {
    super(message);
    this.name = 'PickerCancelledError';
  }
}

export interface ScreenTimeBridge {
  isAvailable(): boolean;
  entitlementsAvailable(): Promise<boolean>;
  requestAuthorization(): Promise<AuthorizationStatus>;
  getAuthorizationStatus(): Promise<AuthorizationStatus>;
  pickActivity(): Promise<SelectionSummary>;
  applyShielding(token: string): Promise<void>;
  clearShielding(): Promise<void>;
  startMonitoring(token: string, schedule: MonitoringSchedule): Promise<void>;
  stopMonitoring(): Promise<void>;
}
