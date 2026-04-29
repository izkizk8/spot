/**
 * Contract: JS bridge to the iOS BackgroundTasks framework.
 *
 * @feature 030-background-tasks
 * @see specs/030-background-tasks/spec.md FR-070..072, AC-BGT-007
 * @see specs/030-background-tasks/data-model.md Entities 1+2
 *
 * Implementation files:
 *   - src/native/background-tasks.ts         (iOS path)
 *   - src/native/background-tasks.android.ts (throws everywhere mutating)
 *   - src/native/background-tasks.web.ts     (same as android)
 *   - src/native/background-tasks.types.ts   (re-exports the types here)
 *
 * INVARIANTS (asserted by `test/unit/native/background-tasks.test.ts`):
 *   B1. Native module name is the literal string 'BackgroundTasks'.
 *       (Distinct from 013 'AppIntents', 014 'WidgetCenter',
 *        029 'FocusFilters'.)
 *   B2. On non-iOS / iOS < 13, every mutating method throws
 *       `BackgroundTasksNotSupported`. `isAvailable()` returns
 *       `false`; `getRegisteredIdentifiers()` returns `[]`.
 *   B3. Mutating method calls (`scheduleAppRefresh`,
 *       `scheduleProcessing`, `cancelAll`) are serialised through
 *       a single closure-scoped promise chain. Two back-to-back
 *       calls produce native invocations in submission order even
 *       if the first rejects (research.md §1).
 *   B4. `getLastRun()` returns the strict-parsed `LastRunSnapshot`
 *       or null on parse failure (no partial payloads).
 *   B5. The two task identifiers are frozen literals (FR-060,
 *       EC-009): `com.izkizk8.spot.refresh`,
 *       `com.izkizk8.spot.processing`.
 */

import type { TaskRunRecord } from './history-store.contract';

export type TaskType = 'refresh' | 'processing';

export interface LastRunSnapshot {
  readonly refresh: TaskRunRecord | null;
  readonly processing: TaskRunRecord | null;
}

export interface ScheduleProcessingOptions {
  readonly requiresExternalPower: boolean;
  readonly requiresNetworkConnectivity: boolean;
}

/** Frozen literals — see invariant B5. */
export const TASK_IDENTIFIER_REFRESH = 'com.izkizk8.spot.refresh' as const;
export const TASK_IDENTIFIER_PROCESSING = 'com.izkizk8.spot.processing' as const;

/** Default earliestBeginInterval for refresh requests (FR-021). */
export const DEFAULT_REFRESH_INTERVAL_MS = 60_000;

/**
 * Native module name expected by `requireOptionalNativeModule(...)`.
 * Frozen — see invariant B1.
 */
export const NATIVE_MODULE_NAME = 'BackgroundTasks' as const;

/**
 * Typed error class for cross-platform branching at the import
 * boundary. Consumers MAY `instanceof`-check.
 */
export declare class BackgroundTasksNotSupported extends Error {
  readonly name: 'BackgroundTasksNotSupported';
  constructor(message?: string);
}

export interface BackgroundTasksBridge {
  /** Returns true on iOS 13+ when the native module is loadable. */
  readonly isAvailable: () => boolean;

  /**
   * Returns the two registered task identifiers on iOS, [] elsewhere.
   * Stable; never throws.
   */
  readonly getRegisteredIdentifiers: () => readonly string[];

  /**
   * Submits a `BGAppRefreshTaskRequest` for
   * `com.izkizk8.spot.refresh` with
   * `earliestBeginDate = now + earliestBeginIntervalMs`.
   *
   * @throws BackgroundTasksNotSupported on non-iOS / iOS < 13.
   */
  readonly scheduleAppRefresh: (earliestBeginIntervalMs?: number) => Promise<void>;

  /**
   * Submits a `BGProcessingTaskRequest` for
   * `com.izkizk8.spot.processing` with the supplied requirements.
   *
   * @throws BackgroundTasksNotSupported on non-iOS / iOS < 13.
   */
  readonly scheduleProcessing: (opts: ScheduleProcessingOptions) => Promise<void>;

  /**
   * Cancels every pending task request for the two registered
   * identifiers. Has no effect on already-running handlers (iOS
   * cannot cancel mid-flight tasks).
   *
   * @throws BackgroundTasksNotSupported on non-iOS / iOS < 13.
   */
  readonly cancelAll: () => Promise<void>;

  /**
   * Reads the App Group `UserDefaults` snapshot at
   * `spot.bgtasks.lastRun`. Returns null if the key is absent or
   * the payload fails strict parse (no partial payloads).
   *
   * @throws BackgroundTasksNotSupported on non-iOS.
   */
  readonly getLastRun: () => Promise<LastRunSnapshot | null>;
}
