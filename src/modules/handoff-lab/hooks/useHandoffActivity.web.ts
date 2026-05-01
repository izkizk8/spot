/**
 * useHandoffActivity — feature 040 / T025 (web/android stub).
 *
 * JS-pure stub matching the iOS hook's public shape.
 * Every action returns a rejected promise (HandoffNotSupported) — the
 * Android/Web screens render `IOSOnlyBanner` only and never invoke these.
 */

import { useCallback, useEffect, useState } from 'react';

import { HandoffNotSupported } from '@/native/handoff.web';

import type { ActivityDefinition, ContinuationEvent } from '../types';

export interface UseHandoffActivityReturn {
  readonly currentActivity: ActivityDefinition | null;
  readonly log: readonly ContinuationEvent[];
  readonly isAvailable: boolean;
  readonly setCurrent: (definition: ActivityDefinition) => Promise<void>;
  readonly resignCurrent: () => Promise<void>;
  readonly getCurrent: () => Promise<ActivityDefinition | null>;
}

export function useHandoffActivity(): UseHandoffActivityReturn {
  const [currentActivity] = useState<ActivityDefinition | null>(null);
  const [log] = useState<ContinuationEvent[]>([]);

  useEffect(() => {
    // No-op: bridge listener is unsupported on this platform.
    return () => {};
  }, []);

  const setCurrent = useCallback(
    (_definition: ActivityDefinition): Promise<void> =>
      Promise.reject(new HandoffNotSupported('setCurrent')),
    [],
  );

  const resignCurrent = useCallback(
    (): Promise<void> => Promise.reject(new HandoffNotSupported('resignCurrent')),
    [],
  );

  const getCurrent = useCallback(
    (): Promise<ActivityDefinition | null> => Promise.reject(new HandoffNotSupported('getCurrent')),
    [],
  );

  return {
    currentActivity,
    log,
    isAvailable: false,
    setCurrent,
    resignCurrent,
    getCurrent,
  };
}
