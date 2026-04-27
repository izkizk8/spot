/**
 * @file T006 — Reducer test for feature 015 (screentime-lab).
 *
 * Tests the full transition table from data-model.md §2:
 *   - Every action type
 *   - Every guard condition
 *   - BRIDGE_ERROR does not mutate other fields
 *   - lastError cleared on next success
 *   - State invariants from §1
 */

import { reducer, initialState } from '@/modules/screentime-lab/screentime-state';
import type { ScreenTimeState, ScreenTimeAction } from '@/modules/screentime-lab/screentime-state';

describe('screentime-state reducer', () => {
  describe('initialState', () => {
    it('has entitlementsAvailable = null (probe not run)', () => {
      expect(initialState.entitlementsAvailable).toBeNull();
    });

    it('has authStatus = notDetermined', () => {
      expect(initialState.authStatus).toBe('notDetermined');
    });

    it('has no selection', () => {
      expect(initialState.selectionSummary).toBeNull();
    });

    it('has shielding inactive', () => {
      expect(initialState.shieldingActive).toBe(false);
    });

    it('has monitoring inactive', () => {
      expect(initialState.monitoringActive).toBe(false);
      expect(initialState.schedule).toBeNull();
    });

    it('has no lastError', () => {
      expect(initialState.lastError).toBeNull();
    });
  });

  describe('ENTITLEMENT_PROBED', () => {
    it('sets entitlementsAvailable to true when available', () => {
      const action: ScreenTimeAction = {
        type: 'ENTITLEMENT_PROBED',
        payload: { available: true },
      };
      const next = reducer(initialState, action);
      expect(next.entitlementsAvailable).toBe(true);
    });

    it('sets entitlementsAvailable to false when unavailable', () => {
      const action: ScreenTimeAction = {
        type: 'ENTITLEMENT_PROBED',
        payload: { available: false },
      };
      const next = reducer(initialState, action);
      expect(next.entitlementsAvailable).toBe(false);
    });

    it('does not mutate other fields', () => {
      const action: ScreenTimeAction = {
        type: 'ENTITLEMENT_PROBED',
        payload: { available: true },
      };
      const next = reducer(initialState, action);
      expect(next.authStatus).toBe(initialState.authStatus);
      expect(next.selectionSummary).toBe(initialState.selectionSummary);
      expect(next.shieldingActive).toBe(initialState.shieldingActive);
      expect(next.monitoringActive).toBe(initialState.monitoringActive);
    });
  });

  describe('AUTH_STATUS_CHANGED', () => {
    it('sets authStatus to approved', () => {
      const action: ScreenTimeAction = {
        type: 'AUTH_STATUS_CHANGED',
        payload: { status: 'approved' },
      };
      const next = reducer(initialState, action);
      expect(next.authStatus).toBe('approved');
    });

    it('sets authStatus to denied', () => {
      const action: ScreenTimeAction = {
        type: 'AUTH_STATUS_CHANGED',
        payload: { status: 'denied' },
      };
      const next = reducer(initialState, action);
      expect(next.authStatus).toBe('denied');
    });

    it('clears lastError on success', () => {
      const stateWithError: ScreenTimeState = {
        ...initialState,
        lastError: 'Previous error',
      };
      const action: ScreenTimeAction = {
        type: 'AUTH_STATUS_CHANGED',
        payload: { status: 'approved' },
      };
      const next = reducer(stateWithError, action);
      expect(next.lastError).toBeNull();
    });
  });

  describe('SELECTION_HYDRATED', () => {
    it('sets selectionSummary from persistence (non-null)', () => {
      const summary = {
        applicationCount: 2,
        categoryCount: 1,
        webDomainCount: 0,
        rawSelectionToken: 'base64token',
      };
      const action: ScreenTimeAction = {
        type: 'SELECTION_HYDRATED',
        payload: { summary },
      };
      const next = reducer(initialState, action);
      expect(next.selectionSummary).toEqual(summary);
    });

    it('sets selectionSummary to null when no persisted selection', () => {
      const action: ScreenTimeAction = {
        type: 'SELECTION_HYDRATED',
        payload: { summary: null },
      };
      const next = reducer(initialState, action);
      expect(next.selectionSummary).toBeNull();
    });
  });

  describe('SELECTION_PICKED', () => {
    it('sets selectionSummary and clears lastError', () => {
      const summary = {
        applicationCount: 3,
        categoryCount: 0,
        webDomainCount: 1,
        rawSelectionToken: 'newToken',
      };
      const action: ScreenTimeAction = {
        type: 'SELECTION_PICKED',
        payload: { summary },
      };
      const next = reducer(initialState, action);
      expect(next.selectionSummary).toEqual(summary);
      expect(next.lastError).toBeNull();
    });

    it('overwrites previous selection', () => {
      const oldSummary = {
        applicationCount: 1,
        categoryCount: 1,
        webDomainCount: 1,
        rawSelectionToken: 'oldToken',
      };
      const stateWithSelection: ScreenTimeState = {
        ...initialState,
        selectionSummary: oldSummary,
      };
      const newSummary = {
        applicationCount: 5,
        categoryCount: 0,
        webDomainCount: 0,
        rawSelectionToken: 'newToken',
      };
      const action: ScreenTimeAction = {
        type: 'SELECTION_PICKED',
        payload: { summary: newSummary },
      };
      const next = reducer(stateWithSelection, action);
      expect(next.selectionSummary).toEqual(newSummary);
    });
  });

  describe('SELECTION_CLEARED', () => {
    it('sets selectionSummary to null', () => {
      const stateWithSelection: ScreenTimeState = {
        ...initialState,
        selectionSummary: {
          applicationCount: 2,
          categoryCount: 1,
          webDomainCount: 0,
          rawSelectionToken: 'token',
        },
      };
      const action: ScreenTimeAction = { type: 'SELECTION_CLEARED' };
      const next = reducer(stateWithSelection, action);
      expect(next.selectionSummary).toBeNull();
    });

    it('clears shieldingActive if it was true', () => {
      const stateWithShielding: ScreenTimeState = {
        ...initialState,
        selectionSummary: {
          applicationCount: 1,
          categoryCount: 0,
          webDomainCount: 0,
          rawSelectionToken: 'token',
        },
        shieldingActive: true,
      };
      const action: ScreenTimeAction = { type: 'SELECTION_CLEARED' };
      const next = reducer(stateWithShielding, action);
      expect(next.shieldingActive).toBe(false);
    });

    it('does not affect shieldingActive if it was already false', () => {
      const action: ScreenTimeAction = { type: 'SELECTION_CLEARED' };
      const next = reducer(initialState, action);
      expect(next.shieldingActive).toBe(false);
    });
  });

  describe('SHIELDING_APPLIED', () => {
    it('sets shieldingActive to true and clears lastError', () => {
      const stateWithSelection: ScreenTimeState = {
        ...initialState,
        selectionSummary: {
          applicationCount: 1,
          categoryCount: 0,
          webDomainCount: 0,
          rawSelectionToken: 'token',
        },
      };
      const action: ScreenTimeAction = { type: 'SHIELDING_APPLIED' };
      const next = reducer(stateWithSelection, action);
      expect(next.shieldingActive).toBe(true);
      expect(next.lastError).toBeNull();
    });

    it('is idempotent — applying twice is safe', () => {
      const stateShieldingActive: ScreenTimeState = {
        ...initialState,
        selectionSummary: {
          applicationCount: 1,
          categoryCount: 0,
          webDomainCount: 0,
          rawSelectionToken: 'token',
        },
        shieldingActive: true,
      };
      const action: ScreenTimeAction = { type: 'SHIELDING_APPLIED' };
      const next = reducer(stateShieldingActive, action);
      expect(next.shieldingActive).toBe(true);
    });

    it('rejects when selectionSummary is null (sets lastError, does not activate)', () => {
      const action: ScreenTimeAction = { type: 'SHIELDING_APPLIED' };
      const next = reducer(initialState, action);
      expect(next.shieldingActive).toBe(false);
      expect(next.lastError).toMatch(/selection/i);
    });
  });

  describe('SHIELDING_CLEARED', () => {
    it('sets shieldingActive to false and clears lastError', () => {
      const stateWithShielding: ScreenTimeState = {
        ...initialState,
        shieldingActive: true,
      };
      const action: ScreenTimeAction = { type: 'SHIELDING_CLEARED' };
      const next = reducer(stateWithShielding, action);
      expect(next.shieldingActive).toBe(false);
      expect(next.lastError).toBeNull();
    });

    it('is no-op when shielding was already inactive', () => {
      const action: ScreenTimeAction = { type: 'SHIELDING_CLEARED' };
      const next = reducer(initialState, action);
      expect(next.shieldingActive).toBe(false);
    });
  });

  describe('MONITORING_STARTED', () => {
    it('sets monitoringActive to true, assigns schedule, clears lastError', () => {
      const schedule = { startHour: 9, startMinute: 0, endHour: 21, endMinute: 0 };
      const action: ScreenTimeAction = {
        type: 'MONITORING_STARTED',
        payload: { schedule },
      };
      const next = reducer(initialState, action);
      expect(next.monitoringActive).toBe(true);
      expect(next.schedule).toEqual(schedule);
      expect(next.lastError).toBeNull();
    });

    it('overwrites previous schedule', () => {
      const oldSchedule = { startHour: 8, startMinute: 0, endHour: 20, endMinute: 0 };
      const stateWithMonitoring: ScreenTimeState = {
        ...initialState,
        monitoringActive: true,
        schedule: oldSchedule,
      };
      const newSchedule = { startHour: 10, startMinute: 30, endHour: 22, endMinute: 0 };
      const action: ScreenTimeAction = {
        type: 'MONITORING_STARTED',
        payload: { schedule: newSchedule },
      };
      const next = reducer(stateWithMonitoring, action);
      expect(next.schedule).toEqual(newSchedule);
    });
  });

  describe('MONITORING_STOPPED', () => {
    it('sets monitoringActive to false, schedule to null, clears lastError', () => {
      const stateWithMonitoring: ScreenTimeState = {
        ...initialState,
        monitoringActive: true,
        schedule: { startHour: 9, startMinute: 0, endHour: 21, endMinute: 0 },
      };
      const action: ScreenTimeAction = { type: 'MONITORING_STOPPED' };
      const next = reducer(stateWithMonitoring, action);
      expect(next.monitoringActive).toBe(false);
      expect(next.schedule).toBeNull();
      expect(next.lastError).toBeNull();
    });

    it('is no-op when monitoring was already inactive', () => {
      const action: ScreenTimeAction = { type: 'MONITORING_STOPPED' };
      const next = reducer(initialState, action);
      expect(next.monitoringActive).toBe(false);
      expect(next.schedule).toBeNull();
    });
  });

  describe('BRIDGE_ERROR', () => {
    it('sets lastError and does not mutate any other field', () => {
      const stateWithData: ScreenTimeState = {
        entitlementsAvailable: true,
        authStatus: 'approved',
        selectionSummary: {
          applicationCount: 1,
          categoryCount: 1,
          webDomainCount: 1,
          rawSelectionToken: 'token',
        },
        shieldingActive: true,
        monitoringActive: true,
        schedule: { startHour: 9, startMinute: 0, endHour: 21, endMinute: 0 },
        lastError: null,
      };
      const action: ScreenTimeAction = {
        type: 'BRIDGE_ERROR',
        payload: { message: 'EntitlementMissingError' },
      };
      const next = reducer(stateWithData, action);
      expect(next.lastError).toBe('EntitlementMissingError');
      expect(next.entitlementsAvailable).toBe(stateWithData.entitlementsAvailable);
      expect(next.authStatus).toBe(stateWithData.authStatus);
      expect(next.selectionSummary).toEqual(stateWithData.selectionSummary);
      expect(next.shieldingActive).toBe(stateWithData.shieldingActive);
      expect(next.monitoringActive).toBe(stateWithData.monitoringActive);
      expect(next.schedule).toEqual(stateWithData.schedule);
    });

    it('overwrites previous lastError', () => {
      const stateWithError: ScreenTimeState = {
        ...initialState,
        lastError: 'Old error',
      };
      const action: ScreenTimeAction = {
        type: 'BRIDGE_ERROR',
        payload: { message: 'New error' },
      };
      const next = reducer(stateWithError, action);
      expect(next.lastError).toBe('New error');
    });
  });

  describe('invariants', () => {
    it('shieldingActive === true implies selectionSummary !== null', () => {
      // Enforced by SHIELDING_APPLIED guard: with no selection, the
      // reducer must NOT activate shielding.
      const action: ScreenTimeAction = { type: 'SHIELDING_APPLIED' };
      const next = reducer(initialState, action);
      expect(next.shieldingActive).toBe(false);
      // And from a state with a selection, shielding does activate.
      const withSelection: ScreenTimeState = {
        ...initialState,
        selectionSummary: {
          applicationCount: 1,
          categoryCount: 0,
          webDomainCount: 0,
          rawSelectionToken: 'tok',
        },
      };
      const next2 = reducer(withSelection, action);
      expect(next2.shieldingActive).toBe(true);
      expect(next2.selectionSummary).not.toBeNull();
    });

    it('monitoringActive === true implies schedule !== null', () => {
      const schedule = { startHour: 9, startMinute: 0, endHour: 21, endMinute: 0 };
      const action: ScreenTimeAction = {
        type: 'MONITORING_STARTED',
        payload: { schedule },
      };
      const next = reducer(initialState, action);
      expect(next.monitoringActive).toBe(true);
      expect(next.schedule).not.toBeNull();
    });

    it('lastError cleared on next successful transition after BRIDGE_ERROR', () => {
      const stateWithError: ScreenTimeState = {
        ...initialState,
        lastError: 'Previous error',
      };
      const successAction: ScreenTimeAction = {
        type: 'AUTH_STATUS_CHANGED',
        payload: { status: 'approved' },
      };
      const next = reducer(stateWithError, successAction);
      expect(next.lastError).toBeNull();
    });
  });
});
