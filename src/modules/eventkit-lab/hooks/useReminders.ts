/**
 * useReminders hook — Reminders tab state machine.
 * Feature: 037-eventkit
 *
 * @see specs/037-eventkit/contracts/hooks.md (H1–H8, R1–R5)
 */

import { useCallback, useEffect, useReducer, useRef } from 'react';
import { Platform } from 'react-native';
import * as Calendar from 'expo-calendar';

import { classifyEventKitError } from './useCalendarEvents';
import type {
  CalendarSummary,
  ClassifiedError,
  ReminderAuthorizationStatus,
  ReminderDraft,
  ReminderSummary,
  RemindersFilter,
} from '../types';

// ─── State ─────────────────────────────────────────────────────────

interface State {
  status: ReminderAuthorizationStatus;
  lists: readonly CalendarSummary[];
  reminders: readonly ReminderSummary[];
  filter: RemindersFilter;
  inFlight: boolean;
  lastError: ClassifiedError | null;
}

type Action =
  | { type: 'SET_STATUS'; status: ReminderAuthorizationStatus }
  | { type: 'SET_LISTS'; lists: readonly CalendarSummary[] }
  | { type: 'SET_REMINDERS'; reminders: readonly ReminderSummary[] }
  | { type: 'SET_FILTER'; filter: RemindersFilter }
  | { type: 'SET_IN_FLIGHT'; inFlight: boolean }
  | { type: 'SET_ERROR'; error: ClassifiedError | null };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_STATUS':
      return { ...state, status: action.status };
    case 'SET_LISTS':
      return { ...state, lists: action.lists };
    case 'SET_REMINDERS':
      return { ...state, reminders: action.reminders };
    case 'SET_FILTER':
      return { ...state, filter: action.filter };
    case 'SET_IN_FLIGHT':
      return { ...state, inFlight: action.inFlight };
    case 'SET_ERROR':
      return { ...state, lastError: action.error };
    default:
      return state;
  }
}

const INITIAL_STATE: State = {
  status: 'notDetermined',
  lists: [],
  reminders: [],
  filter: 'incomplete',
  inFlight: false,
  lastError: null,
};

const WEB_ERROR: ClassifiedError = {
  kind: 'restricted',
  message: 'Web platform does not support EventKit.',
};

// ─── Mappers ───────────────────────────────────────────────────────

function mapPermissionStatus(response: Calendar.PermissionResponse): ReminderAuthorizationStatus {
  if (response.status === 'granted') return 'authorized';
  if (response.status === 'denied') return 'denied';
  if (response.status === 'undetermined') return 'notDetermined';
  return 'restricted';
}

function mapList(cal: Calendar.Calendar): CalendarSummary {
  return {
    id: cal.id,
    title: cal.title,
    type: cal.type ?? 'unknown',
    color: cal.color ?? '#888888',
    allowsModifications: cal.allowsModifications ?? false,
  };
}

function mapReminder(r: Calendar.Reminder): ReminderSummary {
  return {
    id: r.id ?? '',
    title: r.title ?? '',
    dueDate: r.dueDate ? new Date(r.dueDate) : undefined,
    listId: r.calendarId ?? '',
    priority: 'none',
    completed: r.completed ?? false,
  };
}

// ─── Hook ──────────────────────────────────────────────────────────

export interface UseRemindersReturn {
  status: ReminderAuthorizationStatus;
  lists: readonly CalendarSummary[];
  reminders: readonly ReminderSummary[];
  filter: RemindersFilter;
  inFlight: boolean;
  lastError: ClassifiedError | null;
  requestAccess: () => Promise<void>;
  refreshLists: () => Promise<void>;
  refreshReminders: () => Promise<void>;
  setFilter: (filter: RemindersFilter) => void;
  createReminder: (draft: ReminderDraft) => Promise<void>;
  updateReminder: (reminderId: string, draft: ReminderDraft) => Promise<void>;
  deleteReminder: (reminderId: string) => Promise<void>;
}

