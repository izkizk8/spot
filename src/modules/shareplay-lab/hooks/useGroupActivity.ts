/**
 * useGroupActivity — feature 047 / SharePlay Lab.
 *
 * Wraps `src/native/shareplay.ts` into a React-friendly state
 * machine. Owns:
 *   - the picked activity type + title (composer state);
 *   - the cached `SessionState` (status / participants / counter);
 *   - the loading flag and `lastError` string.
 *
 * Contracts:
 *   - All async helpers are no-throw: errors surface via
 *     `lastError`.
 *   - The hook ignores async completions that resolve after
 *     unmount (an internal `aliveRef` guards every state update).
 *   - The native bridge is loaded via a getter so tests can swap
 *     it out using `__setSharePlayBridgeForTests`.
 */

import { useCallback, useEffect, useRef, useState } from 'react';

import defaultBridge from '@/native/shareplay';
import {
  type ActivityConfig,
  type ActivityType,
  INITIAL_SESSION_STATE,
  type SessionState,
  type SharePlayBridge,
} from '@/native/shareplay.types';

import { ACTIVITY_TYPES, DEFAULT_ACTIVITY_TYPE, findActivityType } from '../activity-types';

let bridgeOverride: SharePlayBridge | null = null;

/**
 * Test helper — replaces the bridge resolved by
 * `useGroupActivity`. Pass `null` to restore the default bridge.
 * Exported only for tests.
 */
export function __setSharePlayBridgeForTests(b: SharePlayBridge | null): void {
  bridgeOverride = b;
}

function getBridge(): SharePlayBridge {
  return bridgeOverride ?? (defaultBridge as unknown as SharePlayBridge);
}

export interface UseGroupActivityReturn {
  readonly available: boolean;
  readonly activityType: ActivityType;
  readonly title: string;
  readonly state: SessionState;
  readonly loading: boolean;
  readonly lastError: string | null;
  selectActivityType(t: ActivityType): void;
  setTitle(t: string): void;
  startActivity(): Promise<void>;
  endActivity(): Promise<void>;
  sendCounter(value: number): Promise<void>;
  reset(): void;
}

export function useGroupActivity(): UseGroupActivityReturn {
  const [available, _setAvailable] = useState<boolean>(() => {
    try {
      return getBridge().isAvailable();
    } catch {
      return false;
    }
  });
  const [activityType, setActivityType] = useState<ActivityType>(DEFAULT_ACTIVITY_TYPE);
  const initialDescriptor = findActivityType(DEFAULT_ACTIVITY_TYPE) ?? ACTIVITY_TYPES[0];
  const [title, setTitleState] = useState<string>(initialDescriptor?.defaultTitle ?? 'Showcase');
  const [state, setState] = useState<SessionState>(() => {
    try {
      return getBridge().getState();
    } catch {
      return INITIAL_SESSION_STATE;
    }
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [lastError, setLastError] = useState<string | null>(null);

  const aliveRef = useRef(true);

  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
    };
  }, []);

  // Subscribe to native state updates. The capability + initial
  // state snapshot are seeded via the lazy initializers above so we
  // never call setState synchronously inside this effect body.
  useEffect(() => {
    const bridge = getBridge();
    let unsubscribe = () => {};
    try {
      unsubscribe = bridge.subscribe((next) => {
        if (!aliveRef.current) return;
        setState(next);
      });
    } catch {
      unsubscribe = () => {};
    }
    return () => {
      try {
        unsubscribe();
      } catch {
        /* swallow — defensive */
      }
    };
  }, []);

  const safeError = useCallback((err: unknown) => {
    if (!aliveRef.current) return;
    const msg = err instanceof Error ? err.message : String(err);
    setLastError(msg);
  }, []);

  const selectActivityType = useCallback((t: ActivityType) => {
    setActivityType(t);
    const descriptor = findActivityType(t);
    if (descriptor) {
      setTitleState(descriptor.defaultTitle);
    }
  }, []);

  const setTitle = useCallback((t: string) => {
    setTitleState(t);
  }, []);

  const startActivity = useCallback(async () => {
    const bridge = getBridge();
    setLoading(true);
    setLastError(null);
    try {
      const config: ActivityConfig = { type: activityType, title };
      await bridge.startActivity(config);
    } catch (err) {
      safeError(err);
    } finally {
      if (aliveRef.current) setLoading(false);
    }
  }, [activityType, title, safeError]);

  const endActivity = useCallback(async () => {
    const bridge = getBridge();
    setLoading(true);
    try {
      await bridge.endActivity();
    } catch (err) {
      safeError(err);
    } finally {
      if (aliveRef.current) setLoading(false);
    }
  }, [safeError]);

  const sendCounter = useCallback(
    async (value: number) => {
      const bridge = getBridge();
      try {
        await bridge.sendCounter(value);
      } catch (err) {
        safeError(err);
      }
    },
    [safeError],
  );

  const reset = useCallback(() => {
    setState(INITIAL_SESSION_STATE);
    setLastError(null);
    setLoading(false);
  }, []);

  return {
    available,
    activityType,
    title,
    state,
    loading,
    lastError,
    selectActivityType,
    setTitle,
    startActivity,
    endActivity,
    sendCounter,
    reset,
  };
}
