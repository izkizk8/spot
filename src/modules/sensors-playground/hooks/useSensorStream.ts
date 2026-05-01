/**
 * @file useSensorStream.ts
 * @description Generic seam wrapping any expo-sensors class.
 * The ONLY file in this module that imports `expo-sensors` (FR-040).
 * Contract: specs/011-sensors-playground/contracts/sensor-stream-hook.md
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { Accelerometer, DeviceMotion, Gyroscope, Magnetometer } from 'expo-sensors';

import { createRingBuffer, type RingBuffer } from '../ring-buffer';

export type SampleRate = 30 | 60 | 120;

/** Permission lifecycle, normalised across requiresPermission/no-permission sensors. */
export type PermissionState = 'granted' | 'denied' | 'undetermined' | 'notRequired';

export const RATE_TO_INTERVAL_MS: Record<SampleRate, number> = {
  30: 1000 / 30,
  60: 1000 / 60,
  120: 1000 / 120,
};

/**
 * Minimal subscription handle returned by addListener. expo-sensors'
 * SensorSubscription satisfies this. We deliberately keep the type local so
 * the seam can also be satisfied by JS-only mocks in tests.
 */
export interface SensorSubscription {
  remove(): void;
}

/** Permission response shape the hook reads. Loose to accept jest mocks. */
export interface SensorPermissionResponse {
  status: string;
}

/**
 * Minimal structural type that all four expo-sensors classes satisfy.
 * Loose by design so unit tests can mock the hook with any matching shape.
 */
export interface SensorClassLike {
  isAvailableAsync(): Promise<boolean>;
  setUpdateInterval(intervalMs: number): void;
  addListener(handler: (raw: unknown) => void): SensorSubscription;
  getPermissionsAsync?: () => Promise<SensorPermissionResponse>;
  requestPermissionsAsync?: () => Promise<SensorPermissionResponse>;
}

/** Re-export real sensor classes so cards never need to import expo-sensors directly. */
export const Sensors = {
  Accelerometer: Accelerometer as unknown as SensorClassLike,
  Gyroscope: Gyroscope as unknown as SensorClassLike,
  Magnetometer: Magnetometer as unknown as SensorClassLike,
  DeviceMotion: DeviceMotion as unknown as SensorClassLike,
} as const;

export interface UseSensorStreamOptions<TSample> {
  sensor: SensorClassLike;
  mapSample: (raw: unknown) => TSample;
  requiresPermission: boolean;
  rate: SampleRate;
  capacity?: number;
}

export interface SensorStreamHandle<TSample> {
  readonly isAvailable: boolean;
  readonly permissionState: PermissionState;
  readonly isRunning: boolean;
  readonly latest: TSample | null;
  snapshot(n: number): readonly TSample[];
  subscribeToSnapshot(listener: () => void): () => void;
  start(): Promise<void>;
  stop(): void;
  requestPermission(): Promise<PermissionState>;
}

function mapStatus(status: string | undefined): PermissionState {
  if (status === 'granted') return 'granted';
  if (status === 'denied') return 'denied';
  return 'undetermined';
}

