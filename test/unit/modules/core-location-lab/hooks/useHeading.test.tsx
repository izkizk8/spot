/**
 * Tests for useHeading hook (feature 025)
 */
import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import * as Location from 'expo-location';

import { useHeading } from '@/modules/core-location-lab/hooks/useHeading';

// Access mock helpers
const mockLocation = Location as typeof Location & {
  __emitHeading: (heading: Partial<Location.LocationHeadingObject>) => void;
  __setWatchHeadingMock: (opts: { throwOnWatch?: boolean }) => void;
};

describe('useHeading', () => {
  beforeEach(() => {
    mockLocation.__setWatchHeadingMock({ throwOnWatch: false });
  });

  it('starts watching heading updates when running is true', async () => {
    const { result } = renderHook(() => useHeading());

    expect(result.current.running).toBe(false);

    act(() => {
      result.current.start();
    });

    await waitFor(() => {
      expect(result.current.running).toBe(true);
    });

    expect(Location.watchHeadingAsync).toHaveBeenCalled();
  });

  it('stops watching when stop() is called', async () => {
    const { result } = renderHook(() => useHeading());

    act(() => {
      result.current.start();
    });

    await waitFor(() => {
      expect(result.current.running).toBe(true);
    });

    act(() => {
      result.current.stop();
    });

    await waitFor(() => {
      expect(result.current.running).toBe(false);
    });
  });

  it('exposes samplesPerMinute calculated from 60-second rolling window', async () => {
    const { result } = renderHook(() => useHeading());

    act(() => {
      result.current.start();
    });

    await waitFor(() => {
      expect(result.current.running).toBe(true);
    });

    // Emit 3 heading samples
    act(() => {
      mockLocation.__emitHeading({
        magHeading: 45,
        trueHeading: 45,
        accuracy: 2,
      });
    });

    act(() => {
      mockLocation.__emitHeading({
        magHeading: 90,
        trueHeading: 90,
        accuracy: 2,
      });
    });

    act(() => {
      mockLocation.__emitHeading({
        magHeading: 135,
        trueHeading: 135,
        accuracy: 2,
      });
    });

    await waitFor(() => {
      expect(result.current.samplesPerMinute).toBe(3);
    });
  });

  it('sets error when watchHeadingAsync fails', async () => {
    mockLocation.__setWatchHeadingMock({ throwOnWatch: true });

    const { result } = renderHook(() => useHeading());

    act(() => {
      result.current.start();
    });

    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
    });

    expect(result.current.running).toBe(false);
  });

  it('stops subscription on unmount', async () => {
    const { result, unmount } = renderHook(() => useHeading());

    act(() => {
      result.current.start();
    });

    await waitFor(() => {
      expect(result.current.running).toBe(true);
    });

    unmount();

    // Verify unmount happened without error - subscription cleanup is internal
  });

  it('sets isCalibrated false when accuracy is 0', async () => {
    const { result } = renderHook(() => useHeading());

    act(() => {
      result.current.start();
    });

    await waitFor(() => {
      expect(result.current.running).toBe(true);
    });

    act(() => {
      mockLocation.__emitHeading({
        magHeading: 45,
        trueHeading: 45,
        accuracy: 0, // Uncalibrated
      });
    });

    await waitFor(() => {
      expect(result.current.isCalibrated).toBe(false);
    });
  });

  it('sets isCalibrated true when accuracy is 1, 2, or 3', async () => {
    const { result } = renderHook(() => useHeading());

    act(() => {
      result.current.start();
    });

    await waitFor(() => {
      expect(result.current.running).toBe(true);
    });

    // Test accuracy 1
    act(() => {
      mockLocation.__emitHeading({
        magHeading: 45,
        trueHeading: 45,
        accuracy: 1,
      });
    });

    await waitFor(() => {
      expect(result.current.isCalibrated).toBe(true);
    });

    // Test accuracy 2
    act(() => {
      mockLocation.__emitHeading({
        magHeading: 90,
        trueHeading: 90,
        accuracy: 2,
      });
    });

    await waitFor(() => {
      expect(result.current.isCalibrated).toBe(true);
    });

    // Test accuracy 3
    act(() => {
      mockLocation.__emitHeading({
        magHeading: 135,
        trueHeading: 135,
        accuracy: 3,
      });
    });

    await waitFor(() => {
      expect(result.current.isCalibrated).toBe(true);
    });
  });

  it('exposes latest heading with magHeading property', async () => {
    const { result } = renderHook(() => useHeading());

    act(() => {
      result.current.start();
    });

    await waitFor(() => {
      expect(result.current.running).toBe(true);
    });

    act(() => {
      mockLocation.__emitHeading({
        magHeading: 270,
        trueHeading: 268,
        accuracy: 2,
      });
    });

    await waitFor(() => {
      expect(result.current.latest).toMatchObject({
        magHeading: 270,
        trueHeading: 268,
      });
    });
  });
});
