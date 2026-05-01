/**
 * Contract: AsyncStorage-backed run-history store.
 *
 * @feature 030-background-tasks
 * @see specs/030-background-tasks/spec.md FR-040..044, AC-BGT-005
 * @see specs/030-background-tasks/data-model.md Entity 1 (TaskRunRecord)
 *
 * This file declares the typed surface of
 * `src/modules/background-tasks-lab/history-store.ts`.
 * Implementation MUST match these signatures exactly.
 *
 * INVARIANTS (asserted by `history-store.test.ts`):
 *   I1. AsyncStorage key is the literal string 'spot.bgtasks.history'.
 *   I2. The persisted value is a JSON-encoded `TaskRunRecord[]`
 *       with `length <= 20`.
 *   I3. `appendRun(...)` evicts FIFO when length would exceed 20:
 *       the OLDEST entry is dropped, the NEW entry is prepended.
 *       (List is rendered newest-first per FR-042.)
 *   I4. Read / parse / write failures DO NOT throw to the caller;
 *       they degrade to an empty list AND invoke the optional
 *       `onError(err)` callback EXACTLY ONCE per failure.
 *   I5. `clearRuns()` removes the AsyncStorage key entirely
 *       (not "writes []") so cold-launch reads see "missing"
 *       and not "empty array" — both must yield [] from `listRuns`.
 *   I6. `parsePersistedArray(raw)` is pure (no I/O) and tolerates:
 *       - `JSON.parse` throws,
 *       - non-array roots,
 *       - elements failing TaskRunRecord shape validation.
 */

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

export interface HistoryStoreOptions {
  /**
   * Invoked at most once per failed read / parse / write. The
   * hook supplies this so it can surface AsyncStorage errors on
   * its `error` channel without coupling the store to React state.
   */
  readonly onError?: (err: unknown) => void;
}

/** AsyncStorage key. Frozen literal — see invariant I1. */
export const HISTORY_STORAGE_KEY = 'spot.bgtasks.history';

/** Cap before FIFO eviction. Frozen — see invariant I3. */
export const HISTORY_MAX_ENTRIES = 20;

/**
 * Read the persisted history. Newest first.
 * Returns [] on any failure (per I4).
 */
export type ListRuns = (opts?: HistoryStoreOptions) => Promise<readonly TaskRunRecord[]>;

/**
 * Append a new terminal-status record to the head; evict FIFO at cap.
 * Returns the post-append list.
 *
 * @throws never (see I4) — failures degrade to []
 */
export type AppendRun = (
  record: TaskRunRecord,
  opts?: HistoryStoreOptions,
) => Promise<readonly TaskRunRecord[]>;

/** Remove the AsyncStorage key entirely (per I5). */
export type ClearRuns = (opts?: HistoryStoreOptions) => Promise<void>;

/**
 * Pure parser. Returns [] on any malformed input (per I6).
 * Used internally by `listRuns` and exposed for tests.
 */
export type ParsePersistedArray = (
  raw: unknown,
  opts?: HistoryStoreOptions,
) => readonly TaskRunRecord[];

export interface HistoryStore {
  readonly listRuns: ListRuns;
  readonly appendRun: AppendRun;
  readonly clearRuns: ClearRuns;
  readonly parsePersistedArray: ParsePersistedArray;
}
