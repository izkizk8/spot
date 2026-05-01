/**
 * Phase 1 contract — Reducer state + action shapes for feature 015.
 *
 * This file is the AUTHORITATIVE TypeScript contract for the reducer module
 * to be implemented at:
 *   - src/modules/screentime-lab/screentime-state.ts
 *
 * The reducer is a PURE function. Every transition listed in the
 * data-model.md transition table MUST be covered by
 * test/unit/modules/screentime-lab/screentime-state.test.ts.
 */

import type {
  AuthorizationStatus,
  MonitoringSchedule,
  SelectionSummary,
} from './screentime-bridge.contract';

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

export interface ScreenTimeState {
  /** Probed once at mount; `null` while the probe is in flight. */
  entitlementsAvailable: boolean | null;
  /** Most recent known authorization status. */
  authStatus: AuthorizationStatus;
  /** Persisted selection; `null` when no selection has been made. */
  selectionSummary: SelectionSummary | null;
  /** Locally cached; ManagedSettingsStore is the source of truth. */
  shieldingActive: boolean;
  /** Locally cached; DeviceActivityCenter is the source of truth. */
  monitoringActive: boolean;
  /** Active schedule when `monitoringActive === true`; otherwise `null`. */
  schedule: MonitoringSchedule | null;
  /** Most recent native error or success message; surfaced in card status. */
  lastError: string | null;
}

export const initialScreenTimeState: ScreenTimeState = {
  entitlementsAvailable: null,
  authStatus: 'notDetermined',
  selectionSummary: null,
  shieldingActive: false,
  monitoringActive: false,
  schedule: null,
  lastError: null,
};

// ---------------------------------------------------------------------------
// Actions (discriminated union)
// ---------------------------------------------------------------------------

export type ScreenTimeAction =
  | { type: 'ENTITLEMENT_PROBED'; payload: { available: boolean } }
  | { type: 'AUTH_STATUS_CHANGED'; payload: { status: AuthorizationStatus } }
  | { type: 'SELECTION_HYDRATED'; payload: { summary: SelectionSummary | null } }
  | { type: 'SELECTION_PICKED'; payload: { summary: SelectionSummary } }
  | { type: 'SELECTION_CLEARED' }
  | { type: 'SHIELDING_APPLIED' }
  | { type: 'SHIELDING_CLEARED' }
  | { type: 'MONITORING_STARTED'; payload: { schedule: MonitoringSchedule } }
  | { type: 'MONITORING_STOPPED' }
  | { type: 'BRIDGE_ERROR'; payload: { message: string } };

// ---------------------------------------------------------------------------
// Reducer signature
// ---------------------------------------------------------------------------

/**
 * Pure reducer. MUST be referentially transparent and free of side effects.
 *
 * Invariants enforced inside the reducer:
 *   - SHIELDING_APPLIED with `selectionSummary === null` → BRIDGE_ERROR-equivalent
 *     (sets `lastError`, leaves `shieldingActive` false). Callers should not
 *     dispatch this action without a selection; the reducer is defensive.
 *   - MONITORING_STARTED requires a payload schedule; otherwise it is a no-op.
 *   - On non-error transitions, `lastError` is cleared (set to `null`).
 *   - BRIDGE_ERROR mutates only `lastError`.
 */
export type ScreenTimeReducer = (
  state: ScreenTimeState,
  action: ScreenTimeAction,
) => ScreenTimeState;
