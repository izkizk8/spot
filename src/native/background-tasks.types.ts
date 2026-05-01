/**
 * Background Tasks bridge types — feature 030.
 *
 * Cross-platform-safe: importing this module on Android/Web/iOS
 * does NOT touch any iOS-only native bridge. The runtime variants
 * (`background-tasks.{ts,android.ts,web.ts}`) re-export the symbols
 * defined here.
 *
 * @see specs/030-background-tasks/contracts/background-tasks-bridge.contract.ts
 * @see specs/030-background-tasks/contracts/history-store.contract.ts
 */

/** The two task identifiers registered by this feature (FR-060, EC-009). */
export const TASK_IDENTIFIER_REFRESH = 'com.izkizk8.spot.refresh' as const;
export const TASK_IDENTIFIER_PROCESSING = 'com.izkizk8.spot.processing' as const;

/** Default earliestBeginInterval for `scheduleAppRefresh` (FR-021). */
export const DEFAULT_REFRESH_INTERVAL_MS = 60_000 as const;

/** Native module name expected by `requireOptionalNativeModule(...)`. */
export const NATIVE_MODULE_NAME = 'BackgroundTasks' as const;

export type TaskType = 'refresh' | 'processing';

export type TaskStatus = 'completed' | 'expired' | 'canceled';

export interface TaskRunRecord {
  readonly id: string;
  readonly type: TaskType;
  readonly scheduledAt: number;
  readonly startedAt: number | null;
  readonly endedAt: number | null;
  readonly durationMs: number | null;
  readonly status: TaskStatus;
}

export interface LastRunSnapshot {
  readonly refresh: TaskRunRecord | null;
  readonly processing: TaskRunRecord | null;
}

export interface ScheduleProcessingOptions {
  readonly requiresExternalPower: boolean;
  readonly requiresNetworkConnectivity: boolean;
}

export interface BackgroundTasksBridge {
  readonly isAvailable: () => boolean;
  readonly getRegisteredIdentifiers: () => readonly string[];
  readonly scheduleAppRefresh: (earliestBeginIntervalMs?: number) => Promise<void>;
  readonly scheduleProcessing: (opts: ScheduleProcessingOptions) => Promise<void>;
  readonly cancelAll: () => Promise<void>;
  readonly getLastRun: () => Promise<LastRunSnapshot | null>;
}

/**
 * Thrown by every mutating bridge method on non-iOS / iOS<13 / when the
 * native module is absent (FR-072).
 */
export class BackgroundTasksNotSupported extends Error {
  override readonly name = 'BackgroundTasksNotSupported' as const;

  constructor(message?: string) {
    super(message ?? 'BackgroundTasksNotSupported');
    // Restore prototype for instanceof across transpilation targets
    Object.setPrototypeOf(this, BackgroundTasksNotSupported.prototype);
  }
}
