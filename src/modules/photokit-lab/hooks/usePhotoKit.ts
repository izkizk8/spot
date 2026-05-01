/**
 * usePhotoKit Hook
 * Feature: 057-photokit
 *
 * State machine for the PhotoKit lab. Tracks authorization status,
 * the list of picked photo assets, loading state, and last error.
 * The native bridge is replaceable at the import boundary via
 * `__setPhotoKitBridgeForTests` for unit tests.
 */

import { useCallback, useState } from 'react';

import photokitDefault from '@/native/photokit';
import type {
  AuthorizationStatus,
  PhotoAsset,
  PhotoKitBridge,
  PickerConfig,
} from '@/native/photokit.types';

let mockBridge: PhotoKitBridge | null = null;

export function __setPhotoKitBridgeForTests(bridge: PhotoKitBridge | null) {
  mockBridge = bridge;
}

function getBridge(): PhotoKitBridge {
  if (mockBridge) return mockBridge;
  return photokitDefault;
}

export interface PhotoKitState {
  authorizationStatus: AuthorizationStatus | null;
  assets: readonly PhotoAsset[];
  loading: boolean;
  lastError: Error | null;
}

export interface PhotoKitActions {
  checkStatus: () => Promise<void>;
  requestAccess: () => Promise<void>;
  pickPhotos: (config?: PickerConfig) => Promise<void>;
  clearAssets: () => void;
}

export function usePhotoKit(): PhotoKitState & PhotoKitActions {
  const [authorizationStatus, setAuthorizationStatus] = useState<AuthorizationStatus | null>(null);
  const [assets, setAssets] = useState<readonly PhotoAsset[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastError, setLastError] = useState<Error | null>(null);

  const checkStatus = useCallback(async () => {
    setLastError(null);
    try {
      const bridge = getBridge();
      const status = await bridge.getAuthorizationStatus();
      setAuthorizationStatus(status);
    } catch (err) {
      setLastError(err as Error);
    }
  }, []);

  const requestAccess = useCallback(async () => {
    setLastError(null);
    try {
      const bridge = getBridge();
      const status = await bridge.requestAuthorization();
      setAuthorizationStatus(status);
    } catch (err) {
      setLastError(err as Error);
    }
  }, []);

  const pickPhotos = useCallback(async (config?: PickerConfig) => {
    setLoading(true);
    setLastError(null);
    try {
      const bridge = getBridge();
      const picked = await bridge.presentPicker(config);
      setAssets(picked);
    } catch (err) {
      setLastError(err as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearAssets = useCallback(() => {
    setAssets([]);
  }, []);

  return {
    authorizationStatus,
    assets,
    loading,
    lastError,
    checkStatus,
    requestAccess,
    pickPhotos,
    clearAssets,
  };
}
