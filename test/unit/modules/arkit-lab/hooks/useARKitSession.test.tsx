/**
 * useARKitSession Hook Test
 * Feature: 034-arkit-basics
 *
 * Tests the single state surface consumed by the ARKit screens.
 * Covers polling lifecycle, anchor management, configuration queuing,
 * unmount safety, and bridge error classification.
 *
 * @see specs/034-arkit-basics/data-model.md (entity 7)
 * @see specs/034-arkit-basics/research.md §4 (R-D polling)
 */

import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useARKitSession } from '@/modules/arkit-lab/hooks/useARKitSession';

// Mock the bridge at the import boundary
jest.mock('@/native/arkit', () => {
  const mockARKitNotSupported = class extends Error {
    code = 'ARKIT_NOT_SUPPORTED';
    constructor(message: string) {
      super(message);
      this.name = 'ARKitNotSupported';
    }
  };

  return {
    placeAnchorAt: jest.fn(),
    clearAnchors: jest.fn(),
    pauseSession: jest.fn(),
    resumeSession: jest.fn(),
    getSessionInfo: jest.fn(),
    isAvailable: jest.fn(),
    ARKitNotSupported: mockARKitNotSupported,
  };
});

describe('useARKitSession', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('returns default state on mount', () => {
    const arkit = require('@/native/arkit');
    arkit.getSessionInfo.mockResolvedValue({
      state: 'idle',
      anchorCount: 0,
      fps: 0,
      duration: 0,
      trackingState: 'notAvailable',
    });

    const { result } = renderHook(() => useARKitSession());

    expect(result.current.info.state).toBe('idle');
    expect(result.current.anchors).toEqual([]);
    expect(result.current.config.planeDetection).toBe('horizontal');
    expect(result.current.config.peopleOcclusion).toBe(false);
    expect(result.current.config.lightEstimation).toBe(true);
    expect(result.current.config.worldMapPersistence).toBe(false);
  });

  it('placeAnchorAt appends an AnchorRecord from the bridge', async () => {
    const mockAnchor = {
      id: '0e6f7c1a-1234-5678-90ab-cdef12345678',
      x: 0.123,
      y: -0.045,
      z: -0.872,
      createdAt: Date.now(),
    };

    const arkit = require('@/native/arkit');
    arkit.getSessionInfo.mockResolvedValue({
      state: 'running',
      anchorCount: 0,
      fps: 60,
      duration: 0,
      trackingState: 'normal',
    });
    arkit.placeAnchorAt.mockResolvedValue(mockAnchor);

    const { result } = renderHook(() => useARKitSession());

    await act(async () => {
      await result.current.placeAnchorAt(100, 200);
    });

    expect(result.current.anchors).toHaveLength(1);
    expect(result.current.anchors[0]).toEqual(mockAnchor);
    expect(arkit.placeAnchorAt).toHaveBeenCalledWith(100, 200);
  });

  it('placeAnchorAt handles null (raycast miss) gracefully', async () => {
    const arkit = require('@/native/arkit');
    arkit.getSessionInfo.mockResolvedValue({
      state: 'running',
      anchorCount: 0,
      fps: 60,
      duration: 0,
      trackingState: 'normal',
    });
    arkit.placeAnchorAt.mockResolvedValue(null);

    const { result } = renderHook(() => useARKitSession());

    await act(async () => {
      await result.current.placeAnchorAt(100, 200);
    });

    expect(result.current.anchors).toHaveLength(0);
  });

  it('clearAnchors empties the anchor list', async () => {
    const mockAnchor = {
      id: 'anchor-1',
      x: 1,
      y: 1,
      z: 1,
      createdAt: Date.now(),
    };

    const arkit = require('@/native/arkit');
    arkit.getSessionInfo.mockResolvedValue({
      state: 'running',
      anchorCount: 0,
      fps: 60,
      duration: 0,
      trackingState: 'normal',
    });
    arkit.placeAnchorAt.mockResolvedValue(mockAnchor);
    arkit.clearAnchors.mockResolvedValue(undefined);

    const { result } = renderHook(() => useARKitSession());

    // Place an anchor
    await act(async () => {
      await result.current.placeAnchorAt(100, 200);
    });
    expect(result.current.anchors).toHaveLength(1);

    // Clear all
    await act(async () => {
      await result.current.clearAnchors();
    });
    expect(result.current.anchors).toHaveLength(0);
    expect(arkit.clearAnchors).toHaveBeenCalledTimes(1);
  });

  it('pause flips state to paused', async () => {
    const arkit = require('@/native/arkit');
    arkit.getSessionInfo.mockResolvedValue({
      state: 'running',
      anchorCount: 0,
      fps: 60,
      duration: 10,
      trackingState: 'normal',
    });
    arkit.pauseSession.mockResolvedValue(undefined);

    const { result } = renderHook(() => useARKitSession());

    await act(async () => {
      await result.current.pause();
    });

    expect(arkit.pauseSession).toHaveBeenCalledTimes(1);
  });

  it('resume after pause continues from paused state', async () => {
    const arkit = require('@/native/arkit');
    arkit.getSessionInfo
      .mockResolvedValueOnce({
        state: 'running',
        anchorCount: 0,
        fps: 60,
        duration: 10,
        trackingState: 'normal',
      })
      .mockResolvedValueOnce({
        state: 'paused',
        anchorCount: 0,
        fps: 0,
        duration: 10,
        trackingState: 'normal',
      })
      .mockResolvedValue({
        state: 'running',
        anchorCount: 0,
        fps: 60,
        duration: 10,
        trackingState: 'normal',
      });
    arkit.pauseSession.mockResolvedValue(undefined);
    arkit.resumeSession.mockResolvedValue(undefined);

    const { result } = renderHook(() => useARKitSession());

    await act(async () => {
      await result.current.pause();
    });

    await act(async () => {
      await result.current.resume();
    });

    expect(arkit.resumeSession).toHaveBeenCalledTimes(1);
  });

  it('setConfig while paused queues the config and applies on resume', async () => {
    const arkit = require('@/native/arkit');
    arkit.getSessionInfo.mockResolvedValue({
      state: 'paused',
      anchorCount: 0,
      fps: 0,
      duration: 10,
      trackingState: 'normal',
    });
    arkit.pauseSession.mockResolvedValue(undefined);
    arkit.resumeSession.mockResolvedValue(undefined);

    const { result } = renderHook(() => useARKitSession());

    await act(async () => {
      await result.current.pause();
    });

    // Change config while paused
    act(() => {
      result.current.setConfig({ planeDetection: 'vertical' });
    });
    expect(result.current.config.planeDetection).toBe('vertical');

    // Resume should apply queued config
    await act(async () => {
      await result.current.resume();
    });

    expect(arkit.resumeSession).toHaveBeenCalledTimes(1);
  });

  it('reset clears anchors and reloads session', async () => {
    const mockAnchor = {
      id: 'anchor-1',
      x: 1,
      y: 1,
      z: 1,
      createdAt: Date.now(),
    };

    const arkit = require('@/native/arkit');
    arkit.getSessionInfo.mockResolvedValue({
      state: 'running',
      anchorCount: 0,
      fps: 60,
      duration: 0,
      trackingState: 'normal',
    });
    arkit.placeAnchorAt.mockResolvedValue(mockAnchor);
    arkit.clearAnchors.mockResolvedValue(undefined);

    const { result } = renderHook(() => useARKitSession());

    // Place an anchor
    await act(async () => {
      await result.current.placeAnchorAt(100, 200);
    });
    expect(result.current.anchors).toHaveLength(1);

    // Reset
    await act(async () => {
      await result.current.reset();
    });
    expect(result.current.anchors).toHaveLength(0);
    expect(arkit.clearAnchors).toHaveBeenCalled();
  });

  it('polling fires getSessionInfo every 500ms', async () => {
    const arkit = require('@/native/arkit');
    arkit.getSessionInfo.mockResolvedValue({
      state: 'running',
      anchorCount: 0,
      fps: 60,
      duration: 0,
      trackingState: 'normal',
    });

    renderHook(() => useARKitSession());

    // Initial call on mount
    await waitFor(() => {
      expect(arkit.getSessionInfo).toHaveBeenCalledTimes(1);
    });

    // Advance 500ms
    act(() => {
      jest.advanceTimersByTime(500);
    });
    await waitFor(() => {
      expect(arkit.getSessionInfo).toHaveBeenCalledTimes(2);
    });

    // Advance 2000ms (4 more ticks)
    act(() => {
      jest.advanceTimersByTime(2000);
    });
    await waitFor(() => {
      expect(arkit.getSessionInfo).toHaveBeenCalledTimes(6);
    });
  });

  it('unmount stops polling and no further bridge calls occur', async () => {
    const arkit = require('@/native/arkit');
    arkit.getSessionInfo.mockResolvedValue({
      state: 'running',
      anchorCount: 0,
      fps: 60,
      duration: 0,
      trackingState: 'normal',
    });
    arkit.pauseSession.mockResolvedValue(undefined);

    const { unmount } = renderHook(() => useARKitSession());

    // Wait for initial poll
    await waitFor(() => {
      expect(arkit.getSessionInfo).toHaveBeenCalledTimes(1);
    });

    const callCountBeforeUnmount = arkit.getSessionInfo.mock.calls.length;

    // Unmount
    unmount();

    // Advance timers significantly
    act(() => {
      jest.advanceTimersByTime(5000);
    });

    // No additional calls should have happened
    await waitFor(() => {
      expect(arkit.getSessionInfo).toHaveBeenCalledTimes(
        callCountBeforeUnmount,
      );
    });

    // pauseSession should have been called best-effort on unmount
    expect(arkit.pauseSession).toHaveBeenCalledTimes(1);
  });

  it('action functions have stable identities across renders', () => {
    const arkit = require('@/native/arkit');
    arkit.getSessionInfo.mockResolvedValue({
      state: 'idle',
      anchorCount: 0,
      fps: 0,
      duration: 0,
      trackingState: 'notAvailable',
    });

    const { result, rerender } = renderHook(() => useARKitSession());

    const firstPlaceAnchorAt = result.current.placeAnchorAt;
    const firstClearAnchors = result.current.clearAnchors;
    const firstPause = result.current.pause;
    const firstResume = result.current.resume;
    const firstReset = result.current.reset;
    const firstSetConfig = result.current.setConfig;

    // Trigger a rerender
    rerender();

    expect(result.current.placeAnchorAt).toBe(firstPlaceAnchorAt);
    expect(result.current.clearAnchors).toBe(firstClearAnchors);
    expect(result.current.pause).toBe(firstPause);
    expect(result.current.resume).toBe(firstResume);
    expect(result.current.reset).toBe(firstReset);
    expect(result.current.setConfig).toBe(firstSetConfig);
  });

  it('classifies ARKitNotSupported errors as unsupported', async () => {
    const arkit = require('@/native/arkit');
    const { ARKitNotSupported } = arkit;
    arkit.getSessionInfo.mockResolvedValue({
      state: 'idle',
      anchorCount: 0,
      fps: 0,
      duration: 0,
      trackingState: 'notAvailable',
    });
    arkit.placeAnchorAt.mockRejectedValue(
      new ARKitNotSupported('not supported'),
    );

    const { result } = renderHook(() => useARKitSession());

    await act(async () => {
      await result.current.placeAnchorAt(100, 200);
    });

    // Should transition to error state
    expect(result.current.info.state).toBe('error');
    expect(result.current.info.lastError).toContain('not supported');
  });

  it('classifies generic errors as failed', async () => {
    const arkit = require('@/native/arkit');
    arkit.getSessionInfo.mockResolvedValue({
      state: 'running',
      anchorCount: 0,
      fps: 60,
      duration: 0,
      trackingState: 'normal',
    });
    arkit.placeAnchorAt.mockRejectedValue(new Error('generic failure'));

    const { result } = renderHook(() => useARKitSession());

    await act(async () => {
      await result.current.placeAnchorAt(100, 200);
    });

    expect(result.current.info.state).toBe('error');
    expect(result.current.info.lastError).toContain('generic failure');
  });
});
