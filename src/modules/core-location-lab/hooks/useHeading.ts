/**
 * Hook for compass heading updates (feature 025).
 *
 * Subscribes to watchHeadingAsync and exposes heading samples,
 * calibration status, and samples-per-minute rate.
 */
import { useState, useCallback, useRef, useEffect } from 'react';
import * as Location from 'expo-location';

import type { HeadingSample } from '../types';

interface UseHeadingState {
  /** Whether the heading subscription is active */
  running: boolean;
  /** Latest heading sample */
  latest: HeadingSample | null;
  /** Calculated samples per minute from 60-second rolling window */
  samplesPerMinute: number;
  /** Error if subscription failed */
  error: Error | null;
  /** Whether the compass is calibrated (accuracy > 0) */
  isCalibrated: boolean;
}

interface UseHeadingReturn extends UseHeadingState {
  /** Start heading subscription */
  start: () => void;
  /** Stop heading subscription */
  stop: () => void;
}

const ROLLING_WINDOW_MS = 60_000; // 60 seconds

export function useHeading(): UseHeadingReturn {
  const [running, setRunning] = useState(false);
  const [latest, setLatest] = useState<HeadingSample | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [sampleTimestamps, setSampleTimestamps] = useState<number[]>([]);

  const subscriptionRef = useRef<Location.LocationSubscription | null>(null);
  const mountedRef = useRef(true);

  // Calculate samples per minute from rolling window
  const samplesPerMinute = sampleTimestamps.length;

  // Derive calibration status from latest sample
  const isCalibrated = latest !== null ? latest.accuracy > 0 : true;

  const start = useCallback(() => {
    if (subscriptionRef.current) return;

    setError(null);
    setSampleTimestamps([]);

    Location.watchHeadingAsync((heading) => {
      if (!mountedRef.current) return;

      const now = Date.now();
      const sample: HeadingSample = {
        magHeading: heading.magHeading,
        trueHeading: heading.trueHeading,
        accuracy: heading.accuracy,
        timestamp: new Date(now),
      };

      setLatest(sample);

      // Update rolling window
      setSampleTimestamps((prev) => {
        const cutoff = now - ROLLING_WINDOW_MS;
        const filtered = prev.filter((ts) => ts >= cutoff);
        return [...filtered, now];
      });
    })
      .then((sub) => {
        if (!mountedRef.current) {
          sub.remove();
          return;
        }
        subscriptionRef.current = sub;
        setRunning(true);
      })
      .catch((err) => {
        if (!mountedRef.current) return;
        setError(err instanceof Error ? err : new Error(String(err)));
        setRunning(false);
      });
  }, []);

  const stop = useCallback(() => {
    if (subscriptionRef.current) {
      subscriptionRef.current.remove();
      subscriptionRef.current = null;
    }
    setRunning(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (subscriptionRef.current) {
        subscriptionRef.current.remove();
        subscriptionRef.current = null;
      }
    };
  }, []);

  return {
    running,
    latest,
    samplesPerMinute,
    error,
    isCalibrated,
    start,
    stop,
  };
}
