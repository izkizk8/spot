/**
 * useBackgroundTasks hook — feature 030.
 *
 * Wraps the JS bridge + history-store + AppState. Returns
 * `{ schedule, cancelAll, lastRunByType, history, error, scheduledByType }`.
 *
 * - Refetches lastRun + history on mount and on `AppState === 'active'`.
 * - All bridge calls go through a single in-flight queue so back-to-back
 *   `schedule` calls produce ordered native invocations (FR-083 / R-A).
 * - `BackgroundTasksNotSupported` is silently absorbed (degraded state);
 *   any other error is surfaced on `error`.
 *
 * @see specs/030-background-tasks/spec.md FR-080..083, AC-BGT-006
 */

import { useCallback, useEffect, useReducer, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import * as bridge from '@/native/background-tasks';
import {
  appendRun,
  listRuns,
} from '@/modules/background-tasks-lab/history-store';
import {
  DEFAULT_REFRESH_INTERVAL_MS,
  type LastRunSnapshot,
  type ScheduleProcessingOptions,
  type TaskRunRecord,
  type TaskType,
} from '@/native/background-tasks.types';

export type ScheduleStatus = 'idle' | 'scheduled' | 'running';

export interface UseBackgroundTasksState {
  readonly lastRunByType: LastRunSnapshot;
  readonly history: readonly TaskRunRecord[];
  readonly scheduledByType: { readonly refresh: ScheduleStatus; readonly processing: ScheduleStatus };
  readonly error: Error | null;
}

const INITIAL_STATE: UseBackgroundTasksState = {
  lastRunByType: { refresh: null, processing: null },
  history: [],
  scheduledByType: { refresh: 'idle', processing: 'idle' },
  error: null,
};

const PROCESSING_DEFAULTS: ScheduleProcessingOptions = {
  requiresExternalPower: true,
  requiresNetworkConnectivity: true,
};

type Action =
  | { type: 'snapshotLoaded'; snapshot: LastRunSnapshot | null }
  | { type: 'historyLoaded'; history: readonly TaskRunRecord[] }
  | { type: 'scheduleBegin'; taskType: TaskType }
  | { type: 'scheduleCommitted'; taskType: TaskType }
  | { type: 'scheduleReverted'; taskType: TaskType; error: Error }
  | { type: 'cancelAll' }
  | { type: 'error'; error: Error }
  | { type: 'clearHistory' };

function reducer(state: UseBackgroundTasksState, action: Action): UseBackgroundTasksState {
  switch (action.type) {
    case 'snapshotLoaded': {
      const snapshot = action.snapshot ?? { refresh: null, processing: null };
      // Reset scheduled state to idle whenever a completed snapshot is observed.
      const next = { ...state.scheduledByType };
      if (snapshot.refresh != null) next.refresh = 'idle';
      if (snapshot.processing != null) next.processing = 'idle';
      return { ...state, lastRunByType: snapshot, scheduledByType: next };
    }
    case 'historyLoaded':
      return { ...state, history: action.history };
    case 'scheduleBegin':
      return {
        ...state,
        scheduledByType: { ...state.scheduledByType, [action.taskType]: 'scheduled' },
      };
    case 'scheduleCommitted':
      return state;
    case 'scheduleReverted':
      return {
        ...state,
        error: action.error,
        scheduledByType: { ...state.scheduledByType, [action.taskType]: 'idle' },
      };
    case 'cancelAll':
      return {
        ...state,
        scheduledByType: { refresh: 'idle', processing: 'idle' },
      };
    case 'error':
      return { ...state, error: action.error };
    case 'clearHistory':
      return { ...state, history: [] };
    default:
      return state;
  }
}

function isNotSupportedError(err: unknown): boolean {
  return err instanceof bridge.BackgroundTasksNotSupported;
}

export interface UseBackgroundTasks extends UseBackgroundTasksState {
  readonly schedule: (taskType: TaskType) => void;
  readonly cancelAll: () => void;
  readonly refresh: () => void;
}

export function useBackgroundTasks(): UseBackgroundTasks {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);

  // Single in-memory chain so schedule(...)+cancelAll(...) are serialised.
  const chainRef = useRef<Promise<unknown>>(Promise.resolve());
  const mountedRef = useRef(true);

  const errorReporter = useCallback((err: unknown) => {
    if (!mountedRef.current) return;
    if (isNotSupportedError(err)) return;
    dispatch({ type: 'error', error: err instanceof Error ? err : new Error(String(err)) });
  }, []);

  const fetchSnapshot = useCallback(async () => {
    try {
      const snap = await bridge.getLastRun();
      if (!mountedRef.current) return;
      dispatch({ type: 'snapshotLoaded', snapshot: snap });
    } catch (err) {
      if (isNotSupportedError(err)) {
        if (!mountedRef.current) return;
        dispatch({ type: 'snapshotLoaded', snapshot: null });
        return;
      }
      errorReporter(err);
    }
  }, [errorReporter]);

  const fetchHistory = useCallback(async () => {
    const list = await listRuns({ onError: errorReporter });
    if (!mountedRef.current) return;
    dispatch({ type: 'historyLoaded', history: list });
  }, [errorReporter]);

  const refresh = useCallback(() => {
    void fetchSnapshot();
    void fetchHistory();
  }, [fetchSnapshot, fetchHistory]);

  // Mount fetch
  useEffect(() => {
    void fetchSnapshot();
    void fetchHistory();
  }, [fetchSnapshot, fetchHistory]);

  // AppState refetch
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (next: AppStateStatus) => {
      if (next === 'active') {
        void fetchSnapshot();
        void fetchHistory();
      }
    });
    return () => {
      subscription.remove();
    };
  }, [fetchSnapshot, fetchHistory]);

  // Track unmount so async callbacks bail out cleanly
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const enqueue = useCallback(<T,>(fn: () => Promise<T>): Promise<T> => {
    const next = chainRef.current.then(fn, fn);
    chainRef.current = next.then(
      () => undefined,
      () => undefined,
    );
    return next;
  }, []);

  const schedule = useCallback(
    (taskType: TaskType) => {
      dispatch({ type: 'scheduleBegin', taskType });
      void enqueue(async () => {
        try {
          if (taskType === 'refresh') {
            await bridge.scheduleAppRefresh(DEFAULT_REFRESH_INTERVAL_MS);
          } else {
            await bridge.scheduleProcessing(PROCESSING_DEFAULTS);
          }
          if (mountedRef.current) {
            dispatch({ type: 'scheduleCommitted', taskType });
          }
        } catch (err) {
          if (!mountedRef.current) return;
          if (isNotSupportedError(err)) {
            dispatch({ type: 'scheduleReverted', taskType, error: new Error('not-supported') });
            return;
          }
          dispatch({
            type: 'scheduleReverted',
            taskType,
            error: err instanceof Error ? err : new Error(String(err)),
          });
        }
      });
    },
    [enqueue],
  );

  const cancelAllFn = useCallback(() => {
    void enqueue(async () => {
      try {
        await bridge.cancelAll();
        if (mountedRef.current) dispatch({ type: 'cancelAll' });
      } catch (err) {
        if (!mountedRef.current) return;
        if (isNotSupportedError(err)) {
          dispatch({ type: 'cancelAll' });
          return;
        }
        errorReporter(err);
      }
    });
  }, [enqueue, errorReporter]);

  // Side-effect: when a completed snapshot arrives, append the new history entry
  // (deduped by id) and refresh history. Triggered by snapshotLoaded state.
  useEffect(() => {
    const records: TaskRunRecord[] = [];
    if (state.lastRunByType.refresh) records.push(state.lastRunByType.refresh);
    if (state.lastRunByType.processing) records.push(state.lastRunByType.processing);
    if (records.length === 0) return;

    const known = new Set(state.history.map((r) => r.id));
    const fresh = records.filter((r) => !known.has(r.id));
    if (fresh.length === 0) return;

    let cancelled = false;
    void (async () => {
      // Append newest first; appendRun prepends.
      // Process serially via a local chain.
      let p: Promise<unknown> = Promise.resolve();
      for (const rec of fresh) {
        p = p.then(() => appendRun(rec, { onError: errorReporter }));
      }
      await p;
      if (cancelled || !mountedRef.current) return;
      const list = await listRuns({ onError: errorReporter });
      if (cancelled || !mountedRef.current) return;
      dispatch({ type: 'historyLoaded', history: list });
    })();
    return () => {
      cancelled = true;
    };
  }, [state.lastRunByType, state.history, errorReporter]);

  return {
    ...state,
    schedule,
    cancelAll: cancelAllFn,
    refresh,
  };
}
