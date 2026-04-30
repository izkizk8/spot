/**
 * useCoreImageFilters Hook Test
 * Feature: 064-core-image
 *
 * Exercises capabilities refresh, filter selection, param updates,
 * apply-filter, and error paths via the test bridge seam.
 */
import { renderHook, act } from '@testing-library/react-native';
import { describe, expect, it, beforeEach, afterEach, jest } from '@jest/globals';

import {
  __setCoreImageBridgeForTests,
  useCoreImageFilters,
} from '@/modules/064-core-image/hooks/useCoreImageFilters';
import type {
  CICapabilities,
  CoreImageBridge,
  FilterId,
  FilterParams,
  FilterResult,
} from '@/native/core-image.types';

const fakeCaps: CICapabilities = {
  available: true,
  filterCount: 212,
  supportedFilters: ['sepia', 'blur', 'vignette', 'color-invert', 'noir', 'sharpen'],
};

const fakeResult = (filterId: FilterId): FilterResult => ({
  outputUri: `data:image/jpeg;base64,FAKE_${filterId}`,
  filterId,
  processingTimeMs: 42,
});

function makeBridge(overrides: Partial<CoreImageBridge> = {}): CoreImageBridge {
  return {
    getCapabilities: jest.fn(async (): Promise<CICapabilities> => fakeCaps),
    applyFilter: jest.fn(
      async (filterId: FilterId, _params: FilterParams): Promise<FilterResult> =>
        fakeResult(filterId),
    ),
    ...overrides,
  };
}

describe('useCoreImageFilters', () => {
  let bridge: CoreImageBridge;

  beforeEach(() => {
    bridge = makeBridge();
    __setCoreImageBridgeForTests(bridge);
  });

  afterEach(() => {
    __setCoreImageBridgeForTests(null);
  });

  it('starts with default state', () => {
    const { result } = renderHook(() => useCoreImageFilters());
    expect(result.current.capabilities).toBeNull();
    expect(result.current.selectedFilterId).toBe('sepia');
    expect(result.current.result).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.lastError).toBeNull();
  });

  it('refreshCapabilities sets capabilities', async () => {
    const { result } = renderHook(() => useCoreImageFilters());

    await act(async () => {
      await result.current.refreshCapabilities();
    });

    expect(result.current.capabilities).toEqual(fakeCaps);
    expect(result.current.loading).toBe(false);
    expect(bridge.getCapabilities).toHaveBeenCalledTimes(1);
  });

  it('selectFilter updates selectedFilterId and resets params and result', async () => {
    const { result } = renderHook(() => useCoreImageFilters());

    await act(async () => {
      await result.current.applyFilter();
    });

    act(() => {
      result.current.selectFilter('blur');
    });

    expect(result.current.selectedFilterId).toBe('blur');
    expect(result.current.result).toBeNull();
    // blur default radius is 5
    expect(result.current.params['radius']).toBe(5);
  });

  it('setParam updates a single param value', () => {
    const { result } = renderHook(() => useCoreImageFilters());

    act(() => {
      result.current.setParam('intensity', 0.3);
    });

    expect(result.current.params['intensity']).toBe(0.3);
  });

  it('applyFilter calls bridge.applyFilter and stores result', async () => {
    const { result } = renderHook(() => useCoreImageFilters());

    await act(async () => {
      await result.current.applyFilter();
    });

    expect(result.current.result).toEqual(fakeResult('sepia'));
    expect(result.current.loading).toBe(false);
    expect(bridge.applyFilter).toHaveBeenCalledWith('sepia', expect.any(Object));
  });

  it('passes current params to bridge.applyFilter', async () => {
    const { result } = renderHook(() => useCoreImageFilters());

    act(() => {
      result.current.setParam('intensity', 0.2);
    });

    await act(async () => {
      await result.current.applyFilter();
    });

    expect(bridge.applyFilter).toHaveBeenCalledWith(
      'sepia',
      expect.objectContaining({ intensity: 0.2 }),
    );
  });

  it('refreshCapabilities stores error on rejection', async () => {
    const error = new Error('CIContext unavailable');
    __setCoreImageBridgeForTests(
      makeBridge({ getCapabilities: jest.fn(async () => Promise.reject(error)) }),
    );

    const { result } = renderHook(() => useCoreImageFilters());
    await act(async () => {
      await result.current.refreshCapabilities();
    });

    expect(result.current.capabilities).toBeNull();
    expect(result.current.lastError).toBe(error);
  });

  it('applyFilter stores error on rejection', async () => {
    const error = new Error('filter failed');
    __setCoreImageBridgeForTests(
      makeBridge({ applyFilter: jest.fn(async () => Promise.reject(error)) }),
    );

    const { result } = renderHook(() => useCoreImageFilters());
    await act(async () => {
      await result.current.applyFilter();
    });

    expect(result.current.result).toBeNull();
    expect(result.current.lastError).toBe(error);
  });

  it('selectFilter changes default params for each filter', () => {
    const { result } = renderHook(() => useCoreImageFilters());

    act(() => {
      result.current.selectFilter('vignette');
    });
    expect(result.current.params['radius']).toBeDefined();
    expect(result.current.params['intensity']).toBeDefined();

    act(() => {
      result.current.selectFilter('color-invert');
    });
    expect(result.current.params).toEqual({});

    act(() => {
      result.current.selectFilter('noir');
    });
    expect(result.current.params).toEqual({});

    act(() => {
      result.current.selectFilter('sharpen');
    });
    expect(result.current.params['sharpness']).toBeDefined();
  });
});
