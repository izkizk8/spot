/**
 * App Clips Lab — simulator-store (feature 042).
 *
 * In-memory FIFO store of simulated App Clip invocations. Pure JS so it
 * runs identically in Jest's jsdom environment and on a device.
 *
 * Invariants:
 *   - capacity defaults to 20 (configurable via `createSimulatorStore`);
 *   - push() trims oldest entries past capacity (FIFO at the head);
 *   - list() returns most-recent-first, frozen, non-mutable;
 *   - subscribe() notifies on every push/clear; unsubscribe via the
 *     returned disposer;
 *   - listener errors are caught so one bad subscriber cannot break the
 *     others;
 *   - clear() empties the buffer and notifies subscribers.
 */

import type { InvocationSourceId } from './invocation-sources';

export interface SimulatedInvocation {
  /** Stable id (monotonic counter scoped to the store). */
  readonly id: number;
  /** ISO-8601 timestamp at which the invocation was recorded. */
  readonly receivedAt: string;
  /** The simulated `_XCAppClipURL` value. */
  readonly url: string;
  /** Source surface that produced the simulated invocation. */
  readonly source: InvocationSourceId;
  /** Optional, opaque metadata blob (label/value pairs). */
  readonly metadata: Readonly<Record<string, string>>;
}

export interface SimulatorStore {
  push(input: Omit<SimulatedInvocation, 'id' | 'receivedAt'>): SimulatedInvocation;
  list(): readonly SimulatedInvocation[];
  clear(): void;
  subscribe(listener: () => void): () => void;
  readonly capacity: number;
}

export const DEFAULT_CAPACITY = 20;

export function createSimulatorStore(capacity: number = DEFAULT_CAPACITY): SimulatorStore {
  if (!Number.isFinite(capacity) || capacity <= 0) {
    throw new Error('createSimulatorStore: capacity must be a positive finite number');
  }
  let buffer: SimulatedInvocation[] = [];
  const listeners = new Set<() => void>();
  let nextId = 1;

  const notify = () => {
    for (const listener of listeners) {
      try {
        listener();
      } catch {
        // Swallow listener errors; one bad subscriber must not affect others.
      }
    }
  };

  return {
    capacity,
    push(input) {
      const entry: SimulatedInvocation = Object.freeze({
        id: nextId++,
        receivedAt: new Date().toISOString(),
        url: input.url,
        source: input.source,
        metadata: Object.freeze({ ...input.metadata }),
      });
      // Most-recent-first: prepend.
      buffer = [entry, ...buffer];
      if (buffer.length > capacity) {
        buffer = buffer.slice(0, capacity);
      }
      notify();
      return entry;
    },
    list() {
      return Object.freeze(buffer.slice());
    },
    clear() {
      if (buffer.length === 0) {
        // Still notify; tests that rely on a clear-pulse should see it.
        notify();
        return;
      }
      buffer = [];
      notify();
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

/**
 * Module-level shared store. The screen reads from this; tests construct
 * private instances via `createSimulatorStore()`.
 */
export const simulatorStore: SimulatorStore = createSimulatorStore();
