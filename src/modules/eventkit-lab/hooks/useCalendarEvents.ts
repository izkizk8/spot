/**
 * useCalendarEvents hook — Calendar tab state machine.
 * Feature: 037-eventkit
 *
 * @see specs/037-eventkit/contracts/hooks.md (H1–H8, C1–C5)
 */

import { useCallback, useEffect, useReducer, useRef } from 'react';
import { Platform } from 'react-native';
import * as Calendar from 'expo-calendar';

import { computeRange, type DateRangePreset } from '../date-ranges';
import { toAlarmsArray } from '../alarm-offsets';
import type {
  AuthorizationStatus,
  CalendarSummary,
  ClassifiedError,
  EventDraft,
  EventSummary,
} from '../types';

// ─── Error classifier (R-D / H6) ──────────────────────────────────

export function classifyEventKitError(e: unknown): ClassifiedError {
  const raw = e instanceof Error ? e.message : String(e);
  const message = raw.length > 120 ? raw.slice(0, 120) : raw;

  if (/denied|permission/i.test(raw)) return { kind: 'denied', message };
  if (/restricted|parental|mdm/i.test(raw)) return { kind: 'restricted', message };
  if (/write.?only/i.test(raw)) return { kind: 'write-only', message };
  if (/not\s*found|no\s*such|does\s*not\s*exist/i.test(raw)) return { kind: 'not-found', message };
  if (/invalid|missing|required/i.test(raw)) return { kind: 'invalid-input', message };
  return { kind: 'failed', message };
}

// ─── State ─────────────────────────────────────────────────────────

interface State {
  status: AuthorizationStatus;
  calendars: readonly CalendarSummary[];
  events: readonly EventSummary[];
  range: DateRangePreset;
  inFlight: boolean;
  lastError: ClassifiedError | null;
}

type Action =
  | { type: 'SET_STATUS'; status: AuthorizationStatus }
  | { type: 'SET_CALENDARS'; calendars: readonly CalendarSummary[] }
  | { type: 'SET_EVENTS'; events: readonly EventSummary[] }
  | { type: 'SET_RANGE'; range: DateRangePreset }
  | { type: 'SET_IN_FLIGHT'; inFlight: boolean }
  | { type: 'SET_ERROR'; error: ClassifiedError | null };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_STATUS':
      return { ...state, status: action.status };
    case 'SET_CALENDARS':
      return { ...state, calendars: action.calendars };
    case 'SET_EVENTS':
      return { ...state, events: action.events };
    case 'SET_RANGE':
      return { ...state, range: action.range };
    case 'SET_IN_FLIGHT':
      return { ...state, inFlight: action.inFlight };
    case 'SET_ERROR':
      // H8: setting lastError does NOT clear data fields
      return { ...state, lastError: action.error };
    default:
      return state;
  }
}

const INITIAL_STATE: State = {
  status: 'notDetermined',
  calendars: [],
  events: [],
  range: 'today',
  inFlight: false,
  lastError: null,
};

// ─── Web stub return ───────────────────────────────────────────────

const WEB_ERROR: ClassifiedError = {
  kind: 'restricted',
  message: 'Web platform does not support EventKit.',
};

// ─── Hook ──────────────────────────────────────────────────────────

export interface UseCalendarEventsReturn {
  status: AuthorizationStatus;
  calendars: readonly CalendarSummary[];
  events: readonly EventSummary[];
  range: DateRangePreset;
  inFlight: boolean;
  lastError: ClassifiedError | null;
  requestAccess: () => Promise<void>;
  refreshCalendars: () => Promise<void>;
  refreshEvents: () => Promise<void>;
  setRange: (range: DateRangePreset) => void;
  createEvent: (draft: EventDraft) => Promise<void>;
  updateEvent: (eventId: string, draft: EventDraft) => Promise<void>;
  deleteEvent: (eventId: string) => Promise<void>;
}

function mapPermissionStatus(response: Calendar.PermissionResponse): AuthorizationStatus {
  if (response.status === 'granted') return 'authorized';
  if (response.status === 'denied') return 'denied';
  if (response.status === 'undetermined') return 'notDetermined';
  // iOS 17+ extended statuses via canAskAgain / granted combinations
  return 'restricted';
}

function mapCalendar(cal: Calendar.Calendar): CalendarSummary {
  return {
    id: cal.id,
    title: cal.title,
    type: cal.type ?? 'unknown',
    color: cal.color ?? '#888888',
    allowsModifications: cal.allowsModifications ?? false,
  };
}

function mapEvent(ev: Calendar.Event): EventSummary {
  return {
    id: ev.id,
    title: ev.title,
    location: ev.location || undefined,
    startDate: new Date(ev.startDate),
    endDate: new Date(ev.endDate),
    allDay: ev.allDay ?? false,
    calendarId: ev.calendarId ?? '',
  };
}

