/**
 * Tests for the AsyncStorage-backed history store — feature 030 / T008.
 *
 * @see specs/030-background-tasks/contracts/history-store.contract.ts
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  HISTORY_STORAGE_KEY,
  HISTORY_MAX_ENTRIES,
  appendRun,
  clearRuns,
  listRuns,
  parsePersistedArray,
} from '@/modules/background-tasks-lab/history-store';
import type { TaskRunRecord } from '@/native/background-tasks.types';

function makeRecord(id: string, scheduledAt: number): TaskRunRecord {
  return {
    id,
    type: 'refresh',
    scheduledAt,
    startedAt: scheduledAt + 100,
    endedAt: scheduledAt + 200,
    durationMs: 100,
    status: 'completed',
  };
}

describe('history-store', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.restoreAllMocks();
  });

  it('exposes the literal AsyncStorage key (FR-040)', () => {
    expect(HISTORY_STORAGE_KEY).toBe('spot.bgtasks.history');
  });

  it('listRuns() on a fresh storage returns []', async () => {
    const result = await listRuns();
    expect(result).toEqual([]);
  });

  it('appendRun(record) writes a JSON array containing exactly that record', async () => {
    const r = makeRecord('a', 100);
    await appendRun(r);
    const raw = await AsyncStorage.getItem(HISTORY_STORAGE_KEY);
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(String(raw));
    expect(parsed).toHaveLength(1);
    expect(parsed[0]).toEqual(r);
  });

  it('two successive appends yield newest-first ordering (US3 AS1)', async () => {
    const a = makeRecord('a', 100);
    const b = makeRecord('b', 200);
    await appendRun(a);
    await appendRun(b);
    const list = await listRuns();
    expect(list.map((x) => x.id)).toEqual(['b', 'a']);
  });

  it('FIFO eviction at HISTORY_MAX_ENTRIES (FR-041 / US3 AS2)', async () => {
    // Sequential awaits (deterministic newest-first order)
    let chain: Promise<unknown> = Promise.resolve();
    for (let i = 0; i < HISTORY_MAX_ENTRIES + 1; i++) {
      chain = chain.then(() => appendRun(makeRecord(`r${i}`, i)));
    }
    await chain;
    const list = await listRuns();
    expect(list).toHaveLength(HISTORY_MAX_ENTRIES);
    expect(list[0].id).toBe(`r${HISTORY_MAX_ENTRIES}`); // newest
    // The oldest should have been evicted
    expect(list.map((x) => x.id)).not.toContain('r0');
  });

  it('clearRuns() removes the key entirely (FR-043 / US3 AS4)', async () => {
    await appendRun(makeRecord('x', 1));
    await clearRuns();
    const raw = await AsyncStorage.getItem(HISTORY_STORAGE_KEY);
    expect(raw).toBeNull();
    const list = await listRuns();
    expect(list).toEqual([]);
  });

  it('listRuns() tolerates AsyncStorage.getItem rejection (FR-044 / NFR-002 / EC-004)', async () => {
    const onError = jest.fn();
    const err = new Error('disk failure');
    jest.spyOn(AsyncStorage, 'getItem').mockRejectedValueOnce(err);

    const list = await listRuns({ onError });
    expect(list).toEqual([]);
    expect(onError).toHaveBeenCalledWith(err);
  });

  it('appendRun() resolves even if setItem rejects (FR-044 / NFR-002)', async () => {
    const onError = jest.fn();
    const err = new Error('write failure');
    jest.spyOn(AsyncStorage, 'setItem').mockRejectedValueOnce(err);

    await expect(appendRun(makeRecord('x', 1), { onError })).resolves.toBeDefined();
    expect(onError).toHaveBeenCalledWith(err);
  });

  it('parsePersistedArray("not-json") returns []', () => {
    expect(parsePersistedArray('not-json')).toEqual([]);
  });

  it('parsePersistedArray of corrupt JSON: listRuns also returns [] (EC-004)', async () => {
    await AsyncStorage.setItem(HISTORY_STORAGE_KEY, 'not-json');
    const list = await listRuns();
    expect(list).toEqual([]);
  });

  it('parsePersistedArray of non-array root returns []', () => {
    expect(parsePersistedArray('{"notAnArray":true}')).toEqual([]);
  });

  it('parsePersistedArray filters malformed entries best-effort', () => {
    const valid = makeRecord('valid', 1);
    const raw = JSON.stringify([valid, { broken: true }, null, 42]);
    const parsed = parsePersistedArray(raw);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].id).toBe('valid');
  });

  it('append after clear retains only the post-clear record (EC-010)', async () => {
    await appendRun(makeRecord('stale', 1));
    await clearRuns();
    await appendRun(makeRecord('fresh', 2));
    const list = await listRuns();
    expect(list).toHaveLength(1);
    expect(list[0].id).toBe('fresh');
  });

  it('parsePersistedArray of null/undefined returns []', () => {
    expect(parsePersistedArray(null)).toEqual([]);
    expect(parsePersistedArray(undefined)).toEqual([]);
  });
});
