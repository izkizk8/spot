/**
 * Unit tests: simulator-store (feature 042).
 *
 * @jest-environment node
 */

import {
  createSimulatorStore,
  DEFAULT_CAPACITY,
  simulatorStore,
} from '@/modules/app-clips-lab/simulator-store';

describe('simulator-store', () => {
  describe('createSimulatorStore', () => {
    it('returns a store with the configured capacity', () => {
      const store = createSimulatorStore(5);
      expect(store.capacity).toBe(5);
    });

    it('throws on non-positive capacity', () => {
      expect(() => createSimulatorStore(0)).toThrow(/positive/);
      expect(() => createSimulatorStore(-1)).toThrow(/positive/);
      expect(() => createSimulatorStore(Number.NaN)).toThrow(/positive/);
      expect(() => createSimulatorStore(Number.POSITIVE_INFINITY)).toThrow(/positive/);
    });

    it('shared simulatorStore uses DEFAULT_CAPACITY', () => {
      expect(simulatorStore.capacity).toBe(DEFAULT_CAPACITY);
    });
  });

  describe('push / list', () => {
    it('records a single invocation with monotonic id and ISO timestamp', () => {
      const store = createSimulatorStore();
      const entry = store.push({ url: 'https://x.example/clip', source: 'nfc', metadata: {} });
      expect(entry.id).toBe(1);
      expect(entry.url).toBe('https://x.example/clip');
      expect(entry.source).toBe('nfc');
      expect(typeof entry.receivedAt).toBe('string');
      expect(Number.isNaN(Date.parse(entry.receivedAt))).toBe(false);
    });

    it('list() is most-recent-first', () => {
      const store = createSimulatorStore();
      store.push({ url: 'a', source: 'qr', metadata: {} });
      store.push({ url: 'b', source: 'maps', metadata: {} });
      store.push({ url: 'c', source: 'safari', metadata: {} });
      const urls = store.list().map((i) => i.url);
      expect(urls).toEqual(['c', 'b', 'a']);
    });

    it('ids are monotonically increasing', () => {
      const store = createSimulatorStore();
      const a = store.push({ url: 'a', source: 'default', metadata: {} });
      const b = store.push({ url: 'b', source: 'default', metadata: {} });
      const c = store.push({ url: 'c', source: 'default', metadata: {} });
      expect(b.id).toBe(a.id + 1);
      expect(c.id).toBe(b.id + 1);
    });

    it('metadata is copied (not aliased) and frozen', () => {
      const store = createSimulatorStore();
      const md = { foo: 'bar' };
      const entry = store.push({ url: 'a', source: 'nfc', metadata: md });
      md.foo = 'changed';
      expect(entry.metadata.foo).toBe('bar');
      expect(Object.isFrozen(entry.metadata)).toBe(true);
    });

    it('list() result is frozen and a snapshot (not mutating)', () => {
      const store = createSimulatorStore();
      store.push({ url: 'a', source: 'nfc', metadata: {} });
      const snapshot = store.list();
      expect(Object.isFrozen(snapshot)).toBe(true);
      store.push({ url: 'b', source: 'qr', metadata: {} });
      expect(snapshot).toHaveLength(1);
      expect(store.list()).toHaveLength(2);
    });
  });

  describe('capacity', () => {
    it('FIFO-trims oldest entries past capacity', () => {
      const store = createSimulatorStore(3);
      store.push({ url: '1', source: 'nfc', metadata: {} });
      store.push({ url: '2', source: 'qr', metadata: {} });
      store.push({ url: '3', source: 'maps', metadata: {} });
      store.push({ url: '4', source: 'safari', metadata: {} });
      const urls = store.list().map((i) => i.url);
      expect(urls).toEqual(['4', '3', '2']);
      expect(store.list()).toHaveLength(3);
    });
  });

  describe('clear', () => {
    it('empties the buffer', () => {
      const store = createSimulatorStore();
      store.push({ url: 'a', source: 'nfc', metadata: {} });
      store.push({ url: 'b', source: 'qr', metadata: {} });
      store.clear();
      expect(store.list()).toEqual([]);
    });

    it('notifies subscribers even when buffer was already empty', () => {
      const store = createSimulatorStore();
      const spy = jest.fn();
      store.subscribe(spy);
      store.clear();
      expect(spy).toHaveBeenCalledTimes(1);
    });
  });

  describe('subscribe', () => {
    it('notifies on push', () => {
      const store = createSimulatorStore();
      const spy = jest.fn();
      store.subscribe(spy);
      store.push({ url: 'a', source: 'nfc', metadata: {} });
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('returns a disposer that unsubscribes', () => {
      const store = createSimulatorStore();
      const spy = jest.fn();
      const dispose = store.subscribe(spy);
      dispose();
      store.push({ url: 'a', source: 'nfc', metadata: {} });
      expect(spy).not.toHaveBeenCalled();
    });

    it('one listener throwing does not prevent others from firing', () => {
      const store = createSimulatorStore();
      const bad = jest.fn(() => {
        throw new Error('boom');
      });
      const good = jest.fn();
      store.subscribe(bad);
      store.subscribe(good);
      store.push({ url: 'a', source: 'nfc', metadata: {} });
      expect(bad).toHaveBeenCalledTimes(1);
      expect(good).toHaveBeenCalledTimes(1);
    });
  });
});
