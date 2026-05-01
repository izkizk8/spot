/**
 * Peripherals store — unit tests (T013).
 * Feature: 035-core-bluetooth
 */

import type { DiscoveredPeripheral } from '@/native/ble-central.types';
import {
  DISCOVERED_LIST_CAP,
  EMPTY_STATE,
  add,
  clear,
  prune,
  selectSorted,
  STALE_WINDOW_MS,
} from '@/modules/bluetooth-lab/store/peripherals-store';

function row(
  id: string,
  rssi: number,
  lastSeen: number,
  name: string | null = null,
): DiscoveredPeripheral {
  return { id, name, rssi, serviceUUIDs: [], lastSeen };
}

describe('peripherals-store', () => {
  it('starts empty', () => {
    expect(EMPTY_STATE).toEqual([]);
  });

  it('add() appends a new row', () => {
    const s = add(EMPTY_STATE, row('a', -40, 1000));
    expect(s).toHaveLength(1);
    expect(s[0].id).toBe('a');
  });

  it('add() with same id updates RSSI / lastSeen (no duplicate)', () => {
    const s1 = add(EMPTY_STATE, row('a', -50, 1000));
    const s2 = add(s1, row('a', -40, 2000));
    expect(s2).toHaveLength(1);
    expect(s2[0].rssi).toBe(-40);
    expect(s2[0].lastSeen).toBe(2000);
  });

  it('add() returns the same reference for a no-op update', () => {
    const s1 = add(EMPTY_STATE, row('a', -40, 1000, 'name'));
    const s2 = add(s1, row('a', -40, 1000, 'name'));
    expect(s2).toBe(s1);
  });

  it(`enforces soft-cap (${DISCOVERED_LIST_CAP}) by evicting oldest-by-lastSeen`, () => {
    let s: readonly DiscoveredPeripheral[] = EMPTY_STATE;
    for (let i = 0; i < DISCOVERED_LIST_CAP; i++) {
      s = add(s, row(`d${i}`, -i, 1000 + i));
    }
    expect(s).toHaveLength(DISCOVERED_LIST_CAP);
    // d0 has the oldest lastSeen (1000); a 101st row should evict it.
    s = add(s, row('new', -10, 9_999));
    expect(s).toHaveLength(DISCOVERED_LIST_CAP);
    expect(s.find((p) => p.id === 'd0')).toBeUndefined();
    expect(s.find((p) => p.id === 'new')).toBeDefined();
  });

  it('selectSorted() sorts by RSSI desc, ties by lastSeen desc', () => {
    let s: readonly DiscoveredPeripheral[] = EMPTY_STATE;
    s = add(s, row('a', -60, 1000));
    s = add(s, row('b', -40, 1000));
    s = add(s, row('c', -40, 2000));
    const sorted = selectSorted(s);
    expect(sorted.map((p) => p.id)).toEqual(['c', 'b', 'a']);
  });

  it(`prune() removes rows older than ${STALE_WINDOW_MS} ms`, () => {
    let s: readonly DiscoveredPeripheral[] = EMPTY_STATE;
    s = add(s, row('fresh', -40, 100_000));
    s = add(s, row('stale', -40, 50_000));
    const pruned = prune(s, 100_000);
    expect(pruned).toHaveLength(1);
    expect(pruned[0].id).toBe('fresh');
  });

  it('prune() returns same reference when no row is pruned', () => {
    const s = add(EMPTY_STATE, row('fresh', -40, 100_000));
    const after = prune(s, 100_000);
    expect(after).toBe(s);
  });

  it('clear() empties the list', () => {
    const s = add(EMPTY_STATE, row('a', -40, 1000));
    expect(clear(s)).toEqual([]);
  });
});
