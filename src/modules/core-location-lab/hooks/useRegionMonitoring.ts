/**
 * useRegionMonitoring hook (feature 025).
 *
 * iOS-only hook for managing geofenced regions. On non-iOS platforms,
 * returns a no-op shape with empty arrays and methods that throw.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import * as Location from 'expo-location';

import { GEOFENCE_TASK_NAME } from '../geofence-task';
import { subscribeGeofenceEvents } from '../event-store';
import type { MonitoredRegion, RegionEvent, RegionRadiusMeters } from '../types';

export interface UseRegionMonitoring {
  regions: readonly MonitoredRegion[];
  events: readonly RegionEvent[];
  addRegion: (args: {
    latitude: number;
    longitude: number;
    radius: RegionRadiusMeters;
  }) => Promise<void>;
  removeRegion: (id: string) => Promise<void>;
  error: Error | null;
}

// No-op implementation for non-iOS platforms
const noopImplementation: UseRegionMonitoring = {
  regions: [],
  events: [],
  addRegion: async () => {
    throw new Error('Region monitoring is iOS-only');
  },
  removeRegion: async () => {
    throw new Error('Region monitoring is iOS-only');
  },
  error: null,
};

let regionIdCounter = 0;

export function useRegionMonitoring(): UseRegionMonitoring {
  // Early return for non-iOS platforms
  if (Platform.OS !== 'ios') {
    return noopImplementation;
  }

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [regions, setRegions] = useState<MonitoredRegion[]>([]);
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [events, setEvents] = useState<RegionEvent[]>([]);
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [error, setError] = useState<Error | null>(null);
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const mountedRef = useRef(true);
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const regionsRef = useRef<MonitoredRegion[]>([]);

  // Keep ref in sync (in effect, not during render)
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    regionsRef.current = regions;
  }, [regions]);

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const syncGeofencing = useCallback(async (newRegions: MonitoredRegion[]) => {
    if (newRegions.length === 0) {
      await Location.stopGeofencingAsync(GEOFENCE_TASK_NAME);
      return;
    }

    const expoRegions = newRegions.map((r) => ({
      identifier: r.id,
      latitude: r.latitude,
      longitude: r.longitude,
      radius: r.radius,
      notifyOnEnter: true,
      notifyOnExit: true,
    }));

    await Location.startGeofencingAsync(GEOFENCE_TASK_NAME, expoRegions);
  }, []);

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const addRegion = useCallback(
    async (args: { latitude: number; longitude: number; radius: RegionRadiusMeters }) => {
      const newRegion: MonitoredRegion = {
        id: `region-${Date.now()}-${++regionIdCounter}`,
        latitude: args.latitude,
        longitude: args.longitude,
        radius: args.radius,
        state: 'unknown',
      };

      // Optimistic update
      const optimisticRegions = [...regionsRef.current, newRegion];
      setRegions(optimisticRegions);
      regionsRef.current = optimisticRegions;

      try {
        await syncGeofencing(optimisticRegions);
        if (mountedRef.current) {
          setError(null);
        }
      } catch (err) {
        // Rollback on error
        if (mountedRef.current) {
          const rollbackRegions = regionsRef.current.filter((r) => r.id !== newRegion.id);
          setRegions(rollbackRegions);
          regionsRef.current = rollbackRegions;
          setError(err instanceof Error ? err : new Error(String(err)));
        }
      }
    },
    [syncGeofencing],
  );

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const removeRegion = useCallback(
    async (id: string) => {
      const newRegions = regionsRef.current.filter((r) => r.id !== id);
      setRegions(newRegions);
      regionsRef.current = newRegions;

      try {
        await syncGeofencing(newRegions);
        if (mountedRef.current) {
          setError(null);
        }
      } catch (err) {
        if (mountedRef.current) {
          setError(err instanceof Error ? err : new Error(String(err)));
        }
      }
    },
    [syncGeofencing],
  );

  // Subscribe to geofence events
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    mountedRef.current = true;

    const unsubscribe = subscribeGeofenceEvents((storeEvents) => {
      if (!mountedRef.current) return;

      // Update events list
      setEvents([...storeEvents].toReversed()); // newest first

      // Update region states based on latest events
      setRegions((currentRegions) => {
        return currentRegions.map((region) => {
          // Find the most recent event for this region
          const latestEvent = storeEvents
            .filter((e) => e.regionId === region.id)
            .toSorted((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0];

          if (!latestEvent) return region;

          const newState = latestEvent.type === 'enter' ? 'inside' : 'outside';
          if (region.state !== newState) {
            return { ...region, state: newState };
          }
          return region;
        });
      });
    });

    return () => {
      mountedRef.current = false;
      unsubscribe();
    };
  }, []);

  return {
    regions,
    events,
    addRegion,
    removeRegion,
    error,
  };
}
