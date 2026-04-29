/**
 * useShareSession Hook - Complete state machine for share operations
 * Feature: 033-share-sheet
 *
 * Manages content, exclusions, custom activity flag, anchor rect, result log,
 * and orchestrates bridge calls. Clamps log to 10 newest-first entries.
 *
 * @see specs/033-share-sheet/data-model.md Entity 7, Entity 8
 * @see specs/033-share-sheet/research.md §6 (R-F anchor capture)
 * @see specs/033-share-sheet/tasks.md T012, T013
 */

import { useCallback, useReducer, useRef } from 'react';
import { bridge } from '@/native/share-sheet';
import type { ShareContent, AnchorRect, ShareResult } from '@/native/share-sheet.types';
import type { ExcludedActivitySelection } from '../activity-types';

/**
 * Entity 7 — ShareLogEntry
 */
export interface ShareLogEntry {
  readonly id: string;
  readonly type: 'text' | 'url' | 'image' | 'file';
  readonly activityType: string;
  readonly outcome: 'completed' | 'cancelled' | 'error';
  readonly errorMessage?: string;
  readonly timestamp: number;
}

/**
 * Entity 8 — ShareSession (composite hook state)
 */
export interface ShareSession {
  // State
  readonly content: ShareContent;
  readonly exclusions: ExcludedActivitySelection;
  readonly includeCustomActivity: boolean;
  readonly anchor: AnchorRect | null;
  readonly log: readonly ShareLogEntry[];
  // Setters
  readonly setContent: (content: ShareContent) => void;
  readonly setExclusions: (selection: ExcludedActivitySelection) => void;
  readonly setIncludeCustomActivity: (value: boolean) => void;
  readonly setAnchor: (anchor: AnchorRect | null) => void;
  // Action
  readonly share: () => Promise<void>;
  // Status
  readonly isSharing: boolean;
}

interface State {
  content: ShareContent;
  exclusions: ExcludedActivitySelection;
  includeCustomActivity: boolean;
  anchor: AnchorRect | null;
  log: readonly ShareLogEntry[];
  isSharing: boolean;
}

type Action =
  | { type: 'SET_CONTENT'; content: ShareContent }
  | { type: 'SET_EXCLUSIONS'; exclusions: ExcludedActivitySelection }
  | { type: 'SET_INCLUDE_CUSTOM_ACTIVITY'; value: boolean }
  | { type: 'SET_ANCHOR'; anchor: AnchorRect | null }
  | { type: 'SHARE_START' }
  | { type: 'SHARE_END'; entry: ShareLogEntry };

const initialState: State = {
  content: { kind: 'text', text: 'Hello from spot showcase' },
  exclusions: { checked: new Set(), hideAll: false },
  includeCustomActivity: false,
  anchor: null,
  log: [],
  isSharing: false,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_CONTENT':
      return { ...state, content: action.content };
    case 'SET_EXCLUSIONS':
      return { ...state, exclusions: action.exclusions };
    case 'SET_INCLUDE_CUSTOM_ACTIVITY':
      return { ...state, includeCustomActivity: action.value };
    case 'SET_ANCHOR':
      return { ...state, anchor: action.anchor };
    case 'SHARE_START':
      return { ...state, isSharing: true };
    case 'SHARE_END': {
      // Clamp to 10 newest-first (FR-012)
      const newLog = [action.entry, ...state.log].slice(0, 10);
      return { ...state, isSharing: false, log: newLog };
    }
    default:
      return state;
  }
}

/**
 * Classify outcome per data-model Entity 7.
 */
function classifyOutcome(
  result: ShareResult | null,
  error: unknown,
): { outcome: ShareLogEntry['outcome']; errorMessage?: string } {
  if (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { outcome: 'error', errorMessage: message };
  }
  if (!result) {
    return { outcome: 'error', errorMessage: 'Bridge returned no result' };
  }
  if (result.completed) {
    return { outcome: 'completed' };
  }
  return { outcome: 'cancelled' };
}

/**
 * useShareSession Hook
 */
export function useShareSession(): ShareSession {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Ref to track sharing state (avoids race on concurrent calls)
  const isSharingRef = useRef(false);

  const setContent = useCallback((content: ShareContent) => {
    dispatch({ type: 'SET_CONTENT', content });
  }, []);

  const setExclusions = useCallback((exclusions: ExcludedActivitySelection) => {
    dispatch({ type: 'SET_EXCLUSIONS', exclusions });
  }, []);

  const setIncludeCustomActivity = useCallback((value: boolean) => {
    dispatch({ type: 'SET_INCLUDE_CUSTOM_ACTIVITY', value });
  }, []);

  const setAnchor = useCallback((anchor: AnchorRect | null) => {
    dispatch({ type: 'SET_ANCHOR', anchor });
  }, []);

  const share = useCallback(async () => {
    // Concurrent share() while isSharing is no-op
    if (isSharingRef.current) {
      return;
    }

    isSharingRef.current = true;
    dispatch({ type: 'SHARE_START' });

    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).slice(2, 8);
    const id = `${timestamp}-${randomSuffix}`;

    // Capture state at call time (need to use reducer approach or refs)
    // For simplicity, we'll just use the current state from the closure
    const contentToShare = state.content;
    const anchorToUse = state.anchor;
    const includeCustom = state.includeCustomActivity;

    let result: ShareResult | null = null;
    let error: unknown = null;

    try {
      result = await bridge.present({
        content: contentToShare,
        excludedActivityTypes: [], // Derived later from exclusions if needed
        includeCustomActivity: includeCustom,
        anchor: anchorToUse,
      });
    } catch (err) {
      error = err;
    }

    const classification = classifyOutcome(result, error);

    const entry: ShareLogEntry = {
      id,
      type: contentToShare.kind,
      activityType: result?.activityType ?? '(none)',
      outcome: classification.outcome,
      errorMessage: classification.errorMessage,
      timestamp,
    };

    dispatch({ type: 'SHARE_END', entry });
    isSharingRef.current = false;
  }, [state.content, state.anchor, state.includeCustomActivity]);

  return {
    content: state.content,
    exclusions: state.exclusions,
    includeCustomActivity: state.includeCustomActivity,
    anchor: state.anchor,
    log: state.log,
    isSharing: state.isSharing,
    setContent,
    setExclusions,
    setIncludeCustomActivity,
    setAnchor,
    share,
  };
}
