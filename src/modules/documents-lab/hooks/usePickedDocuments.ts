/**
 * usePickedDocuments — single public hook surface for the documents-lab module.
 * Feature: 032-document-picker-quicklook
 *
 * Owns load / persist / mutate / filter cycle. Reducer-serialised mutations.
 * The ONLY file that imports `documents-store` runtime APIs (FR-012).
 */

import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react';

import {
  load as storeLoad,
  save as storeSave,
  type DocumentEntry,
  type DocumentsStoreState,
} from '../documents-store';
import { filterMatchesEntry, type DocumentFilter } from '../mime-types';

interface State {
  readonly files: readonly DocumentEntry[];
  readonly filter: DocumentFilter;
  readonly hydrated: boolean;
  readonly error: Error | null;
}

type Action =
  | { type: 'HYDRATE'; state: DocumentsStoreState }
  | { type: 'HYDRATE_ERROR'; error: Error }
  | { type: 'ADD'; entry: DocumentEntry }
  | { type: 'REMOVE'; id: string }
  | { type: 'CLEAR' }
  | { type: 'SET_FILTER'; filter: DocumentFilter }
  | { type: 'REVERT'; snapshot: { files: readonly DocumentEntry[]; filter: DocumentFilter } }
  | { type: 'SET_ERROR'; error: Error | null };

const initial: State = {
  files: [],
  filter: 'all',
  hydrated: false,
  error: null,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'HYDRATE':
      return {
        ...state,
        files: action.state.files,
        filter: action.state.filter,
        hydrated: true,
      };
    case 'HYDRATE_ERROR':
      return { ...state, hydrated: true, error: action.error };
    case 'ADD':
      return { ...state, files: [...state.files, action.entry] };
    case 'REMOVE':
      return { ...state, files: state.files.filter((f) => f.id !== action.id) };
    case 'CLEAR':
      return { ...state, files: [] };
    case 'SET_FILTER':
      return { ...state, filter: action.filter };
    case 'REVERT':
      return { ...state, files: action.snapshot.files, filter: action.snapshot.filter };
    case 'SET_ERROR':
      return { ...state, error: action.error };
    default:
      return state;
  }
}

export interface UsePickedDocumentsReturn {
  readonly files: readonly DocumentEntry[];
  readonly visibleFiles: readonly DocumentEntry[];
  readonly filter: DocumentFilter;
  readonly error: Error | null;
  readonly add: (entry: DocumentEntry) => void;
  readonly remove: (id: string) => void;
  readonly clear: () => void;
  readonly setFilter: (filter: DocumentFilter) => void;
}

export function usePickedDocuments(): UsePickedDocumentsReturn {
  const [state, dispatch] = useReducer(reducer, initial);
  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Hydrate on mount
  useEffect(() => {
    let cancelled = false;
    void storeLoad({
      onError: (err) => {
        if (cancelled) return;
        dispatch({
          type: 'SET_ERROR',
          error: new Error(`documents-store: ${err.kind}`),
        });
      },
    }).then((loaded) => {
      if (cancelled) return;
      dispatch({ type: 'HYDRATE', state: loaded });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const persist = useCallback(async (snapshotBefore: { files: readonly DocumentEntry[]; filter: DocumentFilter }, next: DocumentsStoreState) => {
    try {
      await storeSave(next);
    } catch (err) {
      dispatch({ type: 'REVERT', snapshot: snapshotBefore });
      dispatch({
        type: 'SET_ERROR',
        error: err instanceof Error ? err : new Error(String(err)),
      });
    }
  }, []);

  const add = useCallback(
    (entry: DocumentEntry) => {
      const before = { files: stateRef.current.files, filter: stateRef.current.filter };
      const nextFiles = [...before.files, entry];
      dispatch({ type: 'ADD', entry });
      // Update ref synchronously so back-to-back add() calls see the new array
      stateRef.current = { ...stateRef.current, files: nextFiles };
      void persist(before, { files: nextFiles, filter: before.filter });
    },
    [persist],
  );

  const remove = useCallback(
    (id: string) => {
      const before = { files: stateRef.current.files, filter: stateRef.current.filter };
      const nextFiles = before.files.filter((f) => f.id !== id);
      dispatch({ type: 'REMOVE', id });
      stateRef.current = { ...stateRef.current, files: nextFiles };
      void persist(before, { files: nextFiles, filter: before.filter });
    },
    [persist],
  );

  const clear = useCallback(() => {
    const before = { files: stateRef.current.files, filter: stateRef.current.filter };
    dispatch({ type: 'CLEAR' });
    stateRef.current = { ...stateRef.current, files: [] };
    void persist(before, { files: [], filter: before.filter });
  }, [persist]);

  const setFilter = useCallback(
    (filter: DocumentFilter) => {
      const before = { files: stateRef.current.files, filter: stateRef.current.filter };
      dispatch({ type: 'SET_FILTER', filter });
      stateRef.current = { ...stateRef.current, filter };
      void persist(before, { files: before.files, filter });
    },
    [persist],
  );

  const visibleFiles = useMemo(
    () => state.files.filter((f) => filterMatchesEntry(state.filter, f)),
    [state.files, state.filter],
  );

  return {
    files: state.files,
    visibleFiles,
    filter: state.filter,
    error: state.error,
    add,
    remove,
    clear,
    setFilter,
  };
}
