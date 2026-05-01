/**
 * useICloudDrive Hook Test
 * Feature: 070-icloud-drive
 *
 * Exercises checkAvailability, refresh, writeFile, readFile,
 * deleteFile, and error paths.
 */

import { renderHook, act } from '@testing-library/react-native';
import { describe, expect, it, beforeEach, afterEach, jest } from '@jest/globals';

import {
  __setICloudDriveBridgeForTests,
  useICloudDrive,
} from '@/modules/icloud-drive-lab/hooks/useICloudDrive';
import type { ICloudDriveBridge, ICloudFileItem } from '@/native/icloud-drive.types';

const sampleFile = (overrides: Partial<ICloudFileItem> = {}): ICloudFileItem => ({
  name: 'demo.txt',
  url: 'icloud://containers/iCloud.com.example/demo.txt',
  size: 1024,
  modifiedAt: 1_700_000_000_000,
  ...overrides,
});

describe('useICloudDrive', () => {
  let bridge: ICloudDriveBridge;

  beforeEach(() => {
    bridge = {
      isAvailable: jest.fn(async (): Promise<boolean> => true),
      listFiles: jest.fn(async (): Promise<readonly ICloudFileItem[]> => [sampleFile()]),
      writeFile: jest.fn(async (): Promise<ICloudFileItem> => sampleFile()),
      readFile: jest.fn(async (): Promise<string> => 'Hello iCloud'),
      deleteFile: jest.fn(async (): Promise<void> => {}),
    };
    __setICloudDriveBridgeForTests(bridge);
  });

  afterEach(() => {
    __setICloudDriveBridgeForTests(null);
  });

  it('initial state is idle / null / empty', () => {
    const { result } = renderHook(() => useICloudDrive());
    expect(result.current.available).toBeNull();
    expect(result.current.files).toHaveLength(0);
    expect(result.current.loading).toBe(false);
    expect(result.current.lastError).toBeNull();
  });

  it('checkAvailability sets available=true', async () => {
    const { result } = renderHook(() => useICloudDrive());
    await act(async () => {
      await result.current.checkAvailability();
    });
    expect(bridge.isAvailable).toHaveBeenCalledTimes(1);
    expect(result.current.available).toBe(true);
  });

  it('checkAvailability sets available=false on bridge error', async () => {
    bridge.isAvailable = jest.fn(async () => {
      throw new Error('not-available');
    });
    __setICloudDriveBridgeForTests(bridge);
    const { result } = renderHook(() => useICloudDrive());
    await act(async () => {
      await result.current.checkAvailability();
    });
    expect(result.current.available).toBe(false);
    expect(result.current.lastError?.message).toBe('not-available');
  });

  it('refresh populates files list', async () => {
    const { result } = renderHook(() => useICloudDrive());
    await act(async () => {
      await result.current.refresh();
    });
    expect(bridge.listFiles).toHaveBeenCalledTimes(1);
    expect(result.current.files).toHaveLength(1);
    expect(result.current.files[0]?.name).toBe('demo.txt');
    expect(result.current.loading).toBe(false);
  });

  it('refresh records error and resets loading', async () => {
    bridge.listFiles = jest.fn(async () => {
      throw new Error('list-failed');
    });
    __setICloudDriveBridgeForTests(bridge);
    const { result } = renderHook(() => useICloudDrive());
    await act(async () => {
      await result.current.refresh();
    });
    expect(result.current.lastError?.message).toBe('list-failed');
    expect(result.current.loading).toBe(false);
    expect(result.current.files).toHaveLength(0);
  });

  it('writeFile adds the new file to the list', async () => {
    const { result } = renderHook(() => useICloudDrive());
    await act(async () => {
      await result.current.writeFile('demo.txt', 'Hello');
    });
    expect(bridge.writeFile).toHaveBeenCalledWith('demo.txt', 'Hello');
    expect(result.current.files).toHaveLength(1);
    expect(result.current.loading).toBe(false);
  });

  it('readFile returns content', async () => {
    const { result } = renderHook(() => useICloudDrive());
    let content: string | null = null;
    await act(async () => {
      content = await result.current.readFile('icloud://containers/iCloud.com.example/demo.txt');
    });
    expect(bridge.readFile).toHaveBeenCalledTimes(1);
    expect(content).toBe('Hello iCloud');
  });

  it('readFile returns null on error', async () => {
    bridge.readFile = jest.fn(async () => {
      throw new Error('read-failed');
    });
    __setICloudDriveBridgeForTests(bridge);
    const { result } = renderHook(() => useICloudDrive());
    let content: string | null = 'something';
    await act(async () => {
      content = await result.current.readFile('bad://url');
    });
    expect(content).toBeNull();
    expect(result.current.lastError?.message).toBe('read-failed');
  });

  it('deleteFile removes the file from the list', async () => {
    const { result } = renderHook(() => useICloudDrive());
    await act(async () => {
      await result.current.writeFile('demo.txt', 'Hello');
    });
    expect(result.current.files).toHaveLength(1);
    const url = result.current.files[0]?.url ?? '';
    await act(async () => {
      await result.current.deleteFile(url);
    });
    expect(bridge.deleteFile).toHaveBeenCalledWith(url);
    expect(result.current.files).toHaveLength(0);
    expect(result.current.loading).toBe(false);
  });
});
