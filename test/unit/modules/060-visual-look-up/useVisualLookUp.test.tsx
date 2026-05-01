/**
 * useVisualLookUp Hook Test
 * Feature: 060-visual-look-up
 *
 * Exercises checkSupport, analyzeImage, clearResult, and error paths.
 */

import { renderHook, act } from '@testing-library/react-native';
import { describe, expect, it, beforeEach, afterEach, jest } from '@jest/globals';

import {
  __setVisualLookUpBridgeForTests,
  useVisualLookUp,
} from '@/modules/visual-look-up-lab/hooks/useVisualLookUp';
import type { AnalysisResult, VisualLookUpBridge } from '@/native/visual-look-up.types';

const sampleResult = (overrides: Partial<AnalysisResult> = {}): AnalysisResult => ({
  supported: true,
  imageUri: 'asset://demo.jpg',
  subjects: [
    {
      id: 's1',
      label: 'Cat',
      confidence: 0.92,
      boundingBox: { x: 0.1, y: 0.1, width: 0.5, height: 0.6 },
    },
  ],
  hasSaliencyMap: false,
  analyzedAt: 1_000_000,
  ...overrides,
});

describe('useVisualLookUp', () => {
  let bridge: VisualLookUpBridge;

  beforeEach(() => {
    bridge = {
      isSupported: jest.fn(async (): Promise<boolean> => true),
      analyzeImage: jest.fn(async (): Promise<AnalysisResult> => sampleResult()),
    };
    __setVisualLookUpBridgeForTests(bridge);
  });

  afterEach(() => {
    __setVisualLookUpBridgeForTests(null);
  });

  it('initial state is idle / null', () => {
    const { result } = renderHook(() => useVisualLookUp());
    expect(result.current.supported).toBeNull();
    expect(result.current.result).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.lastError).toBeNull();
  });

  it('checkSupport sets supported=true', async () => {
    const { result } = renderHook(() => useVisualLookUp());
    await act(async () => {
      await result.current.checkSupport();
    });
    expect(bridge.isSupported).toHaveBeenCalledTimes(1);
    expect(result.current.supported).toBe(true);
  });

  it('checkSupport sets supported=false on bridge error', async () => {
    bridge.isSupported = jest.fn(async () => {
      throw new Error('not-supported');
    });
    __setVisualLookUpBridgeForTests(bridge);
    const { result } = renderHook(() => useVisualLookUp());
    await act(async () => {
      await result.current.checkSupport();
    });
    expect(result.current.supported).toBe(false);
    expect(result.current.lastError?.message).toBe('not-supported');
  });

  it('analyzeImage populates result and supported', async () => {
    const { result } = renderHook(() => useVisualLookUp());
    await act(async () => {
      await result.current.analyzeImage('asset://demo.jpg');
    });
    expect(bridge.analyzeImage).toHaveBeenCalledWith('asset://demo.jpg');
    expect(result.current.result?.subjects).toHaveLength(1);
    expect(result.current.result?.subjects[0]?.label).toBe('Cat');
    expect(result.current.supported).toBe(true);
    expect(result.current.loading).toBe(false);
  });

  it('analyzeImage records error and resets loading', async () => {
    bridge.analyzeImage = jest.fn(async () => {
      throw new Error('analyse-failed');
    });
    __setVisualLookUpBridgeForTests(bridge);
    const { result } = renderHook(() => useVisualLookUp());
    await act(async () => {
      await result.current.analyzeImage('bad://uri');
    });
    expect(result.current.lastError?.message).toBe('analyse-failed');
    expect(result.current.loading).toBe(false);
    expect(result.current.result).toBeNull();
  });

  it('clearResult resets result and lastError', async () => {
    const { result } = renderHook(() => useVisualLookUp());
    await act(async () => {
      await result.current.analyzeImage('asset://demo.jpg');
    });
    expect(result.current.result).not.toBeNull();
    act(() => {
      result.current.clearResult();
    });
    expect(result.current.result).toBeNull();
    expect(result.current.lastError).toBeNull();
  });

  it('analyzeImage reflects empty subjects array', async () => {
    bridge.analyzeImage = jest.fn(
      async (): Promise<AnalysisResult> => sampleResult({ subjects: [] }),
    );
    __setVisualLookUpBridgeForTests(bridge);
    const { result } = renderHook(() => useVisualLookUp());
    await act(async () => {
      await result.current.analyzeImage('asset://empty.jpg');
    });
    expect(result.current.result?.subjects).toHaveLength(0);
  });
});
