/**
 * useCoreImageFilters Hook
 * Feature: 064-core-image
 *
 * State machine for the CoreImage lab. Tracks capabilities, the
 * selected filter, the current parameter values, the last filter
 * result, loading state, and errors. The native bridge is
 * replaceable at the import boundary via
 * `__setCoreImageBridgeForTests` for unit tests.
 */
import { useCallback, useState } from 'react';

import coreImageDefault from '@/native/core-image';
import type {
  CICapabilities,
  CoreImageBridge,
  FilterId,
  FilterParams,
  FilterResult,
} from '@/native/core-image.types';

import { defaultParams, findFilter } from '../filter-types';

let mockBridge: CoreImageBridge | null = null;

export function __setCoreImageBridgeForTests(bridge: CoreImageBridge | null): void {
  mockBridge = bridge;
}

function getBridge(): CoreImageBridge {
  if (mockBridge) return mockBridge;
  return coreImageDefault;
}

export interface CoreImageFiltersState {
  capabilities: CICapabilities | null;
  selectedFilterId: FilterId;
  params: FilterParams;
  result: FilterResult | null;
  loading: boolean;
  lastError: Error | null;
}

export interface CoreImageFiltersActions {
  refreshCapabilities: () => Promise<void>;
  selectFilter: (id: FilterId) => void;
  setParam: (key: string, value: number) => void;
  applyFilter: () => Promise<void>;
}

export function useCoreImageFilters(): CoreImageFiltersState & CoreImageFiltersActions {
  const [capabilities, setCapabilities] = useState<CICapabilities | null>(null);
  const [selectedFilterId, setSelectedFilterId] = useState<FilterId>('sepia');
  const [params, setParams] = useState<FilterParams>(() => {
    const info = findFilter('sepia');
    return info ? defaultParams(info) : {};
  });
  const [result, setResult] = useState<FilterResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastError, setLastError] = useState<Error | null>(null);

  const refreshCapabilities = useCallback(async () => {
    setLoading(true);
    setLastError(null);
    try {
      const caps = await getBridge().getCapabilities();
      setCapabilities(caps);
    } catch (err) {
      setLastError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, []);

  const selectFilter = useCallback((id: FilterId) => {
    setSelectedFilterId(id);
    const info = findFilter(id);
    setParams(info ? defaultParams(info) : {});
    setResult(null);
  }, []);

  const setParam = useCallback((key: string, value: number) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  }, []);

  const applyFilter = useCallback(async () => {
    setLoading(true);
    setLastError(null);
    try {
      const res = await getBridge().applyFilter(selectedFilterId, params);
      setResult(res);
    } catch (err) {
      setLastError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, [selectedFilterId, params]);

  return {
    capabilities,
    selectedFilterId,
    params,
    result,
    loading,
    lastError,
    refreshCapabilities,
    selectFilter,
    setParam,
    applyFilter,
  };
}
