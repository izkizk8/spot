/**
 * useARKitSession Hook - Complete state machine for ARKit session
 * Feature: 034-arkit-basics
 *
 * Manages configuration, anchors, session info, and orchestrates bridge calls.
 * Polls getSessionInfo() every 500ms (R-D). Cleanup on unmount sets cancelled
 * ref and best-effort pauseSession.
 *
 * @see specs/034-arkit-basics/data-model.md Entity 7
 * @see specs/034-arkit-basics/research.md §4 (R-D polling cadence)
 * @see specs/034-arkit-basics/tasks.md T009, T010
 */

import { useCallback, useEffect, useReducer, useRef } from 'react';
import * as arkit from '@/native/arkit';
import {
  ARKitConfiguration,
  AnchorRecord,
  SessionInfo,
  INITIAL_SESSION_INFO,
  DEFAULT_CONFIGURATION,
} from '@/native/arkit.types';

/**
 * Entity 7 — ARKitSession (composite hook state)
 */
export interface ARKitSession {
  readonly config: ARKitConfiguration;
  readonly anchors: readonly AnchorRecord[];
  readonly info: SessionInfo;

  // Actions (stable identities; reducer-backed)
  readonly placeAnchorAt: (x: number, y: number) => Promise<void>;
  readonly clearAnchors: () => Promise<void>;
  readonly pause: () => Promise<void>;
  readonly resume: () => Promise<void>;
  readonly reset: () => Promise<void>;
  readonly setConfig: (next: Partial<ARKitConfiguration>) => void;
}

interface State {
  config: ARKitConfiguration;
  anchors: readonly AnchorRecord[];
  info: SessionInfo;
  queuedConfig: Partial<ARKitConfiguration> | null;
}

type Action =
  | { type: 'SET_CONFIG'; delta: Partial<ARKitConfiguration> }
  | { type: 'ANCHOR_ADDED'; anchor: AnchorRecord }
  | { type: 'ANCHORS_CLEARED' }
  | { type: 'INFO_UPDATE'; info: SessionInfo }
  | { type: 'ERROR'; error: string }
  | { type: 'RESET' };

const initialState: State = {
  config: DEFAULT_CONFIGURATION,
  anchors: [],
  info: INITIAL_SESSION_INFO,
  queuedConfig: null,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_CONFIG': {
      const nextConfig = { ...state.config, ...action.delta };
      // If paused, queue the config for next resume
      if (state.info.state === 'paused') {
        return { ...state, config: nextConfig, queuedConfig: action.delta };
      }
      return { ...state, config: nextConfig };
    }
    case 'ANCHOR_ADDED': {
      // Newest first
      const newAnchors = [action.anchor, ...state.anchors];
      return { ...state, anchors: newAnchors };
    }
    case 'ANCHORS_CLEARED': {
      return { ...state, anchors: [] };
    }
    case 'INFO_UPDATE': {
      return { ...state, info: action.info };
    }
    case 'ERROR': {
      return {
        ...state,
        info: {
          ...state.info,
          state: 'error',
          lastError: action.error,
        },
      };
    }
    case 'RESET': {
      return {
        ...state,
        anchors: [],
        info: INITIAL_SESSION_INFO,
        queuedConfig: null,
      };
    }
    default:
      return state;
  }
}

/**
 * Classify bridge error per R-D: unsupported / cancelled / failed
 */
function classifyError(error: unknown): string {
  if (
    error &&
    typeof error === 'object' &&
    'code' in error &&
    error.code === 'ARKIT_NOT_SUPPORTED'
  ) {
    return 'unsupported';
  }
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

/**
 * useARKitSession Hook
 */
export function useARKitSession(): ARKitSession {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Refs for lifecycle guards
  const mounted = useRef(true);
  const cancelled = useRef(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Polling lifecycle (500 ms cadence, R-D)
  useEffect(() => {
    mounted.current = true;
    cancelled.current = false;

    // Immediate first poll
    arkit
      .getSessionInfo()
      .then((info) => {
        if (!cancelled.current) {
          dispatch({ type: 'INFO_UPDATE', info });
        }
      })
      .catch(() => {
        // Swallow; first poll failure is benign
      });

    // Start interval
    const interval = setInterval(() => {
      if (cancelled.current || !mounted.current) {
        return;
      }
      arkit
        .getSessionInfo()
        .then((info) => {
          if (!cancelled.current) {
            dispatch({ type: 'INFO_UPDATE', info });
          }
        })
        .catch(() => {
          // Swallow; poll failures are benign
        });
    }, 500);

    intervalRef.current = interval;

    return () => {
      mounted.current = false;
      cancelled.current = true;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      // Best-effort pause on unmount
      arkit.pauseSession().catch(() => {
        // Swallow rejection
      });
    };
  }, []);

  const placeAnchorAt = useCallback(async (x: number, y: number) => {
    try {
      const anchor = await arkit.placeAnchorAt(x, y);
      if (anchor && !cancelled.current) {
        dispatch({ type: 'ANCHOR_ADDED', anchor });
      }
    } catch (error) {
      const message = classifyError(error);
      if (!cancelled.current) {
        dispatch({ type: 'ERROR', error: message });
      }
    }
  }, []);

  const clearAnchors = useCallback(async () => {
    try {
      await arkit.clearAnchors();
      if (!cancelled.current) {
        dispatch({ type: 'ANCHORS_CLEARED' });
      }
    } catch (error) {
      const message = classifyError(error);
      if (!cancelled.current) {
        dispatch({ type: 'ERROR', error: message });
      }
    }
  }, []);

  const pause = useCallback(async () => {
    try {
      await arkit.pauseSession();
      // Info will update via polling
    } catch (error) {
      const message = classifyError(error);
      if (!cancelled.current) {
        dispatch({ type: 'ERROR', error: message });
      }
    }
  }, []);

  const resume = useCallback(async () => {
    try {
      await arkit.resumeSession();
      // If there was a queued config, it's already applied by reducer
      // Info will update via polling
    } catch (error) {
      const message = classifyError(error);
      if (!cancelled.current) {
        dispatch({ type: 'ERROR', error: message });
      }
    }
  }, []);

  const reset = useCallback(async () => {
    try {
      await arkit.clearAnchors();
      if (!cancelled.current) {
        dispatch({ type: 'RESET' });
      }
      // Re-apply current config via resumeSession (or session restart)
      await arkit.resumeSession();
    } catch (error) {
      const message = classifyError(error);
      if (!cancelled.current) {
        dispatch({ type: 'ERROR', error: message });
      }
    }
  }, []);

  const setConfig = useCallback((delta: Partial<ARKitConfiguration>) => {
    dispatch({ type: 'SET_CONFIG', delta });
  }, []);

  return {
    config: state.config,
    anchors: state.anchors,
    info: state.info,
    placeAnchorAt,
    clearAnchors,
    pause,
    resume,
    reset,
    setConfig,
  };
}