export function useSensorStream<TSample>(
  options: UseSensorStreamOptions<TSample>,
): SensorStreamHandle<TSample> {
  const { sensor, mapSample, requiresPermission, rate, capacity = 60 } = options;

  const [isAvailable, setIsAvailable] = useState<boolean>(true);
  const [permissionState, setPermissionState] = useState<PermissionState>(
    requiresPermission ? 'undetermined' : 'notRequired',
  );
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [latest, setLatest] = useState<TSample | null>(null);

  const bufferRef = useRef<RingBuffer<TSample>>(createRingBuffer<TSample>(capacity));
  const subscriptionRef = useRef<SensorSubscription | null>(null);
  const snapshotListenersRef = useRef<Set<() => void>>(new Set());
  const rateRef = useRef<SampleRate>(rate);
  const isRunningRef = useRef<boolean>(false);
  const permissionRef = useRef<PermissionState>(permissionState);
  const isAvailableRef = useRef<boolean>(true);
  const sensorRef = useRef<SensorClassLike>(sensor);
  const mapSampleRef = useRef<typeof mapSample>(mapSample);

  // Keep refs in sync with latest props.
  useEffect(() => {
    sensorRef.current = sensor;
  }, [sensor]);
  useEffect(() => {
    mapSampleRef.current = mapSample;
  }, [mapSample]);
  useEffect(() => {
    permissionRef.current = permissionState;
  }, [permissionState]);
  useEffect(() => {
    isAvailableRef.current = isAvailable;
  }, [isAvailable]);

  // Mount: probe availability and permission state.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      let available = true;
      try {
        available = await sensor.isAvailableAsync();
      } catch {
        available = false;
      }
      if (cancelled) return;
      setIsAvailable(available);
      isAvailableRef.current = available;

      if (!available) {
        setPermissionState('notRequired');
        permissionRef.current = 'notRequired';
        return;
      }

      if (requiresPermission && sensor.getPermissionsAsync) {
        try {
          const res = await sensor.getPermissionsAsync();
          if (cancelled) return;
          const next = mapStatus(res.status);
          setPermissionState(next);
          permissionRef.current = next;
        } catch {
          if (cancelled) return;
          setPermissionState('undetermined');
          permissionRef.current = 'undetermined';
        }
      } else {
        setPermissionState('notRequired');
        permissionRef.current = 'notRequired';
      }
    })();
    return () => {
      cancelled = true;
    };
    // Intentionally only depend on `sensor` + `requiresPermission` — re-probe if sensor swaps.
  }, [sensor, requiresPermission]);

  // Rate change while running: re-call setUpdateInterval WITHOUT re-adding listener (FR-011).
  useEffect(() => {
    rateRef.current = rate;
    if (isRunningRef.current) {
      try {
        sensorRef.current.setUpdateInterval(RATE_TO_INTERVAL_MS[rate]);
      } catch {
        // Swallow; defensive (FR-035).
      }
    }
  }, [rate]);

  const notifyListeners = useCallback(() => {
    snapshotListenersRef.current.forEach((l) => {
      try {
        l();
      } catch {
        // Listener errors are isolated.
      }
    });
  }, []);

  const attachListener = useCallback(() => {
    if (subscriptionRef.current) return;
    try {
      sensorRef.current.setUpdateInterval(RATE_TO_INTERVAL_MS[rateRef.current]);
    } catch {
      // continue — addListener may still work
    }
    try {
      const sub = sensorRef.current.addListener((raw: unknown) => {
        try {
          const sample = mapSampleRef.current(raw);
          bufferRef.current.push(sample);
          setLatest(sample);
          notifyListeners();
        } catch (err) {
          // FR-035: don't re-throw from the handler.
          console.warn('[useSensorStream] sample handler threw', err);
        }
      });
      subscriptionRef.current = sub;
      isRunningRef.current = true;
      setIsRunning(true);
    } catch (err) {
      console.warn('[useSensorStream] addListener threw', err);
    }
  }, [notifyListeners]);

  const stop = useCallback(() => {
    if (subscriptionRef.current) {
      try {
        subscriptionRef.current.remove();
      } catch {
        // ignore
      }
      subscriptionRef.current = null;
    }
    isRunningRef.current = false;
    setIsRunning(false);
  }, []);

  const requestPermission = useCallback(async (): Promise<PermissionState> => {
    if (!requiresPermission || !sensorRef.current.requestPermissionsAsync) {
      setPermissionState('notRequired');
      permissionRef.current = 'notRequired';
      return 'notRequired';
    }
    try {
      const res = await sensorRef.current.requestPermissionsAsync();
      const next = mapStatus(res.status);
      setPermissionState(next);
      permissionRef.current = next;
      return next;
    } catch {
      setPermissionState('undetermined');
      permissionRef.current = 'undetermined';
      return 'undetermined';
    }
  }, [requiresPermission]);

  const start = useCallback(async (): Promise<void> => {
    if (!isAvailableRef.current) return;
    if (requiresPermission) {
      let perm = permissionRef.current;
      if (perm === 'undetermined') {
        perm = await requestPermission();
      }
      if (perm !== 'granted' && perm !== 'notRequired') return;
    }
    attachListener();
  }, [attachListener, requestPermission, requiresPermission]);

  const snapshot = useCallback((n: number): readonly TSample[] => {
    return bufferRef.current.snapshot(n);
  }, []);

  const subscribeToSnapshot = useCallback((listener: () => void): (() => void) => {
    snapshotListenersRef.current.add(listener);
    return () => {
      snapshotListenersRef.current.delete(listener);
    };
  }, []);

  // Unmount cleanup — FR-036, SC-007.
  useEffect(() => {
    const subRef = subscriptionRef;
    const listenersRef = snapshotListenersRef;
    return () => {
      if (subRef.current) {
        try {
          subRef.current.remove();
        } catch {
          // ignore
        }
        subRef.current = null;
      }
      listenersRef.current.clear();
    };
  }, []);

  return {
    isAvailable,
    permissionState,
    isRunning,
    latest,
    snapshot,
    subscribeToSnapshot,
    start,
    stop,
    requestPermission,
  };
}
