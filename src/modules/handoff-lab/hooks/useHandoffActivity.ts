/**
 * useHandoffActivity — feature 040 / T024 (iOS path).
 *
 * Subscribes to the native `Handoff` bridge once on mount, exposes
 * `{ currentActivity, log, isAvailable, setCurrent, resignCurrent, getCurrent }`,
 * mirrors `currentActivity` after `setCurrent` resolves, clears on
 * `resignCurrent`, and prepends normalised continuation events to `log`
 * with FIFO truncation at 10 (FR-014).
 *
 * @see specs/040-handoff-continuity/contracts/continuation.md
 */

import { useCallback, useEffect, useRef, useState } from 'react';

import * as bridge from '@/native/handoff';

import type { ActivityDefinition, ContinuationEvent } from '../types';

const LOG_MAX = 10;

interface WirePayload {
  activityType?: unknown;
  title?: unknown;
  webpageURL?: unknown;
  userInfo?: unknown;
  requiredUserInfoKeys?: unknown;
}

function normalise(wire: unknown): ContinuationEvent | null {
  const payload = (wire ?? {}) as WirePayload;
  if (typeof payload.activityType !== 'string' || payload.activityType.length === 0) {
    if (__DEV__) {
      console.warn('Discarded malformed continuation event:', wire);
    }
    return null;
  }
  const userInfo: Record<string, unknown> =
    typeof payload.userInfo === 'object' && payload.userInfo !== null
      ? (payload.userInfo as Record<string, unknown>)
      : {};
  const requiredUserInfoKeys = Array.isArray(payload.requiredUserInfoKeys)
    ? Array.from(
        new Set(payload.requiredUserInfoKeys.filter((k): k is string => typeof k === 'string')),
      ).toSorted()
    : [];
  return {
    activityType: payload.activityType,
    title: typeof payload.title === 'string' ? payload.title : '',
    webpageURL: typeof payload.webpageURL === 'string' ? payload.webpageURL : undefined,
    userInfo,
    requiredUserInfoKeys,
    receivedAt: new Date().toISOString(),
  };
}

export interface UseHandoffActivityReturn {
  readonly currentActivity: ActivityDefinition | null;
  readonly log: readonly ContinuationEvent[];
  readonly isAvailable: boolean;
  readonly setCurrent: (definition: ActivityDefinition) => Promise<void>;
  readonly resignCurrent: () => Promise<void>;
  readonly getCurrent: () => Promise<ActivityDefinition | null>;
}

export function useHandoffActivity(): UseHandoffActivityReturn {
  const [currentActivity, setCurrentActivity] = useState<ActivityDefinition | null>(null);
  const [log, setLog] = useState<ContinuationEvent[]>([]);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    const unsubscribe = bridge.addContinuationListener((wire) => {
      if (!mountedRef.current) return;
      const event = normalise(wire);
      if (event === null) return;
      setLog((prev) => [event, ...prev].slice(0, LOG_MAX));
    });
    return () => {
      mountedRef.current = false;
      unsubscribe();
    };
  }, []);

  const setCurrent = useCallback(async (definition: ActivityDefinition): Promise<void> => {
    await bridge.setCurrent(definition);
    setCurrentActivity(definition);
  }, []);

  const resignCurrent = useCallback(async (): Promise<void> => {
    await bridge.resignCurrent();
    setCurrentActivity(null);
  }, []);

  const getCurrent = useCallback((): Promise<ActivityDefinition | null> => {
    return bridge.getCurrent();
  }, []);

  return {
    currentActivity,
    log,
    isAvailable: bridge.isAvailable,
    setCurrent,
    resignCurrent,
    getCurrent,
  };
}
