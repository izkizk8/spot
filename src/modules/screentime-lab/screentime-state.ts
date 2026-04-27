/**
 * Pure reducer for the ScreenTime / FamilyControls Lab module.
 *
 * Implements the transition table from
 * `specs/015-screentime-api/data-model.md` §2.
 *
 * All transitions are pure, free of side effects, and covered 1-for-1 by
 * `test/unit/modules/screentime-lab/screentime-state.test.ts` (T006).
 */

import type {
  AuthorizationStatus,
  MonitoringSchedule,
  SelectionSummary,
} from '@/native/screentime.types';

export type { AuthorizationStatus, MonitoringSchedule, SelectionSummary };

export interface ScreenTimeState {
  entitlementsAvailable: boolean | null;
  authStatus: AuthorizationStatus;
  selectionSummary: SelectionSummary | null;
  shieldingActive: boolean;
  monitoringActive: boolean;
  schedule: MonitoringSchedule | null;
  lastError: string | null;
}

export const initialState: ScreenTimeState = {
  entitlementsAvailable: null,
  authStatus: 'notDetermined',
  selectionSummary: null,
  shieldingActive: false,
  monitoringActive: false,
  schedule: null,
  lastError: null,
};

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

export function reducer(state: ScreenTimeState, action: ScreenTimeAction): ScreenTimeState {
  switch (action.type) {
    case 'ENTITLEMENT_PROBED':
      return { ...state, entitlementsAvailable: action.payload.available };
    case 'AUTH_STATUS_CHANGED':
      return { ...state, authStatus: action.payload.status, lastError: null };
    case 'SELECTION_HYDRATED':
      return { ...state, selectionSummary: action.payload.summary };
    case 'SELECTION_PICKED':
      return { ...state, selectionSummary: action.payload.summary, lastError: null };
    case 'SELECTION_CLEARED':
      return {
        ...state,
        selectionSummary: null,
        shieldingActive: false,
        lastError: null,
      };
    case 'SHIELDING_APPLIED':
      if (state.selectionSummary === null) {
        return {
          ...state,
          lastError: 'Cannot apply shielding without a selection.',
        };
      }
      return { ...state, shieldingActive: true, lastError: null };
    case 'SHIELDING_CLEARED':
      return { ...state, shieldingActive: false, lastError: null };
    case 'MONITORING_STARTED':
      return {
        ...state,
        monitoringActive: true,
        schedule: action.payload.schedule,
        lastError: null,
      };
    case 'MONITORING_STOPPED':
      return { ...state, monitoringActive: false, schedule: null, lastError: null };
    case 'BRIDGE_ERROR':
      return { ...state, lastError: action.payload.message };
  }
}
