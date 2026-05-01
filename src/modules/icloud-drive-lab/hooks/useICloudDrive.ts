/**
 * iCloud Drive Hook
 * Feature: 070-icloud-drive
 *
 * State machine for the iCloud Drive lab. Tracks availability, the
 * current file list, loading state, and the last error.
 * The native bridge is replaceable at the import boundary via
 * `__setICloudDriveBridgeForTests` for unit tests.
 */

import { useCallback, useState } from 'react';

import iCloudDriveDefault from '@/native/icloud-drive';
import type { ICloudDriveBridge, ICloudFileItem } from '@/native/icloud-drive.types';

let mockBridge: ICloudDriveBridge | null = null;

export function __setICloudDriveBridgeForTests(bridge: ICloudDriveBridge | null) {
  mockBridge = bridge;
}

function getBridge(): ICloudDriveBridge {
  if (mockBridge) return mockBridge;
  return iCloudDriveDefault;
}

export interface ICloudDriveState {
  available: boolean | null;
  files: readonly ICloudFileItem[];
  loading: boolean;
  lastError: Error | null;
}

export interface ICloudDriveActions {
  checkAvailability: () => Promise<void>;
  refresh: () => Promise<void>;
  writeFile: (name: string, content: string) => Promise<void>;
  readFile: (url: string) => Promise<string | null>;
  deleteFile: (url: string) => Promise<void>;
}

export function useICloudDrive(): ICloudDriveState & ICloudDriveActions {
  const [available, setAvailable] = useState<boolean | null>(null);
  const [files, setFiles] = useState<readonly ICloudFileItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastError, setLastError] = useState<Error | null>(null);

  const checkAvailability = useCallback(async () => {
    setLastError(null);
    try {
      const ok = await getBridge().isAvailable();
      setAvailable(ok);
    } catch (err) {
      setLastError(err as Error);
      setAvailable(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    setLastError(null);
    try {
      const items = await getBridge().listFiles();
      setFiles(items);
    } catch (err) {
      setLastError(err as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  const writeFile = useCallback(async (name: string, content: string) => {
    setLoading(true);
    setLastError(null);
    try {
      const item = await getBridge().writeFile(name, content);
      setFiles((prev) => {
        const filtered = prev.filter((f) => f.url !== item.url);
        return [...filtered, item];
      });
    } catch (err) {
      setLastError(err as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  const readFile = useCallback(async (url: string): Promise<string | null> => {
    setLastError(null);
    try {
      return await getBridge().readFile(url);
    } catch (err) {
      setLastError(err as Error);
      return null;
    }
  }, []);

  const deleteFile = useCallback(async (url: string) => {
    setLoading(true);
    setLastError(null);
    try {
      await getBridge().deleteFile(url);
      setFiles((prev) => prev.filter((f) => f.url !== url));
    } catch (err) {
      setLastError(err as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    available,
    files,
    loading,
    lastError,
    checkAvailability,
    refresh,
    writeFile,
    readFile,
    deleteFile,
  };
}
