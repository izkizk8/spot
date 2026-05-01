/**
 * useRealityKitUsdz Hook
 * Feature: 062-realitykit-usdz
 *
 * State machine for the RealityKit USDZ AR preview lab. Tracks
 * capabilities, the selected model, loading state, and errors.
 * The native bridge is replaceable at the import boundary via
 * `__setRealityKitUsdzBridgeForTests` for unit tests.
 */
import { useCallback, useState } from 'react';

import realityKitUsdzDefault from '@/native/realitykit-usdz';
import type {
  ModelName,
  RKCapabilities,
  RealityKitUsdzBridge,
} from '@/native/realitykit-usdz.types';

let mockBridge: RealityKitUsdzBridge | null = null;

export function __setRealityKitUsdzBridgeForTests(bridge: RealityKitUsdzBridge | null): void {
  mockBridge = bridge;
}

function getBridge(): RealityKitUsdzBridge {
  if (mockBridge) return mockBridge;
  return realityKitUsdzDefault;
}

export interface RealityKitUsdzState {
  capabilities: RKCapabilities | null;
  selectedModel: ModelName;
  loading: boolean;
  lastError: Error | null;
}

export interface RealityKitUsdzActions {
  refreshCapabilities: () => Promise<void>;
  selectModel: (name: ModelName) => void;
  openPreview: () => Promise<void>;
}

export function useRealityKitUsdz(): RealityKitUsdzState & RealityKitUsdzActions {
  const [capabilities, setCapabilities] = useState<RKCapabilities | null>(null);
  const [selectedModel, setSelectedModel] = useState<ModelName>('toy_drummer');
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

  const selectModel = useCallback((name: ModelName) => {
    setSelectedModel(name);
  }, []);

  const openPreview = useCallback(async () => {
    setLoading(true);
    setLastError(null);
    try {
      await getBridge().previewModel(selectedModel);
    } catch (err) {
      setLastError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, [selectedModel]);

  return {
    capabilities,
    selectedModel,
    loading,
    lastError,
    refreshCapabilities,
    selectModel,
    openPreview,
  };
}
