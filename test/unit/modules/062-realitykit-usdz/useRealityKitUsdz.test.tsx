/**
 * useRealityKitUsdz Hook Test
 * Feature: 062-realitykit-usdz
 *
 * Exercises capabilities refresh, model selection, AR Quick Look preview,
 * and error paths via the test bridge seam.
 */
import { renderHook, act } from '@testing-library/react-native';
import { describe, expect, it, beforeEach, afterEach, jest } from '@jest/globals';

import {
  __setRealityKitUsdzBridgeForTests,
  useRealityKitUsdz,
} from '@/modules/062-realitykit-usdz/hooks/useRealityKitUsdz';
import type {
  ModelName,
  RKCapabilities,
  RealityKitUsdzBridge,
} from '@/native/realitykit-usdz.types';

const fakeCaps: RKCapabilities = {
  arWorldTrackingSupported: true,
  lidarSupported: false,
  arQuickLookSupported: true,
  tier: 'full',
};

function makeBridge(overrides: Partial<RealityKitUsdzBridge> = {}): RealityKitUsdzBridge {
  return {
    getCapabilities: jest.fn(async (): Promise<RKCapabilities> => fakeCaps),
    previewModel: jest.fn(async (_name: ModelName): Promise<void> => undefined),
    ...overrides,
  };
}

describe('useRealityKitUsdz', () => {
  let bridge: RealityKitUsdzBridge;

  beforeEach(() => {
    bridge = makeBridge();
    __setRealityKitUsdzBridgeForTests(bridge);
  });

  afterEach(() => {
    __setRealityKitUsdzBridgeForTests(null);
  });

  it('starts with default state', () => {
    const { result } = renderHook(() => useRealityKitUsdz());
    expect(result.current.capabilities).toBeNull();
    expect(result.current.selectedModel).toBe('toy_drummer');
    expect(result.current.loading).toBe(false);
    expect(result.current.lastError).toBeNull();
  });

  it('refreshCapabilities sets capabilities', async () => {
    const { result } = renderHook(() => useRealityKitUsdz());

    await act(async () => {
      await result.current.refreshCapabilities();
    });

    expect(result.current.capabilities).toEqual(fakeCaps);
    expect(result.current.loading).toBe(false);
    expect(bridge.getCapabilities).toHaveBeenCalledTimes(1);
  });

  it('refreshCapabilities captures errors', async () => {
    const err = new Error('AR not available');
    bridge = makeBridge({
      getCapabilities: jest.fn(async () => {
        throw err;
      }),
    });
    __setRealityKitUsdzBridgeForTests(bridge);

    const { result } = renderHook(() => useRealityKitUsdz());
    await act(async () => {
      await result.current.refreshCapabilities();
    });

    expect(result.current.capabilities).toBeNull();
    expect(result.current.lastError).toBe(err);
  });

  it('selectModel updates selectedModel', () => {
    const { result } = renderHook(() => useRealityKitUsdz());
    act(() => {
      result.current.selectModel('toy_biplane');
    });
    expect(result.current.selectedModel).toBe('toy_biplane');
  });

  it('openPreview calls bridge.previewModel with selectedModel', async () => {
    const { result } = renderHook(() => useRealityKitUsdz());

    act(() => {
      result.current.selectModel('gramophone');
    });

    await act(async () => {
      await result.current.openPreview();
    });

    expect(bridge.previewModel).toHaveBeenCalledWith('gramophone');
    expect(result.current.loading).toBe(false);
    expect(result.current.lastError).toBeNull();
  });

  it('openPreview captures errors', async () => {
    const err = new Error('Preview failed');
    bridge = makeBridge({
      previewModel: jest.fn(async () => {
        throw err;
      }),
    });
    __setRealityKitUsdzBridgeForTests(bridge);

    const { result } = renderHook(() => useRealityKitUsdz());
    await act(async () => {
      await result.current.openPreview();
    });

    expect(result.current.lastError).toBe(err);
    expect(result.current.loading).toBe(false);
  });
});
