/**
 * Background Tasks JS bridge — iOS variant — feature 030.
 *
 * Single seam where the iOS-only `BackgroundTasks` native module is
 * touched. Resolves to a no-op (rejecting) bridge on Android, Web, and
 * iOS<13 / when the optional native module is absent.
 *
 * Mutating method calls are serialised through a single closure-scoped
 * promise chain so back-to-back calls produce native invocations in
 * submission order even when an earlier call rejects (R-A / FR-083).
 *
 * @see specs/030-background-tasks/contracts/background-tasks-bridge.contract.ts
 */

import { Platform } from 'react-native';
import { requireOptionalNativeModule } from 'expo-modules-core';

import {
  BackgroundTasksNotSupported,
  DEFAULT_REFRESH_INTERVAL_MS,
  NATIVE_MODULE_NAME,
  TASK_IDENTIFIER_PROCESSING,
  TASK_IDENTIFIER_REFRESH,
  type BackgroundTasksBridge,
  type LastRunSnapshot,
  type ScheduleProcessingOptions,
} from './background-tasks.types';

export { BackgroundTasksNotSupported };

interface NativeBackgroundTasks {
  isAvailable?(): boolean;
  scheduleAppRefresh(earliestBeginIntervalMs: number): Promise<void>;
  scheduleProcessing(opts: ScheduleProcessingOptions): Promise<void>;
  cancelAll(): Promise<void>;
  getLastRun(): Promise<LastRunSnapshot | null>;
}

const native = requireOptionalNativeModule<NativeBackgroundTasks>(NATIVE_MODULE_NAME);

const REGISTERED_IDENTIFIERS: readonly string[] = Object.freeze([
  TASK_IDENTIFIER_REFRESH,
  TASK_IDENTIFIER_PROCESSING,
]);
const EMPTY_IDENTIFIERS: readonly string[] = Object.freeze([]);

function getIOSVersion(): number {
  if (Platform.OS !== 'ios') return 0;
  const v = Platform.Version;
  return typeof v === 'string' ? parseFloat(v) : v;
}

function isReady(): boolean {
  return Platform.OS === 'ios' && getIOSVersion() >= 13 && native != null;
}

/**
 * Single in-memory promise chain. Every mutating call queues onto this
 * chain so that even if an earlier call rejects, the next call still
 * executes (R-A). The chain stores `unknown` because each link's value
 * is irrelevant to the next.
 */
let chain: Promise<unknown> = Promise.resolve();

function enqueue<T>(fn: () => Promise<T>): Promise<T> {
  const result = chain.then(fn, fn);
  // Swallow rejections on the chain reference itself so subsequent
  // appends are not poisoned. Callers still observe the rejection
  // through the returned `result` promise.
  chain = result.then(
    () => undefined,
    () => undefined,
  );
  return result;
}

const bridge: BackgroundTasksBridge = Object.freeze({
  isAvailable: (): boolean => isReady(),

  getRegisteredIdentifiers: (): readonly string[] =>
    isReady() ? REGISTERED_IDENTIFIERS : EMPTY_IDENTIFIERS,

  scheduleAppRefresh: (earliestBeginIntervalMs?: number): Promise<void> => {
    const ms = earliestBeginIntervalMs ?? DEFAULT_REFRESH_INTERVAL_MS;
    if (!isReady() || native == null) {
      return Promise.reject(
        new BackgroundTasksNotSupported('Background Tasks require iOS 13+'),
      );
    }
    return enqueue(() => native.scheduleAppRefresh(ms));
  },

  scheduleProcessing: (opts: ScheduleProcessingOptions): Promise<void> => {
    if (!isReady() || native == null) {
      return Promise.reject(
        new BackgroundTasksNotSupported('Background Tasks require iOS 13+'),
      );
    }
    return enqueue(() => native.scheduleProcessing(opts));
  },

  cancelAll: (): Promise<void> => {
    if (!isReady() || native == null) {
      return Promise.reject(
        new BackgroundTasksNotSupported('Background Tasks require iOS 13+'),
      );
    }
    return enqueue(() => native.cancelAll());
  },

  getLastRun: (): Promise<LastRunSnapshot | null> => {
    if (!isReady() || native == null) {
      return Promise.reject(
        new BackgroundTasksNotSupported('Background Tasks require iOS 13+'),
      );
    }
    return native.getLastRun();
  },
});

export const isAvailable = bridge.isAvailable;
export const getRegisteredIdentifiers = bridge.getRegisteredIdentifiers;
export const scheduleAppRefresh = bridge.scheduleAppRefresh;
export const scheduleProcessing = bridge.scheduleProcessing;
export const cancelAll = bridge.cancelAll;
export const getLastRun = bridge.getLastRun;

export default bridge;
