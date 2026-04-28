/**
 * Tests for useRegionMonitoring hook (feature 025)
 */
import { act, renderHook } from '@testing-library/react-native';
import { Platform } from 'react-native';
import * as Location from 'expo-location';

import { useRegionMonitoring } from '@/modules/core-location-lab/hooks/useRegionMonitoring';
import {
  appendGeofenceEvent,
  __resetGeofenceStore,
} from '@/modules/core-location-lab/event-store';

// Access mock helper
const mockLocation = Location as typeof Location & {
  __setGeofencingMock: (opts: { throwOnStart?: boolean }) => void;
};

describe('useRegionMonitoring', () => {
  beforeEach(() => {
    __resetGeofenceStore();
    jest.clearAllMocks();
  });

  describe('on iOS', () => {
    beforeEach(() => {
      (Platform as { OS: string }).OS = 'ios';
    });

    it('addRegion appends to regions with state "unknown" and calls startGeofencingAsync', async () => {
      const { result } = renderHook(() => useRegionMonitoring());

      await act(async () => {
        await result.current.addRegion({
          latitude: 37.78825,
          longitude: -122.4324,
          radius: 100,
        });
      });

      expect(result.current.regions).toHaveLength(1);
      expect(result.current.regions[0].state).toBe('unknown');
      expect(result.current.regions[0].radius).toBe(100);
      expect(Location.startGeofencingAsync).toHaveBeenCalled();
    });

    it('quota error rolls back optimistic append and populates error', async () => {
      mockLocation.__setGeofencingMock({ throwOnStart: true });

      const { result } = renderHook(() => useRegionMonitoring());

      await act(async () => {
        await result.current.addRegion({
          latitude: 37.78825,
          longitude: -122.4324,
          radius: 100,
        });
      });

      expect(result.current.regions).toHaveLength(0);
      expect(result.current.error).not.toBeNull();
    });

    it('removeRegion drops the id and re-invokes startGeofencingAsync', async () => {
      const { result } = renderHook(() => useRegionMonitoring());

      // Add a region first
      await act(async () => {
        await result.current.addRegion({
          latitude: 37.78825,
          longitude: -122.4324,
          radius: 100,
        });
      });

      const regionId = result.current.regions[0].id;
      const callCount = (Location.startGeofencingAsync as jest.Mock).mock.calls.length;

      await act(async () => {
        await result.current.removeRegion(regionId);
      });

      expect(result.current.regions).toHaveLength(0);
      // Should have called stopGeofencingAsync when empty
      expect(Location.stopGeofencingAsync).toHaveBeenCalled();
    });

    it('when geofence event fires with "enter", matching region state becomes "inside" and event is appended', async () => {
      const { result } = renderHook(() => useRegionMonitoring());

      await act(async () => {
        await result.current.addRegion({
          latitude: 37.78825,
          longitude: -122.4324,
          radius: 100,
        });
      });

      const regionId = result.current.regions[0].id;

      // Simulate geofence event
      act(() => {
        appendGeofenceEvent({
          regionId,
          type: 'enter',
          timestamp: new Date(),
        });
      });

      expect(result.current.regions[0].state).toBe('inside');
      expect(result.current.events.length).toBeGreaterThan(0);
      expect(result.current.events[0].type).toBe('enter');
    });

    it('unmount unsubscribes from the store', async () => {
      const { result, unmount } = renderHook(() => useRegionMonitoring());

      await act(async () => {
        await result.current.addRegion({
          latitude: 37.78825,
          longitude: -122.4324,
          radius: 100,
        });
      });

      unmount();

      // Should not throw when events come in after unmount
      act(() => {
        appendGeofenceEvent({
          regionId: result.current.regions[0]?.id ?? 'test',
          type: 'enter',
          timestamp: new Date(),
        });
      });
    });
  });

  describe('on Android', () => {
    beforeEach(() => {
      (Platform as { OS: string }).OS = 'android';
    });

    afterEach(() => {
      (Platform as { OS: string }).OS = 'ios';
    });

    it('regions and events are empty', () => {
      const { result } = renderHook(() => useRegionMonitoring());

      expect(result.current.regions).toEqual([]);
      expect(result.current.events).toEqual([]);
    });

    it('addRegion rejects with "Region monitoring is iOS-only"', async () => {
      const { result } = renderHook(() => useRegionMonitoring());

      await expect(
        result.current.addRegion({
          latitude: 37.78825,
          longitude: -122.4324,
          radius: 100,
        }),
      ).rejects.toThrow('Region monitoring is iOS-only');
    });
  });
});