export function useCalendarEvents(): UseCalendarEventsReturn {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);
  const mounted = useRef(true);
  const queueRef = useRef<Promise<void>>(Promise.resolve());

  // Safe dispatch — H4
  const safeDispatch = useCallback((action: Action) => {
    if (mounted.current) dispatch(action);
  }, []);

  // Serialisation queue — H5 / R-A
  const enqueue = useCallback((work: () => Promise<void>): Promise<void> => {
    const next = queueRef.current.then(work, work);
    queueRef.current = next;
    return next;
  }, []);

  // H7: web short-circuit
  const isWeb = Platform.OS === 'web';

  const refreshCalendarsInner = useCallback(async () => {
    if (isWeb) return;
    try {
      const cals = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
      safeDispatch({ type: 'SET_CALENDARS', calendars: cals.map(mapCalendar) });
    } catch (e) {
      safeDispatch({ type: 'SET_ERROR', error: classifyEventKitError(e) });
    }
  }, [isWeb, safeDispatch]);

  const refreshEventsInner = useCallback(
    async (rangeOverride?: DateRangePreset, currentStatus?: AuthorizationStatus) => {
      if (isWeb) return;
      const effectiveStatus = currentStatus ?? state.status;
      // C3: writeOnly blocks reads
      if (effectiveStatus === 'writeOnly') {
        safeDispatch({
          type: 'SET_ERROR',
          error: { kind: 'write-only', message: 'Write-only access cannot read events.' },
        });
        return;
      }
      if (effectiveStatus !== 'authorized') return;
      try {
        const range = computeRange(rangeOverride ?? state.range, new Date());
        const evts = await Calendar.getEventsAsync(
          state.calendars.map((c) => c.id),
          range.startDate,
          range.endDate,
        );
        safeDispatch({ type: 'SET_EVENTS', events: evts.map(mapEvent) });
        safeDispatch({ type: 'SET_ERROR', error: null });
      } catch (e) {
        safeDispatch({ type: 'SET_ERROR', error: classifyEventKitError(e) });
      }
    },
    [isWeb, state.status, state.range, state.calendars, safeDispatch],
  );

  // H3: On mount, check permissions exactly once
  useEffect(() => {
    mounted.current = true;
    if (isWeb) {
      safeDispatch({ type: 'SET_STATUS', status: 'restricted' });
      safeDispatch({ type: 'SET_ERROR', error: WEB_ERROR });
      return () => {
        mounted.current = false;
      };
    }
    (async () => {
      try {
        const perm = await Calendar.getCalendarPermissionsAsync();
        const status = mapPermissionStatus(perm);
        safeDispatch({ type: 'SET_STATUS', status });
        if (status === 'authorized' || status === 'writeOnly') {
          const cals = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
          safeDispatch({ type: 'SET_CALENDARS', calendars: cals.map(mapCalendar) });
          if (status === 'authorized') {
            const range = computeRange('today', new Date());
            const evts = await Calendar.getEventsAsync(
              cals.map((c) => c.id),
              range.startDate,
              range.endDate,
            );
            safeDispatch({ type: 'SET_EVENTS', events: evts.map(mapEvent) });
          }
        }
      } catch (e) {
        safeDispatch({ type: 'SET_ERROR', error: classifyEventKitError(e) });
      }
    })();
    return () => {
      mounted.current = false;
    };
  }, [isWeb, safeDispatch]); // mount-only: intentionally empty deps for one-time permission check

  const requestAccess = useCallback(async () => {
    if (isWeb) {
      safeDispatch({ type: 'SET_ERROR', error: WEB_ERROR });
      return;
    }
    return enqueue(async () => {
      safeDispatch({ type: 'SET_IN_FLIGHT', inFlight: true });
      try {
        const perm = await Calendar.requestCalendarPermissionsAsync();
        const status = mapPermissionStatus(perm);
        safeDispatch({ type: 'SET_STATUS', status });
        if (status === 'authorized' || status === 'writeOnly') {
          const cals = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
          safeDispatch({ type: 'SET_CALENDARS', calendars: cals.map(mapCalendar) });
          if (status === 'authorized') {
            const range = computeRange('today', new Date());
            const evts = await Calendar.getEventsAsync(
              cals.map((c) => c.id),
              range.startDate,
              range.endDate,
            );
            safeDispatch({ type: 'SET_EVENTS', events: evts.map(mapEvent) });
          }
        }
        safeDispatch({ type: 'SET_ERROR', error: null });
      } catch (e) {
        safeDispatch({ type: 'SET_ERROR', error: classifyEventKitError(e) });
      } finally {
        safeDispatch({ type: 'SET_IN_FLIGHT', inFlight: false });
      }
    });
  }, [isWeb, safeDispatch, enqueue]);

  const refreshCalendars = useCallback(async () => {
    await refreshCalendarsInner();
  }, [refreshCalendarsInner]);

  const refreshEvents = useCallback(async () => {
    await refreshEventsInner();
  }, [refreshEventsInner]);

  const setRange = useCallback(
    (range: DateRangePreset) => {
      safeDispatch({ type: 'SET_RANGE', range });
      // Kick off refresh with the new range
      refreshEventsInner(range);
    },
    [safeDispatch, refreshEventsInner],
  );

  const createEvent = useCallback(
    async (draft: EventDraft) => {
      if (isWeb) {
        safeDispatch({ type: 'SET_ERROR', error: WEB_ERROR });
        return;
      }
      return enqueue(async () => {
        safeDispatch({ type: 'SET_IN_FLIGHT', inFlight: true });
        try {
          // C5: allDay normalisation
          let startDate = draft.startDate;
          let endDate = draft.endDate;
          if (draft.allDay) {
            startDate = new Date(
              startDate.getFullYear(),
              startDate.getMonth(),
              startDate.getDate(),
              0,
              0,
              0,
              0,
            );
            endDate = new Date(
              endDate.getFullYear(),
              endDate.getMonth(),
              endDate.getDate(),
              23,
              59,
              59,
              999,
            );
          }
          // C4: alarm translation
          const alarms = draft.alarmOffset ? toAlarmsArray(draft.alarmOffset) : undefined;
          const eventDetails: Record<string, unknown> = {
            title: draft.title,
            startDate,
            endDate,
            allDay: draft.allDay,
          };
          if (draft.location) eventDetails.location = draft.location;
          if (alarms) eventDetails.alarms = alarms;
          await Calendar.createEventAsync(draft.calendarId, eventDetails);
          // Refresh after successful create
          await refreshEventsInner();
          safeDispatch({ type: 'SET_ERROR', error: null });
        } catch (e) {
          safeDispatch({ type: 'SET_ERROR', error: classifyEventKitError(e) });
        } finally {
          safeDispatch({ type: 'SET_IN_FLIGHT', inFlight: false });
        }
      });
    },
    [isWeb, safeDispatch, enqueue, refreshEventsInner],
  );

  const updateEvent = useCallback(
    async (eventId: string, draft: EventDraft) => {
      if (isWeb) {
        safeDispatch({ type: 'SET_ERROR', error: WEB_ERROR });
        return;
      }
      if (state.status === 'writeOnly') {
        safeDispatch({
          type: 'SET_ERROR',
          error: { kind: 'write-only', message: 'Write-only access cannot update events.' },
        });
        return;
      }
      return enqueue(async () => {
        safeDispatch({ type: 'SET_IN_FLIGHT', inFlight: true });
        try {
          let startDate = draft.startDate;
          let endDate = draft.endDate;
          if (draft.allDay) {
            startDate = new Date(
              startDate.getFullYear(),
              startDate.getMonth(),
              startDate.getDate(),
              0,
              0,
              0,
              0,
            );
            endDate = new Date(
              endDate.getFullYear(),
              endDate.getMonth(),
              endDate.getDate(),
              23,
              59,
              59,
              999,
            );
          }
          const alarms = draft.alarmOffset ? toAlarmsArray(draft.alarmOffset) : undefined;
          const details: Record<string, unknown> = {
            title: draft.title,
            startDate,
            endDate,
            allDay: draft.allDay,
          };
          if (draft.location) details.location = draft.location;
          if (alarms) details.alarms = alarms;
          await Calendar.updateEventAsync(eventId, details);
          await refreshEventsInner();
          safeDispatch({ type: 'SET_ERROR', error: null });
        } catch (e) {
          safeDispatch({ type: 'SET_ERROR', error: classifyEventKitError(e) });
        } finally {
          safeDispatch({ type: 'SET_IN_FLIGHT', inFlight: false });
        }
      });
    },
    [isWeb, state.status, safeDispatch, enqueue, refreshEventsInner],
  );

  const deleteEvent = useCallback(
    async (eventId: string) => {
      if (isWeb) {
        safeDispatch({ type: 'SET_ERROR', error: WEB_ERROR });
        return;
      }
      if (state.status === 'writeOnly') {
        safeDispatch({
          type: 'SET_ERROR',
          error: { kind: 'write-only', message: 'Write-only access cannot delete events.' },
        });
        return;
      }
      return enqueue(async () => {
        safeDispatch({ type: 'SET_IN_FLIGHT', inFlight: true });
        try {
          await Calendar.deleteEventAsync(eventId);
          await refreshEventsInner();
          safeDispatch({ type: 'SET_ERROR', error: null });
        } catch (e) {
          safeDispatch({ type: 'SET_ERROR', error: classifyEventKitError(e) });
        } finally {
          safeDispatch({ type: 'SET_IN_FLIGHT', inFlight: false });
        }
      });
    },
    [isWeb, state.status, safeDispatch, enqueue, refreshEventsInner],
  );

  return {
    status: state.status,
    calendars: state.calendars,
    events: state.events,
    range: state.range,
    inFlight: state.inFlight,
    lastError: state.lastError,
    requestAccess,
    refreshCalendars,
    refreshEvents,
    setRange,
    createEvent,
    updateEvent,
    deleteEvent,
  };
}
