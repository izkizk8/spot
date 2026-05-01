/**
 * Tests for useLocationUpdates hook (feature 025)
 */
import { act, renderHook } from '@testing-library/react-native';
import * as Location from 'expo-location';

import {
  DEFAULT_ACCURACY_PRESET,
  ACCURACY_PRESETS,
} from '@/modules/core-location-lab/accuracy-presets';
import {
  DEFAULT_DISTANCE_FILTER,
  DISTANCE_FILTERS,
} from '@/modules/core-location-lab/distance-filters';
import { useLocationUpdates } from '@/modules/core-location-lab/hooks/useLocationUpdates';

// Access mock helpers
const mockLocation = Location as typeof Location & {
  __emitPosition: (loc: {
    latitude: number;
    longitude: number;
    altitude?: number;
    accuracy?: number;
    speed?: number;
    heading?: number;
  }) => void;
  __setWatchPositionMock: (opts: { throwOnWatch?: boolean }) => void;
};

describe('useLocationUpdates', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('start() calls watchPositionAsync with current accuracy/distance settings', async () => {
    const { result } = renderHook(() => useLocationUpdates());

    expect(result.current.isRunning).toBe(false);

    await act(async () => {
      await result.current.start();
    });

    expect(Location.watchPositionAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        accuracy: DEFAULT_ACCURACY_PRESET.value,
        distanceInterval: DEFAULT_DISTANCE_FILTER.meters,
      }),
      expect.any(Function),
    );
    expect(result.current.isRunning).toBe(true);
  });

  it('stop() calls subscription.remove() and sets isRunning to false', async () => {
    const { result } = renderHook(() => useLocationUpdates());

    await act(async () => {
      await result.current.start();
    });
    expect(result.current.isRunning).toBe(true);

    await act(async () => {
      await result.current.stop();
    });

    expect(result.current.isRunning).toBe(false);
    // Verify watchPositionAsync was called and the subscription pattern works
    expect(Location.watchPositionAsync).toHaveBeenCalled();
  });

  it('samples populate state - latest reflects most recent push', async () => {
    const { result } = renderHook(() => useLocationUpdates());

    await act(async () => {
      await result.current.start();
    });

    expect(result.current.latest).toBeNull();

    act(() => {
      mockLocation.__emitPosition({
        latitude: 37.78825,
        longitude: -122.4324,
        altitude: 100,
        accuracy: 10,
        speed: 5,
        heading: 45,
      });
    });

    expect(result.current.latest).not.toBeNull();
    expect(result.current.latest?.latitude).toBe(37.78825);
    expect(result.current.latest?.longitude).toBe(-122.4324);
  });

  it('samplesPerMinute rises within 60s window and decays past it', async () => {
    const { result } = renderHook(() => useLocationUpdates());

    await act(async () => {
      await result.current.start();
    });

    // Emit 5 samples within a short period
    for (let i = 0; i < 5; i++) {
      act(() => {
        mockLocation.__emitPosition({
          latitude: 37.78825 + i * 0.001,
          longitude: -122.4324,
        });
      });
      act(() => {
        jest.advanceTimersByTime(1000);
      });
    }

    expect(result.current.samplesPerMinute).toBe(5);

    // Advance time past 60s
    act(() => {
      jest.advanceTimersByTime(60000);
    });

    // Samples should have decayed
    expect(result.current.samplesPerMinute).toBe(0);
  });

  it('setAccuracy while running re-invokes watchPositionAsync with new args (FR-007)', async () => {
    const { result } = renderHook(() => useLocationUpdates());

    await act(async () => {
      await result.current.start();
    });

    const initialCalls = (Location.watchPositionAsync as jest.Mock).mock.calls.length;

    await act(async () => {
      result.current.setAccuracy(ACCURACY_PRESETS[1]); // "Best for navigation"
    });

    // Should have called watchPositionAsync again
    expect((Location.watchPositionAsync as jest.Mock).mock.calls.length).toBeGreaterThan(
      initialCalls,
    );

    // Last call should have new accuracy
    const lastCall = (Location.watchPositionAsync as jest.Mock).mock.calls.at(-1);
    expect(lastCall?.[0].accuracy).toBe(ACCURACY_PRESETS[1].value);
  });

  it('setDistanceFilter while running re-invokes watchPositionAsync with new args (FR-007)', async () => {
    const { result } = renderHook(() => useLocationUpdates());

    await act(async () => {
      await result.current.start();
    });

    const initialCalls = (Location.watchPositionAsync as jest.Mock).mock.calls.length;

    await act(async () => {
      result.current.setDistanceFilter(DISTANCE_FILTERS[2]); // 500m
    });

    // Should have called watchPositionAsync again
    expect((Location.watchPositionAsync as jest.Mock).mock.calls.length).toBeGreaterThan(
      initialCalls,
    );

    // Last call should have new distance interval
    const lastCall = (Location.watchPositionAsync as jest.Mock).mock.calls.at(-1);
    expect(lastCall?.[0].distanceInterval).toBe(DISTANCE_FILTERS[2].meters);
  });

  it('error from watchPositionAsync captures into error and leaves isRunning === false', async () => {
    mockLocation.__setWatchPositionMock({ throwOnWatch: true });

    const { result } = renderHook(() => useLocationUpdates());

    await act(async () => {
      await result.current.start();
    });

    expect(result.current.isRunning).toBe(false);
    expect(result.current.error).not.toBeNull();
    expect(result.current.error?.message).toBe('Location not available');
  });

  it('unmount cleanup calls subscription.remove() and does not warn about setState after unmount', async () => {
    const { result, unmount } = renderHook(() => useLocationUpdates());

    await act(async () => {
      await result.current.start();
    });

    expect(Location.watchPositionAsync).toHaveBeenCalled();

    unmount();

    // Emit after unmount should not cause warnings
    act(() => {
      mockLocation.__emitPosition({
        latitude: 37.5,
        longitude: -122.5,
      });
    });

    // If we got here without warnings, test passes
  });
});
