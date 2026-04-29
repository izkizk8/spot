/**
 * Tests for shared bridge types — feature 030 / T006.
 *
 * @see specs/030-background-tasks/contracts/background-tasks-bridge.contract.ts
 */

import {
  BackgroundTasksNotSupported,
  TASK_IDENTIFIER_REFRESH,
  TASK_IDENTIFIER_PROCESSING,
  DEFAULT_REFRESH_INTERVAL_MS,
  NATIVE_MODULE_NAME,
  type TaskRunRecord,
  type TaskType,
  type TaskStatus,
  type LastRunSnapshot,
} from '@/native/background-tasks.types';

describe('background-tasks.types', () => {
  it('BackgroundTasksNotSupported is a class extending Error (FR-072)', () => {
    const err = new BackgroundTasksNotSupported();
    expect(err).toBeInstanceOf(BackgroundTasksNotSupported);
    expect(err).toBeInstanceOf(Error);
  });

  it('BackgroundTasksNotSupported has stable name === "BackgroundTasksNotSupported"', () => {
    const err = new BackgroundTasksNotSupported('boom');
    expect(err.name).toBe('BackgroundTasksNotSupported');
    expect(err.message).toBe('boom');
  });

  it('BackgroundTasksNotSupported default message is non-empty', () => {
    const err = new BackgroundTasksNotSupported();
    expect(typeof err.message).toBe('string');
    expect(err.message.length).toBeGreaterThan(0);
  });

  it('TaskType accepts the two literal values (FR-042 / FR-080)', () => {
    const a: TaskType = 'refresh';
    const b: TaskType = 'processing';
    expect(a).toBe('refresh');
    expect(b).toBe('processing');
  });

  it('TaskStatus accepts exactly the three literal values (FR-042)', () => {
    const a: TaskStatus = 'completed';
    const b: TaskStatus = 'expired';
    const c: TaskStatus = 'canceled';
    expect([a, b, c]).toEqual(['completed', 'expired', 'canceled']);
  });

  it('TaskRunRecord shape typechecks with all fields (FR-042)', () => {
    const rec: TaskRunRecord = {
      id: 'r1',
      type: 'refresh',
      scheduledAt: 1,
      startedAt: 2,
      endedAt: 3,
      durationMs: 1,
      status: 'completed',
    };
    expect(rec.id).toBe('r1');
    expect(rec.type).toBe('refresh');
  });

  it('TaskRunRecord allows nulls for startedAt/endedAt/durationMs', () => {
    const rec: TaskRunRecord = {
      id: 'r2',
      type: 'processing',
      scheduledAt: 0,
      startedAt: null,
      endedAt: null,
      durationMs: null,
      status: 'canceled',
    };
    expect(rec.startedAt).toBeNull();
    expect(rec.endedAt).toBeNull();
    expect(rec.durationMs).toBeNull();
  });

  it('LastRunSnapshot { refresh: null, processing: null } typechecks (R-B)', () => {
    const snap: LastRunSnapshot = { refresh: null, processing: null };
    expect(snap.refresh).toBeNull();
    expect(snap.processing).toBeNull();
  });

  it('LastRunSnapshot can carry a record per slot', () => {
    const rec: TaskRunRecord = {
      id: 'x',
      type: 'refresh',
      scheduledAt: 1,
      startedAt: 2,
      endedAt: 3,
      durationMs: 1,
      status: 'completed',
    };
    const snap: LastRunSnapshot = { refresh: rec, processing: null };
    expect(snap.refresh).toBe(rec);
  });

  it('exposes the two frozen task identifiers (EC-009)', () => {
    expect(TASK_IDENTIFIER_REFRESH).toBe('com.izkizk8.spot.refresh');
    expect(TASK_IDENTIFIER_PROCESSING).toBe('com.izkizk8.spot.processing');
  });

  it('exposes default refresh interval and native module name', () => {
    expect(DEFAULT_REFRESH_INTERVAL_MS).toBe(60_000);
    expect(NATIVE_MODULE_NAME).toBe('BackgroundTasks');
  });
});
