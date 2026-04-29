/**
 * useSpotlightIndex — hook wrapping bridge + source mapper — feature 031.
 *
 * Returns `{ items, indexedIds, isAvailable, isBusy, error, toggleItem, indexAll,
 * removeAll, search, results, markActivity, clearActivity, activityActive }`.
 *
 * @see specs/031-spotlight-indexing/contracts/spotlight-bridge.contract.ts
 */

import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react';

import { MODULES } from '@/modules/registry';
import * as bridge from '@/native/spotlight';
import type { ActivityState, SearchableItem, UserActivityDescriptor } from '@/native/spotlight.types';

import { mapRegistryToItems } from '../searchable-items-source';

interface State {
  indexedIds: Set<string>;
  isBusy: boolean;
  error: Error | null;
  results: readonly SearchableItem[];
  activityActive: ActivityState;
}

type Action =
  | { type: 'SET_INDEXED'; id: string }
  | { type: 'REMOVE_INDEXED'; id: string }
  | { type: 'SET_ALL_INDEXED'; ids: Set<string> }
  | { type: 'CLEAR_ALL_INDEXED' }
  | { type: 'SET_BUSY'; busy: boolean }
  | { type: 'SET_ERROR'; error: Error | null }
  | { type: 'SET_RESULTS'; results: readonly SearchableItem[] }
  | { type: 'SET_ACTIVITY'; active: ActivityState };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_INDEXED': {
      const newIds = new Set(state.indexedIds);
      newIds.add(action.id);
      return { ...state, indexedIds: newIds };
    }
    case 'REMOVE_INDEXED': {
      const newIds = new Set(state.indexedIds);
      newIds.delete(action.id);
      return { ...state, indexedIds: newIds };
    }
    case 'SET_ALL_INDEXED':
      return { ...state, indexedIds: action.ids };
    case 'CLEAR_ALL_INDEXED':
      return { ...state, indexedIds: new Set() };
    case 'SET_BUSY':
      return { ...state, isBusy: action.busy };
    case 'SET_ERROR':
      return { ...state, error: action.error };
    case 'SET_RESULTS':
      return { ...state, results: action.results };
    case 'SET_ACTIVITY':
      return { ...state, activityActive: action.active };
    default:
      return state;
  }
}

const initialState: State = {
  indexedIds: new Set(),
  isBusy: false,
  error: null,
  results: [],
  activityActive: 'inactive',
};

export interface UseSpotlightIndexReturn {
  readonly items: readonly SearchableItem[];
  readonly indexedIds: ReadonlySet<string>;
  readonly isAvailable: boolean;
  readonly isBusy: boolean;
  readonly error: Error | null;
  readonly results: readonly SearchableItem[];
  readonly activityActive: ActivityState;
  readonly toggleItem: (id: string) => Promise<void>;
  readonly indexAll: () => Promise<void>;
  readonly removeAll: () => Promise<void>;
  readonly search: (query: string) => Promise<void>;
  readonly markActivity: (descriptor: Omit<UserActivityDescriptor, 'userInfo'>) => Promise<void>;
  readonly clearActivity: () => Promise<void>;
}

