/**
 * useFocusFilter hook — lifecycle management for Focus Filter values.
 *
 * Returns { values, refresh, eventLog, simulateActivation }. Refetches on
 * mount and on AppState 'active'. Tolerates FocusFiltersNotSupported.
 * simulateActivation is debounced ~300 ms. Event log is a 10-cap ring buffer.
 *
 * @see specs/029-focus-filters/tasks.md T022
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

import * as bridge from '@/native/focus-filters';
import type { ShowcaseFilterPersistedPayload } from '@/modules/focus-filters-lab/filter-modes';

export interface EventLogEntry {
  kind: 'simulated' | 'activated' | 'deactivated';
  values: { mode: string; accentColor: string };
  at: string; // ISO 8601
}

const EVENT_LOG_CAP = 10;
const SIMULATE_DEBOUNCE_MS = 300;

export function useFocusFilter() {
  const [values, setValues] = useState<ShowcaseFilterPersistedPayload | null>(null);
  const [eventLog, setEventLog] = useState<readonly EventLogEntry[]>([]);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pendingSimulationRef = useRef<{ mode: string; accentColor: string } | null>(null);

  const fetchValues = useCallback(async () => {
    try {
      const result = await bridge.getCurrentFilterValues();
      setValues(result);
    } catch (err) {
      if (err instanceof bridge.FocusFiltersNotSupported) {
        // Expected on non-iOS / iOS < 16 — resolve to null silently
        setValues(null);
      } else {
        // Unexpected error — log once and resolve to null
        if (__DEV__) {
          console.warn('[useFocusFilter] Bridge error:', err);
        }
        setValues(null);
      }
    }
  }, []);

  // Mount fetch
  useEffect(() => {
    fetchValues();
  }, [fetchValues]);

  // AppState refetch
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        fetchValues();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [fetchValues]);

  const refresh = useCallback(() => {
    fetchValues();
  }, [fetchValues]);

  const simulateActivation = useCallback((draft: { mode: string; accentColor: string }) => {
    // Store pending simulation
    pendingSimulationRef.current = draft;

    // Clear existing debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new debounce timer
    debounceTimerRef.current = setTimeout(() => {
      if (pendingSimulationRef.current) {
        const entry: EventLogEntry = {
          kind: 'simulated',
          values: pendingSimulationRef.current,
          at: new Date().toISOString(),
        };

        setEventLog((prev) => {
          const next = [entry, ...prev];
          return next.slice(0, EVENT_LOG_CAP);
        });

        pendingSimulationRef.current = null;
      }
    }, SIMULATE_DEBOUNCE_MS);
  }, []);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return {
    values,
    refresh,
    eventLog,
    simulateActivation,
  };
}
