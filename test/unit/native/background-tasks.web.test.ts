/**
 * Tests for the Web background-tasks bridge stub — feature 030 / T012.
 */

import bridge, {
  BackgroundTasksNotSupported,
  cancelAll,
  getLastRun,
  getRegisteredIdentifiers,
  isAvailable,
  scheduleAppRefresh,
  scheduleProcessing,
} from '@/native/background-tasks.web';

describe('background-tasks bridge: web stub', () => {
  it('isAvailable() returns false (FR-071)', () => {
    expect(isAvailable()).toBe(false);
    expect(bridge.isAvailable()).toBe(false);
  });

  it('getRegisteredIdentifiers() returns [] (FR-071)', () => {
    expect(getRegisteredIdentifiers()).toEqual([]);
  });

  it('scheduleAppRefresh rejects with BackgroundTasksNotSupported', async () => {
    await expect(scheduleAppRefresh()).rejects.toBeInstanceOf(BackgroundTasksNotSupported);
  });

  it('scheduleProcessing rejects with BackgroundTasksNotSupported', async () => {
    await expect(
      scheduleProcessing({
        requiresExternalPower: false,
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

  it('module source does NOT statically import react-native or expo-modules-core (FR-012 / SC-007)', () => {
    const fs = require('fs');
    const path = require('path');
    const filePath = path.resolve(__dirname, '../../../src/native/background-tasks.web.ts');
    const src = fs.readFileSync(filePath, 'utf8');
    expect(src).not.toMatch(/from\s+['"]react-native['"]/);
    expect(src).not.toMatch(/from\s+['"]expo-modules-core['"]/);
  });
});
