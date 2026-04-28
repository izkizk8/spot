/**
 * useFrameAnalyzer hook tests (feature 017, User Story 1).
 */

import { renderHook, act } from '@testing-library/react-native';
import { useFrameAnalyzer } from '@/modules/camera-vision/hooks/useFrameAnalyzer';
import type { VisionBridge } from '@/native/vision-detector.types';
import { VisionAnalysisFailed } from '@/native/vision-detector.types';

describe('useFrameAnalyzer', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  const mockCameraRef = {
    current: {
      takePictureAsync: jest.fn(() =>
        Promise.resolve({
          base64: 'mock-base64-data',
          uri: 'file:///mock.jpg',
          width: 1920,
          height: 1080,
        }),
      ),
    } as any,
  };

  const mockBridge: VisionBridge = {
    isAvailable: jest.fn(() => true),
    analyze: jest.fn(() =>
      Promise.resolve({
        observations: [
          {
            kind: 'face',
            boundingBox: { x: 0.1, y: 0.2, width: 0.3, height: 0.4 },
          },
        ],
        analysisMs: 50,
        imageWidth: 1920,
        imageHeight: 1080,
      }),
    ),
  };

  it('triggers takePictureAsync within intervalMs when mode is faces', async () => {
    const { unmount } = renderHook(() =>
      useFrameAnalyzer({
        mode: 'faces',
        intervalMs: 250,
        cameraRef: mockCameraRef,
        bridgeOverride: mockBridge,
      }),
    );

    expect(mockCameraRef.current.takePictureAsync).not.toHaveBeenCalled();

    // Advance by 250ms
    act(() => {
      jest.advanceTimersByTime(250);
    });

    // Wait for the async operations
    await act(async () => {
      await Promise.resolve();
    });

    expect(mockCameraRef.current.takePictureAsync).toHaveBeenCalled();
    unmount();
  });

  it('calls bridge.analyze with the correct mode and payload', async () => {
    const { unmount } = renderHook(() =>
      useFrameAnalyzer({
        mode: 'faces',
        intervalMs: 250,
        cameraRef: mockCameraRef,
        bridgeOverride: mockBridge,
      }),
    );

    act(() => {
      jest.advanceTimersByTime(250);
    });

    await act(async () => {
      await Promise.resolve();
    });

    expect(mockBridge.analyze).toHaveBeenCalledWith('faces', { base64: 'mock-base64-data' });
    unmount();
  });

  it('updates observations, detected, lastAnalysisMs, fps on resolve', async () => {
    const { result, unmount } = renderHook(() =>
      useFrameAnalyzer({
        mode: 'faces',
        intervalMs: 250,
        cameraRef: mockCameraRef,
        bridgeOverride: mockBridge,
      }),
    );

    act(() => {
      jest.advanceTimersByTime(250);
    });

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.observations).toHaveLength(1);
    expect(result.current.detected).toBe(1);
    expect(result.current.lastAnalysisMs).toBe(50);
    expect(result.current.fps).toBeGreaterThan(0);
    unmount();
  });

  it('triggers no takePictureAsync calls when mode is off', async () => {
    const { unmount } = renderHook(() =>
      useFrameAnalyzer({
        mode: 'off',
        intervalMs: 250,
        cameraRef: mockCameraRef,
        bridgeOverride: mockBridge,
      }),
    );

    act(() => {
      jest.advanceTimersByTime(500);
    });

    await act(async () => {
      await Promise.resolve();
    });

    expect(mockCameraRef.current.takePictureAsync).not.toHaveBeenCalled();
    unmount();
  });

  it('clears observations and detected when switching to off', async () => {
    const { result, rerender, unmount } = renderHook(
      (props: { mode: 'faces' | 'off' }) =>
        useFrameAnalyzer({
          mode: props.mode,
          intervalMs: 250,
          cameraRef: mockCameraRef,
          bridgeOverride: mockBridge,
        }),
      { initialProps: { mode: 'faces' as const } },
    );

    act(() => {
      jest.advanceTimersByTime(250);
    });

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.observations.length).toBeGreaterThan(0);

    rerender({ mode: 'off' as const });

    expect(result.current.observations).toEqual([]);
    expect(result.current.detected).toBe(0);
    unmount();
  });

  it('retains fps and lastAnalysisMs when switching to off', async () => {
    const { result, rerender, unmount } = renderHook(
      (props: { mode: 'faces' | 'off' }) =>
        useFrameAnalyzer({
          mode: props.mode,
          intervalMs: 250,
          cameraRef: mockCameraRef,
          bridgeOverride: mockBridge,
        }),
      { initialProps: { mode: 'faces' as const } },
    );

    act(() => {
      jest.advanceTimersByTime(250);
    });

    await act(async () => {
      await Promise.resolve();
    });

    const fpsBefore = result.current.fps;
    const lastAnalysisMsBefore = result.current.lastAnalysisMs;

    rerender({ mode: 'off' as const });

    expect(result.current.fps).toBe(fpsBefore);
    expect(result.current.lastAnalysisMs).toBe(lastAnalysisMsBefore);
    unmount();
  });

  it('discards in-flight results when mode changes mid-cycle', async () => {
    let resolveAnalyze: any;
    const slowBridge: VisionBridge = {
      isAvailable: jest.fn(() => true),
      analyze: jest.fn(
        () =>
          new Promise((resolve) => {
            resolveAnalyze = resolve;
          }),
      ),
    };

    const { result, rerender, unmount } = renderHook(
      (props: { mode: 'faces' | 'text' }) =>
        useFrameAnalyzer({
          mode: props.mode,
          intervalMs: 250,
          cameraRef: mockCameraRef,
          bridgeOverride: slowBridge,
        }),
      { initialProps: { mode: 'faces' as const } },
    );

    act(() => {
      jest.advanceTimersByTime(250);
    });

    await act(async () => {
      await Promise.resolve();
    });

    // Mode change while analyze is in flight
    rerender({ mode: 'text' as const });

    // Resolve the old analyze call
    await act(async () => {
      resolveAnalyze({
        observations: [{ kind: 'face', boundingBox: { x: 0, y: 0, width: 1, height: 1 } }],
        analysisMs: 50,
        imageWidth: 1920,
        imageHeight: 1080,
      });
      await Promise.resolve();
    });

    // Result should be discarded, observations should remain empty
    expect(result.current.observations).toEqual([]);
    unmount();
  });

  it('skips overlapping analyze calls when previous is still in flight', async () => {
    let resolveAnalyze: any;
    const slowBridge: VisionBridge = {
      isAvailable: jest.fn(() => true),
      analyze: jest.fn(
        () =>
          new Promise((resolve) => {
            resolveAnalyze = resolve;
          }),
      ),
    };

    const { unmount } = renderHook(() =>
      useFrameAnalyzer({
        mode: 'faces',
        intervalMs: 250,
        cameraRef: mockCameraRef,
        bridgeOverride: slowBridge,
      }),
    );

    // First tick
    act(() => {
      jest.advanceTimersByTime(250);
    });

    await act(async () => {
      await Promise.resolve();
    });

    expect(slowBridge.analyze).toHaveBeenCalledTimes(1);

    // Second tick while first is still in flight
    act(() => {
      jest.advanceTimersByTime(250);
    });

    await act(async () => {
      await Promise.resolve();
    });

    // Should still be 1, overlap-skip
    expect(slowBridge.analyze).toHaveBeenCalledTimes(1);

    // Resolve the first call
    await act(async () => {
      resolveAnalyze({
        observations: [],
        analysisMs: 50,
        imageWidth: 1920,
        imageHeight: 1080,
      });
      await Promise.resolve();
    });

    unmount();
  });

  it('uses custom intervalMs', async () => {
    const { unmount } = renderHook(() =>
      useFrameAnalyzer({
        mode: 'faces',
        intervalMs: 500,
        cameraRef: mockCameraRef,
        bridgeOverride: mockBridge,
      }),
    );

    act(() => {
      jest.advanceTimersByTime(250);
    });

    await act(async () => {
      await Promise.resolve();
    });

    expect(mockCameraRef.current.takePictureAsync).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(250);
    });

    await act(async () => {
      await Promise.resolve();
    });

    expect(mockCameraRef.current.takePictureAsync).toHaveBeenCalled();
    unmount();
  });

  it('fully tears down on unmount with no setState warnings', async () => {
    const { unmount } = renderHook(() =>
      useFrameAnalyzer({
        mode: 'faces',
        intervalMs: 250,
        cameraRef: mockCameraRef,
        bridgeOverride: mockBridge,
      }),
    );

    act(() => {
      jest.advanceTimersByTime(250);
    });

    await act(async () => {
      await Promise.resolve();
    });

    unmount();

    // Advance timers to verify no more calls happen
    act(() => {
      jest.advanceTimersByTime(500);
    });

    // takePictureAsync should only have been called once before unmount
    expect(mockCameraRef.current.takePictureAsync).toHaveBeenCalledTimes(1);
  });

  it('skips analysis when permission denied (null cameraRef)', async () => {
    const { unmount } = renderHook(() =>
      useFrameAnalyzer({
        mode: 'faces',
        intervalMs: 250,
        cameraRef: { current: null },
        bridgeOverride: mockBridge,
      }),
    );

    act(() => {
      jest.advanceTimersByTime(500);
    });

    await act(async () => {
      await Promise.resolve();
    });

    expect(mockCameraRef.current.takePictureAsync).not.toHaveBeenCalled();
    unmount();
  });

  it('populates error when analyze rejects with VisionAnalysisFailed', async () => {
    const errorBridge: VisionBridge = {
      isAvailable: jest.fn(() => true),
      analyze: jest.fn(() => Promise.reject(new VisionAnalysisFailed('Test error'))),
    };

    const { result, unmount } = renderHook(() =>
      useFrameAnalyzer({
        mode: 'faces',
        intervalMs: 250,
        cameraRef: mockCameraRef,
        bridgeOverride: errorBridge,
      }),
    );

    act(() => {
      jest.advanceTimersByTime(250);
    });

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.error).toBeTruthy();
    expect(result.current.error?.message).toContain('Test error');
    unmount();
  });

  it('clears error on next successful cycle', async () => {
    let shouldError = true;
    const toggleBridge: VisionBridge = {
      isAvailable: jest.fn(() => true),
      analyze: jest.fn(() => {
        if (shouldError) {
          return Promise.reject(new VisionAnalysisFailed('Test error'));
        }
        return Promise.resolve({
          observations: [],
          analysisMs: 50,
          imageWidth: 1920,
          imageHeight: 1080,
        });
      }),
    };

    const { result, unmount } = renderHook(() =>
      useFrameAnalyzer({
        mode: 'faces',
        intervalMs: 250,
        cameraRef: mockCameraRef,
        bridgeOverride: toggleBridge,
      }),
    );

    // First cycle errors
    act(() => {
      jest.advanceTimersByTime(250);
    });

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.error).toBeTruthy();

    // Second cycle succeeds
    shouldError = false;
    act(() => {
      jest.advanceTimersByTime(250);
    });

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.error).toBeNull();
    unmount();
  });
});