export function useSpotlightIndex(): UseSpotlightIndexReturn {
  const [state, dispatch] = useReducer(reducer, initialState);
  const stateRef = useRef(state);
  stateRef.current = state;

  const isAvailable = bridge.isAvailable();

  const items = useMemo(() => {
    return mapRegistryToItems(MODULES);
  }, []);

  const toggleItem = useCallback(
    async (id: string) => {
      if (!isAvailable) return;

      const currentlyIndexed = stateRef.current.indexedIds.has(id);
      const item = items.find((i) => i.id === id);
      if (!item) return;

      // Optimistically update
      if (currentlyIndexed) {
        dispatch({ type: 'REMOVE_INDEXED', id });
      } else {
        dispatch({ type: 'SET_INDEXED', id });
      }

      try {
        if (currentlyIndexed) {
          await bridge.delete([id]);
        } else {
          await bridge.index([item]);
        }
        dispatch({ type: 'SET_ERROR', error: null });
      } catch (err) {
        // Revert on failure
        if (currentlyIndexed) {
          dispatch({ type: 'SET_INDEXED', id });
        } else {
          dispatch({ type: 'REMOVE_INDEXED', id });
        }
        dispatch({ type: 'SET_ERROR', error: err instanceof Error ? err : new Error(String(err)) });
      }
    },
    [isAvailable, items],
  );

  const indexAll = useCallback(async () => {
    if (!isAvailable) return;

    dispatch({ type: 'SET_BUSY', busy: true });
    try {
      await bridge.index(items);
      const allIds = new Set(items.map((i) => i.id));
      dispatch({ type: 'SET_ALL_INDEXED', ids: allIds });
      dispatch({ type: 'SET_ERROR', error: null });
    } catch (err) {
      dispatch({ type: 'SET_ERROR', error: err instanceof Error ? err : new Error(String(err)) });
    } finally {
      dispatch({ type: 'SET_BUSY', busy: false });
    }
  }, [isAvailable, items]);

  const removeAll = useCallback(async () => {
    if (!isAvailable) return;

    dispatch({ type: 'SET_BUSY', busy: true });
    try {
      await bridge.deleteAll();
      dispatch({ type: 'CLEAR_ALL_INDEXED' });
      dispatch({ type: 'SET_ERROR', error: null });
    } catch (err) {
      dispatch({ type: 'SET_ERROR', error: err instanceof Error ? err : new Error(String(err)) });
    } finally {
      dispatch({ type: 'SET_BUSY', busy: false });
    }
  }, [isAvailable]);

  const searchFn = useCallback(
    async (query: string) => {
      if (!isAvailable) return;

      const trimmed = query.trim();
      if (!trimmed) {
        dispatch({ type: 'SET_RESULTS', results: [] });
        return;
      }

      try {
        const searchResults = await bridge.search(trimmed, 25);
        dispatch({ type: 'SET_RESULTS', results: searchResults });
        dispatch({ type: 'SET_ERROR', error: null });
      } catch (err) {
        dispatch({ type: 'SET_RESULTS', results: [] });
        dispatch({ type: 'SET_ERROR', error: err instanceof Error ? err : new Error(String(err)) });
      }
    },
    [isAvailable],
  );

  const markActivity = useCallback(
    async (descriptor: Omit<UserActivityDescriptor, 'userInfo'>) => {
      if (!isAvailable) return;

      try {
        await bridge.markCurrentActivity({
          ...descriptor,
          userInfo: { source: 'spotlight-lab' },
        });
        dispatch({ type: 'SET_ACTIVITY', active: 'active' });
        dispatch({ type: 'SET_ERROR', error: null });
      } catch (err) {
        dispatch({ type: 'SET_ERROR', error: err instanceof Error ? err : new Error(String(err)) });
      }
    },
    [isAvailable],
  );

  const clearActivity = useCallback(async () => {
    if (!isAvailable) return;

    try {
      await bridge.clearCurrentActivity();
      dispatch({ type: 'SET_ACTIVITY', active: 'inactive' });
      dispatch({ type: 'SET_ERROR', error: null });
    } catch (err) {
      dispatch({ type: 'SET_ERROR', error: err instanceof Error ? err : new Error(String(err)) });
    }
  }, [isAvailable]);

  // Effect cleanup: invalidate activity on unmount if active
  useEffect(() => {
    return () => {
      if (stateRef.current.activityActive === 'active' && bridge.isAvailable()) {
        void bridge.clearCurrentActivity().catch(() => {
          // Swallow errors during cleanup
        });
      }
    };
  }, []);

  return {
    items,
    indexedIds: state.indexedIds,
    isAvailable,
    isBusy: state.isBusy,
    error: state.error,
    results: state.results,
    activityActive: state.activityActive,
    toggleItem,
    indexAll,
    removeAll,
    search: searchFn,
    markActivity,
    clearActivity,
  };
}
