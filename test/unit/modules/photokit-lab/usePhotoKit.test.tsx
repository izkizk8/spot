/**
 * usePhotoKit Hook Test
 * Feature: 057-photokit
 *
 * Exercises authorization, picker, error paths, and clearAssets.
 */

import { renderHook, act } from '@testing-library/react-native';
import { describe, expect, it, beforeEach, afterEach, jest } from '@jest/globals';

import { __setPhotoKitBridgeForTests, usePhotoKit } from '@/modules/photokit-lab/hooks/usePhotoKit';
import type {
  AuthorizationStatus,
  PhotoAsset,
  PhotoKitBridge,
  PickerConfig,
} from '@/native/photokit.types';

const sampleAsset = (id: string, opts: Partial<PhotoAsset> = {}): PhotoAsset => ({
  id,
  uri: `file:///photos/${id}.jpg`,
  width: 1920,
  height: 1080,
  mediaType: 'image',
  filename: `${id}.jpg`,
  creationDate: 1_700_000_000_000,
  ...opts,
});

describe('usePhotoKit', () => {
  let bridge: PhotoKitBridge;

  beforeEach(() => {
    bridge = {
      getAuthorizationStatus: jest.fn(async (): Promise<AuthorizationStatus> => 'notDetermined'),
      requestAuthorization: jest.fn(async (): Promise<AuthorizationStatus> => 'authorized'),
      presentPicker: jest.fn(
        async (_config?: PickerConfig): Promise<readonly PhotoAsset[]> => [
          sampleAsset('a'),
          sampleAsset('b'),
        ],
      ),
    };
    __setPhotoKitBridgeForTests(bridge);
  });

  afterEach(() => {
    __setPhotoKitBridgeForTests(null);
  });

  it('initial state is idle / empty', () => {
    const { result } = renderHook(() => usePhotoKit());
    expect(result.current.authorizationStatus).toBeNull();
    expect(result.current.assets).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.lastError).toBeNull();
  });

  it('checkStatus queries getAuthorizationStatus', async () => {
    const { result } = renderHook(() => usePhotoKit());
    await act(async () => {
      await result.current.checkStatus();
    });
    expect(bridge.getAuthorizationStatus).toHaveBeenCalledTimes(1);
    expect(result.current.authorizationStatus).toBe('notDetermined');
  });

  it('checkStatus records error on bridge failure', async () => {
    bridge.getAuthorizationStatus = jest.fn(async () => {
      throw new Error('status-failed');
    });
    __setPhotoKitBridgeForTests(bridge);
    const { result } = renderHook(() => usePhotoKit());
    await act(async () => {
      await result.current.checkStatus();
    });
    expect(result.current.lastError?.message).toBe('status-failed');
    expect(result.current.authorizationStatus).toBeNull();
  });

  it('requestAccess calls requestAuthorization and updates status', async () => {
    const { result } = renderHook(() => usePhotoKit());
    await act(async () => {
      await result.current.requestAccess();
    });
    expect(bridge.requestAuthorization).toHaveBeenCalledTimes(1);
    expect(result.current.authorizationStatus).toBe('authorized');
  });

  it('requestAccess records error on failure', async () => {
    bridge.requestAuthorization = jest.fn(async () => {
      throw new Error('auth-failed');
    });
    __setPhotoKitBridgeForTests(bridge);
    const { result } = renderHook(() => usePhotoKit());
    await act(async () => {
      await result.current.requestAccess();
    });
    expect(result.current.lastError?.message).toBe('auth-failed');
  });

  it('pickPhotos populates assets', async () => {
    const { result } = renderHook(() => usePhotoKit());
    await act(async () => {
      await result.current.pickPhotos({ selectionLimit: 5 });
    });
    expect(bridge.presentPicker).toHaveBeenCalledWith({ selectionLimit: 5 });
    expect(result.current.assets).toHaveLength(2);
    expect(result.current.assets[0]?.id).toBe('a');
  });

  it('pickPhotos resets loading flag after completion', async () => {
    const { result } = renderHook(() => usePhotoKit());
    await act(async () => {
      await result.current.pickPhotos();
    });
    expect(result.current.loading).toBe(false);
  });

  it('pickPhotos records error and resets loading on failure', async () => {
    bridge.presentPicker = jest.fn(async () => {
      throw new Error('picker-failed');
    });
    __setPhotoKitBridgeForTests(bridge);
    const { result } = renderHook(() => usePhotoKit());
    await act(async () => {
      await result.current.pickPhotos();
    });
    expect(result.current.lastError?.message).toBe('picker-failed');
    expect(result.current.loading).toBe(false);
  });

  it('clearAssets empties the asset list', async () => {
    const { result } = renderHook(() => usePhotoKit());
    await act(async () => {
      await result.current.pickPhotos();
    });
    expect(result.current.assets).toHaveLength(2);
    act(() => {
      result.current.clearAssets();
    });
    expect(result.current.assets).toHaveLength(0);
  });

  it('limited status is surfaced from requestAuthorization', async () => {
    bridge.requestAuthorization = jest.fn(async (): Promise<AuthorizationStatus> => 'limited');
    __setPhotoKitBridgeForTests(bridge);
    const { result } = renderHook(() => usePhotoKit());
    await act(async () => {
      await result.current.requestAccess();
    });
    expect(result.current.authorizationStatus).toBe('limited');
  });

  it('denied status is surfaced from requestAuthorization', async () => {
    bridge.requestAuthorization = jest.fn(async (): Promise<AuthorizationStatus> => 'denied');
    __setPhotoKitBridgeForTests(bridge);
    const { result } = renderHook(() => usePhotoKit());
    await act(async () => {
      await result.current.requestAccess();
    });
    expect(result.current.authorizationStatus).toBe('denied');
  });

  it('pickPhotos with no config calls presentPicker with undefined', async () => {
    const { result } = renderHook(() => usePhotoKit());
    await act(async () => {
      await result.current.pickPhotos();
    });
    expect(bridge.presentPicker).toHaveBeenCalledWith(undefined);
  });
});
