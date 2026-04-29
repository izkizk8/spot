/**
 * Background Tasks bridge stub for Android — feature 030.
 *
 * The BackgroundTasks framework is iOS-only (FR-071). Every mutating
 * method rejects with `BackgroundTasksNotSupported`; `isAvailable()`
 * returns `false`; `getRegisteredIdentifiers()` returns `[]`.
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
  return Promise.reject(
    new BackgroundTasksNotSupported('Background Tasks require iOS 13+'),
  );
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
