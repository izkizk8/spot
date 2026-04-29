/**
 * Background Tasks bridge stub for Web — feature 030.
 *
 * Identical surface to the Android variant. Imports ONLY from
 * `./background-tasks.types` — never `react-native`'s Platform module
 * nor `expo-modules-core`'s `requireOptionalNativeModule` (FR-012 / SC-007).
 */

import {
  BackgroundTasksNotSupported,
  type BackgroundTasksBridge,
  type LastRunSnapshot,
  type ScheduleProcessingOptions,
} from './background-tasks.types';

export { BackgroundTasksNotSupported };

const EMPTY_IDENTIFIERS: readonly string[] = Object.freeze([]);

function reject(): Promise<never> {
  return Promise.reject(new BackgroundTasksNotSupported('Background Tasks require iOS 13+'));
}

const bridge: BackgroundTasksBridge = Object.freeze({
  isAvailable: () => false,
  getRegisteredIdentifiers: () => EMPTY_IDENTIFIERS,
  scheduleAppRefresh: (_earliestBeginIntervalMs?: number): Promise<void> => reject(),
  scheduleProcessing: (_opts: ScheduleProcessingOptions): Promise<void> => reject(),
  cancelAll: (): Promise<void> => reject(),
  getLastRun: (): Promise<LastRunSnapshot | null> => reject(),
});

export const isAvailable = bridge.isAvailable;
export const getRegisteredIdentifiers = bridge.getRegisteredIdentifiers;
export const scheduleAppRefresh = bridge.scheduleAppRefresh;
export const scheduleProcessing = bridge.scheduleProcessing;
export const cancelAll = bridge.cancelAll;
export const getLastRun = bridge.getLastRun;

export default bridge;