export function useReminders(): UseRemindersReturn {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);
  const mounted = useRef(true);
  const queueRef = useRef<Promise<void>>(Promise.resolve());

  const safeDispatch = useCallback((action: Action) => {
    if (mounted.current) dispatch(action);
  }, []);

  const enqueue = useCallback((work: () => Promise<void>): Promise<void> => {
    const next = queueRef.current.then(work, work);
    queueRef.current = next;
    return next;
  }, []);

  const isWeb = Platform.OS === 'web';
  const isAndroid = Platform.OS === 'android';

  const refreshListsInner = useCallback(async () => {
    if (isWeb) return;
    try {
      const cals = await Calendar.getCalendarsAsync(Calendar.EntityTypes.REMINDER);
      safeDispatch({ type: 'SET_LISTS', lists: cals.map(mapList) });
    } catch (e) {
      safeDispatch({ type: 'SET_ERROR', error: classifyEventKitError(e) });
    }
  }, [isWeb, safeDispatch]);

  const refreshRemindersInner = useCallback(
    async (filterOverride?: RemindersFilter) => {
      if (isWeb) return;
      const effectiveFilter = filterOverride ?? state.filter;
      try {
        const listIds = state.lists.map((l) => l.id);
        if (listIds.length === 0) {
          safeDispatch({ type: 'SET_REMINDERS', reminders: [] });
          return;
        }
        let reminders: Calendar.Reminder[];

        if (effectiveFilter === 'completed') {
          reminders = await Calendar.getRemindersAsync(
            listIds,
            Calendar.ReminderStatus?.COMPLETED ?? null,
            new Date(2000, 0, 1),
            new Date(),
          );
        } else if (effectiveFilter === 'incomplete') {
          reminders = await Calendar.getRemindersAsync(
            listIds,
            Calendar.ReminderStatus?.INCOMPLETE ?? null,
            null,
            null,
          );
        } else {
          // 'all'
          reminders = await Calendar.getRemindersAsync(listIds, null, null, null);
        }

        safeDispatch({ type: 'SET_REMINDERS', reminders: (reminders ?? []).map(mapReminder) });
        safeDispatch({ type: 'SET_ERROR', error: null });
      } catch (e) {
        safeDispatch({ type: 'SET_ERROR', error: classifyEventKitError(e) });
      }
    },
    [isWeb, state.filter, state.lists, safeDispatch],
  );

  // H3: On mount, check permissions once
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
        const perm = await Calendar.getRemindersPermissionsAsync();
        const status = mapPermissionStatus(perm);
        safeDispatch({ type: 'SET_STATUS', status });
        if (status === 'authorized' || status === 'fullAccess') {
          const cals = await Calendar.getCalendarsAsync(Calendar.EntityTypes.REMINDER);
          const lists = cals.map(mapList);
          safeDispatch({ type: 'SET_LISTS', lists });
          if (lists.length > 0) {
            try {
              const reminders = await Calendar.getRemindersAsync(
                lists.map((l) => l.id),
                null,
                null,
                null,
              );
              safeDispatch({
                type: 'SET_REMINDERS',
                reminders: (reminders ?? []).map(mapReminder),
              });
            } catch {
              // Non-critical: lists loaded, reminders query failed
            }
          }
        }
      } catch (e) {
        safeDispatch({ type: 'SET_ERROR', error: classifyEventKitError(e) });
      }
    })();
    return () => {
      mounted.current = false;
    };
  }, [isWeb, safeDispatch]); // mount-only

  const requestAccess = useCallback(async () => {
    if (isWeb) {
      safeDispatch({ type: 'SET_ERROR', error: WEB_ERROR });
      return;
    }
    return enqueue(async () => {
      safeDispatch({ type: 'SET_IN_FLIGHT', inFlight: true });
      try {
        const perm = await Calendar.requestRemindersPermissionsAsync();
        const status = mapPermissionStatus(perm);
        safeDispatch({ type: 'SET_STATUS', status });
        if (status === 'authorized' || status === 'fullAccess') {
          const cals = await Calendar.getCalendarsAsync(Calendar.EntityTypes.REMINDER);
          const lists = cals.map(mapList);
          safeDispatch({ type: 'SET_LISTS', lists });
          if (lists.length > 0) {
            const reminders = await Calendar.getRemindersAsync(
              lists.map((l) => l.id),
              null,
              null,
              null,
            );
            safeDispatch({
              type: 'SET_REMINDERS',
              reminders: (reminders ?? []).map(mapReminder),
            });
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

  const refreshLists = useCallback(async () => {
    await refreshListsInner();
  }, [refreshListsInner]);

  const refreshReminders = useCallback(async () => {
    if (isAndroid) {
      try {
        await refreshRemindersInner();
      } catch (e) {
        safeDispatch({ type: 'SET_ERROR', error: classifyEventKitError(e) });
      }
      return;
    }
    await refreshRemindersInner();
  }, [isAndroid, refreshRemindersInner, safeDispatch]);

  const setFilter = useCallback(
    (filter: RemindersFilter) => {
      safeDispatch({ type: 'SET_FILTER', filter });
      refreshRemindersInner(filter);
    },
    [safeDispatch, refreshRemindersInner],
  );

  const createReminder = useCallback(
    async (draft: ReminderDraft) => {
      if (isWeb) {
        safeDispatch({ type: 'SET_ERROR', error: WEB_ERROR });
        return;
      }
      return enqueue(async () => {
        safeDispatch({ type: 'SET_IN_FLIGHT', inFlight: true });
        try {
          const details: Record<string, unknown> = {
            title: draft.title,
            calendarId: draft.listId,
          };
          if (draft.dueDate !== undefined) details.dueDate = draft.dueDate;
          if (draft.priority !== 'none') {
            const map = { low: 9, medium: 5, high: 1 } as const;
            details.priority = map[draft.priority];
          }
          await Calendar.createReminderAsync(draft.listId, details);
          await refreshRemindersInner();
          safeDispatch({ type: 'SET_ERROR', error: null });
        } catch (e) {
          safeDispatch({ type: 'SET_ERROR', error: classifyEventKitError(e) });
        } finally {
          safeDispatch({ type: 'SET_IN_FLIGHT', inFlight: false });
        }
      });
    },
    [isWeb, safeDispatch, enqueue, refreshRemindersInner],
  );

  const updateReminder = useCallback(
    async (reminderId: string, draft: ReminderDraft) => {
      if (isWeb) {
        safeDispatch({ type: 'SET_ERROR', error: WEB_ERROR });
        return;
      }
      return enqueue(async () => {
        safeDispatch({ type: 'SET_IN_FLIGHT', inFlight: true });
        try {
          const details: Record<string, unknown> = {
            title: draft.title,
            calendarId: draft.listId,
          };
          if (draft.dueDate !== undefined) details.dueDate = draft.dueDate;
          if (draft.priority !== 'none') {
            const map = { low: 9, medium: 5, high: 1 } as const;
            details.priority = map[draft.priority];
          }
          await Calendar.updateReminderAsync(reminderId, details);
          await refreshRemindersInner();
          safeDispatch({ type: 'SET_ERROR', error: null });
        } catch (e) {
          safeDispatch({ type: 'SET_ERROR', error: classifyEventKitError(e) });
        } finally {
          safeDispatch({ type: 'SET_IN_FLIGHT', inFlight: false });
        }
      });
    },
    [isWeb, safeDispatch, enqueue, refreshRemindersInner],
  );

  const deleteReminder = useCallback(
    async (reminderId: string) => {
      if (isWeb) {
        safeDispatch({ type: 'SET_ERROR', error: WEB_ERROR });
        return;
      }
      return enqueue(async () => {
        safeDispatch({ type: 'SET_IN_FLIGHT', inFlight: true });
        try {
          await Calendar.deleteReminderAsync(reminderId);
          await refreshRemindersInner();
          safeDispatch({ type: 'SET_ERROR', error: null });
        } catch (e) {
          safeDispatch({ type: 'SET_ERROR', error: classifyEventKitError(e) });
        } finally {
          safeDispatch({ type: 'SET_IN_FLIGHT', inFlight: false });
        }
      });
    },
    [isWeb, safeDispatch, enqueue, refreshRemindersInner],
  );

  return {
    status: state.status,
    lists: state.lists,
    reminders: state.reminders,
    filter: state.filter,
    inFlight: state.inFlight,
    lastError: state.lastError,
    requestAccess,
    refreshLists,
    refreshReminders,
    setFilter,
    createReminder,
    updateReminder,
    deleteReminder,
  };
}
