/**
 * AsyncStorage-backed FIFO ring buffer for `TaskRunRecord` history — feature 030.
 *
 * Pure functions: `appendRun`, `listRuns`, `clearRuns`, `parsePersistedArray`.
 * Owned exclusively by JS; the Swift side never reads or writes this key.
 *
 * @see specs/030-background-tasks/contracts/history-store.contract.ts
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

import type {
  TaskRunRecord,
  TaskStatus,
  TaskType,
} from '@/native/background-tasks.types';

/** AsyncStorage key. Frozen — see contract I1 / FR-040. */
export const HISTORY_STORAGE_KEY = 'spot.bgtasks.history' as const;

/** Cap before FIFO eviction — see contract I3 / FR-041. */
export const HISTORY_MAX_ENTRIES = 20 as const;

export interface HistoryStoreOptions {
  readonly onError?: (err: unknown) => void;
}

const VALID_TYPES: ReadonlySet<TaskType> = new Set(['refresh', 'processing']);
const VALID_STATUSES: ReadonlySet<TaskStatus> = new Set([
  'completed',
  'expired',
  'canceled',
]);

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isFiniteOrNull(value: unknown): value is number | null {
  return value === null || isFiniteNumber(value);
}

function isTaskRunRecord(value: unknown): value is TaskRunRecord {
  if (typeof value !== 'object' || value === null) return false;
  const r = value as Record<string, unknown>;
  if (typeof r.id !== 'string' || r.id.length === 0) return false;
  if (typeof r.type !== 'string' || !VALID_TYPES.has(r.type as TaskType)) {
    return false;
  }
  if (typeof r.status !== 'string' || !VALID_STATUSES.has(r.status as TaskStatus)) {
    return false;
  }
  if (!isFiniteNumber(r.scheduledAt)) return false;
  if (!isFiniteOrNull(r.startedAt)) return false;
  if (!isFiniteOrNull(r.endedAt)) return false;
  if (!isFiniteOrNull(r.durationMs)) return false;
  return true;
}

function reportError(err: unknown, opts: HistoryStoreOptions | undefined): void {
  if (opts?.onError) {
    try {
      opts.onError(err);
    } catch {
      // Swallow — the callback is best-effort.
    }
  }
}

/**
 * Pure parser. Returns [] on any malformed input (per contract I6).
 * Tolerant of `JSON.parse` throwing, non-array roots, and per-element
 * shape failures (best-effort filter).
 */
export function parsePersistedArray(
  raw: unknown,
  opts?: HistoryStoreOptions,
): readonly TaskRunRecord[] {
  if (raw === null || raw === undefined) return [];
  if (typeof raw !== 'string') return [];
  if (raw.length === 0) return [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    reportError(err, opts);
    return [];
  }

  if (!Array.isArray(parsed)) return [];

  const valid: TaskRunRecord[] = [];
  for (const entry of parsed) {
    if (isTaskRunRecord(entry)) valid.push(entry);
  }
  return valid;
}

/**
 * Read the persisted history. Newest first. Returns [] on any failure.
 */
export async function listRuns(
  opts?: HistoryStoreOptions,
): Promise<readonly TaskRunRecord[]> {
  let raw: string | null;
  try {
    raw = await AsyncStorage.getItem(HISTORY_STORAGE_KEY);
  } catch (err) {
    reportError(err, opts);
    return [];
  }
  return parsePersistedArray(raw, opts);
}

/**
 * Prepend a new record (newest-first) and FIFO-evict at cap. Never throws.
 */
export async function appendRun(
  record: TaskRunRecord,
  opts?: HistoryStoreOptions,
): Promise<readonly TaskRunRecord[]> {
  const current = await listRuns(opts);
  const next = [record, ...current].slice(0, HISTORY_MAX_ENTRIES);
  try {
    await AsyncStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(next));
  } catch (err) {
    reportError(err, opts);
  }
  return next;
}

/** Remove the AsyncStorage key entirely (per contract I5 / FR-043). */
export async function clearRuns(opts?: HistoryStoreOptions): Promise<void> {
  try {
    await AsyncStorage.removeItem(HISTORY_STORAGE_KEY);
  } catch (err) {
    reportError(err, opts);
  }
}
