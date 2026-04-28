/**
 * useLocationUpdates hook (feature 025).
 *
 * Manages continuous location updates with configurable accuracy and distance filter.
 * Automatically restarts the subscription when settings change while running (FR-007).
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import * as Location from 'expo-location';

import {
  ACCURACY_PRESETS,
  DEFAULT_ACCURACY_PRESET,
  type AccuracyPreset,
} from '../accuracy-presets';
import { DEFAULT_DISTANCE_FILTER, type DistanceFilter } from '../distance-filters';
import type { LocationSample } from '../types';

const WINDOW_MS = 60_000; // 60 seconds

interface Subscription {
  remove: () => void;
}

export interface UseLocationUpdates {
  isRunning: boolean;
  latest: LocationSample | null;
  samplesPerMinute: number;
  start: () => Promise<void>;
  stop: () => Promise<void>;
  setAccuracy: (preset: AccuracyPreset) => void;
  setDistanceFilter: (filter: DistanceFilter) => void;
  accuracy: AccuracyPreset;
  distanceFilter: DistanceFilter;
  error: Error | null;
}

export function useLocationUpdates(): UseLocationUpdates {
  const [isRunning, setIsRunning] = useState(false);
  const [latest, setLatest] = useState<LocationSample | null>(null);
  const [samplesWindow, setSamplesWindow] = useState<LocationSample[]>([]);
  const [accuracy, setAccuracyState] = useState<AccuracyPreset>(DEFAULT_ACCURACY_PRESET);
  const [distanceFilter, setDistanceFilterState] =
    useState<DistanceFilter>(DEFAULT_DISTANCE_FILTER);
  const [error, setError] = useState<Error | null>(null);

  const subscriptionRef = useRef<Subscription | null>(null);
  const mountedRef = useRef(true);
  const accuracyRef = useRef(accuracy);
  const distanceFilterRef = useRef(distanceFilter);

  // Keep refs in sync
  accuracyRef.current = accuracy;
  distanceFilterRef.current = distanceFilter;

  // Compute samples per minute from window
  const samplesPerMinute = samplesWindow.filter(
    (s) => Date.now() - s.timestamp.getTime() <= WINDOW_MS,
  ).length;

  const startSubscription = useCallback(async () => {
    try {
      // Clean up existing subscription
      if (subscriptionRef.current) {
        subscriptionRef.current.remove();
        subscriptionRef.current = null;
      }

      const subscription = await Location.watchPositionAsync(
        {
          accuracy: accuracyRef.current.value,
          distanceInterval: distanceFilterRef.current.meters,
        },
        (location) => {
          if (!mountedRef.current) return;

          const sample: LocationSample = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            altitude: location.coords.altitude,
            accuracy: location.coords.accuracy,
            speed: location.coords.speed,
            heading: location.coords.heading,
            timestamp: new Date(location.timestamp),
          };

          setLatest(sample);
          setSamplesWindow((prev) => {
            const now = Date.now();
            // Keep only samples within the window + the new one
            const filtered = prev.filter((s) => now - s.timestamp.getTime() <= WINDOW_MS);
            return [...filtered, sample];
          });
        },
      );

      if (!mountedRef.current) {
        subscription.remove();
        return;
      }

      subscriptionRef.current = subscription;
      setIsRunning(true);
      setError(null);
    } catch (err) {
      if (!mountedRef.current) return;
      setError(err instanceof Error ? err : new Error(String(err)));
      setIsRunning(false);
    }
  }, []);

  const start = useCallback(async () => {
    await startSubscription();
  }, [startSubscription]);

  const stop = useCallback(async () => {
    if (subscriptionRef.current) {
      subscriptionRef.current.remove();
      subscriptionRef.current = null;
    }
    if (mountedRef.current) {
      setIsRunning(false);
    }
  }, []);

  const setAccuracy = useCallback(
    (preset: AccuracyPreset) => {
      setAccuracyState(preset);
      accuracyRef.current = preset;
      // Restart if running (FR-007)
      if (subscriptionRef.current) {
        void startSubscription();
      }
    },
    [startSubscription],
  );

  const setDistanceFilterCb = useCallback(
    (filter: DistanceFilter) => {
      setDistanceFilterState(filter);
      distanceFilterRef.current = filter;
      // Restart if running (FR-007)
      if (subscriptionRef.current) {
        void startSubscription();
      }
    },
    [startSubscription],
  );

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

  // Periodically update samplesPerMinute (prune old samples)
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      if (!mountedRef.current) return;
      setSamplesWindow((prev) => {
        const now = Date.now();
        return prev.filter((s) => now - s.timestamp.getTime() <= WINDOW_MS);
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning]);

  return {
    isRunning,
    latest,
    samplesPerMinute,
    start,
    stop,
    setAccuracy,
    setDistanceFilter: setDistanceFilterCb,
    accuracy,
    distanceFilter,
    error,
  };
}
