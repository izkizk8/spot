/**
 * Tests for the Android background-tasks bridge stub — feature 030 / T011.
 */

import bridge, {
  BackgroundTasksNotSupported,
  cancelAll,
  getLastRun,
  getRegisteredIdentifiers,
  isAvailable,
  scheduleAppRefresh,
  scheduleProcessing,
} from '@/native/background-tasks.android';

describe('background-tasks bridge: android stub', () => {
  it('isAvailable() returns false (FR-071)', () => {
    expect(isAvailable()).toBe(false);
    expect(bridge.isAvailable()).toBe(false);
  });

  it('getRegisteredIdentifiers() returns [] (FR-071)', () => {
    expect(getRegisteredIdentifiers()).toEqual([]);
    expect(bridge.getRegisteredIdentifiers()).toEqual([]);
  });

  it('scheduleAppRefresh rejects with BackgroundTasksNotSupported', async () => {
    await expect(scheduleAppRefresh(60_000)).rejects.toBeInstanceOf(
      BackgroundTasksNotSupported,
    );
  });

  it('scheduleProcessing rejects with BackgroundTasksNotSupported', async () => {
    await expect(
      scheduleProcessing({
        requiresExternalPower: true,
        requiresNetworkConnectivity: true,
      }),
    ).rejects.toBeInstanceOf(BackgroundTasksNotSupported);
  });

  it('cancelAll rejects with BackgroundTasksNotSupported', async () => {
    await expect(cancelAll()).rejects.toBeInstanceOf(BackgroundTasksNotSupported);
  });

  it('getLastRun rejects with BackgroundTasksNotSupported', async () => {
    await expect(getLastRun()).rejects.toBeInstanceOf(BackgroundTasksNotSupported);
  });

  it('thrown error is also instanceof Error (FR-072)', async () => {
    await expect(cancelAll()).rejects.toBeInstanceOf(Error);
  });

  it('module source does NOT import expo-modules-core or react-native', () => {
    const fs = require('fs');
    const path = require('path');
    const filePath = path.resolve(__dirname, '../../../src/native/background-tasks.android.ts');
    const src = fs.readFileSync(filePath, 'utf8');
    expect(src).not.toMatch(/from\s+['"]expo-modules-core['"]/);
    expect(src).not.toMatch(/from\s+['"]react-native['"]/);
  });
});
