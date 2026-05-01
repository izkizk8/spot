/**
 * Peripherals store — pure reducer-style helpers.
 * Feature: 035-core-bluetooth
 *
 * Discovered-peripherals list semantics: dedup-by-id, RSSI/lastSeen
 * update, soft-cap 100 rows (oldest-by-lastSeen evicted), 30 s stale
 * prune, sort by RSSI desc / lastSeen desc.
 *
 * @see specs/035-core-bluetooth/data-model.md (Entity 5)
 */

import type { DiscoveredPeripheral } from '@/native/ble-central.types';

export const DISCOVERED_LIST_CAP = 100;
export const STALE_WINDOW_MS = 30_000;

export type PeripheralsState = readonly DiscoveredPeripheral[];

export const EMPTY_STATE: PeripheralsState = Object.freeze([]);

/**
 * Insert or update a peripheral row. If a row with the same id exists,
 * update RSSI / lastSeen / serviceUUIDs / name in-place. Returns the
 * SAME reference when the input would result in an identical row
 * (cheap React memo integration).
 */
export function add(state: PeripheralsState, peripheral: DiscoveredPeripheral): PeripheralsState {
  const idx = state.findIndex((p) => p.id === peripheral.id);
  if (idx >= 0) {
    const existing = state[idx];
    if (
      existing.rssi === peripheral.rssi &&
      existing.lastSeen === peripheral.lastSeen &&
      existing.name === peripheral.name &&
      existing.serviceUUIDs.length === peripheral.serviceUUIDs.length &&
      existing.serviceUUIDs.every((u, i) => u === peripheral.serviceUUIDs[i])
    ) {
      return state;
    }
    const next = state.slice();
    next[idx] = { ...existing, ...peripheral };
    return next;
  }
  // Soft cap enforcement: when the 101st row arrives, evict the
  // oldest-by-lastSeen.
  if (state.length >= DISCOVERED_LIST_CAP) {
    let oldestIdx = 0;
    let oldestLastSeen = state[0].lastSeen;
    for (let i = 1; i < state.length; i++) {
      if (state[i].lastSeen < oldestLastSeen) {
        oldestLastSeen = state[i].lastSeen;
        oldestIdx = i;
      }
    }
    const next = state.slice();
    next.splice(oldestIdx, 1);
    next.push(peripheral);
    return next;
  }
  return [...state, peripheral];
}

/**
 * Update an existing row's RSSI / lastSeen. No-op when the id is
 * unknown; otherwise delegates to `add`.
 */
export function update(
  state: PeripheralsState,
  peripheral: DiscoveredPeripheral,
): PeripheralsState {
  return add(state, peripheral);
}

/**
 * Remove rows with `lastSeen < now - STALE_WINDOW_MS` (FR-009).
 * Returns the same reference when no row was pruned.
 */
export function prune(state: PeripheralsState, now: number): PeripheralsState {
  const cutoff = now - STALE_WINDOW_MS;
  let any = false;
  const next: DiscoveredPeripheral[] = [];
  for (const p of state) {
    if (p.lastSeen >= cutoff) {
      next.push(p);
    } else {
      any = true;
    }
  }
  return any ? next : state;
}

/**
 * Empty the list.
 */
export function clear(_state: PeripheralsState): PeripheralsState {
  return EMPTY_STATE;
}

/**
 * Return rows sorted by RSSI desc; ties broken by lastSeen desc.
 * Returns a new array (callers may mutate freely).
 */
export function selectSorted(state: PeripheralsState): readonly DiscoveredPeripheral[] {
  const out = state.slice();
  out.sort((a, b) => {
    if (a.rssi !== b.rssi) return b.rssi - a.rssi;
    return b.lastSeen - a.lastSeen;
  });
  return out;
}
