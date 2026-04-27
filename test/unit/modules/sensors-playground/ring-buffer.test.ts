/**
 * @file ring-buffer.test.ts
 * @description Contract test for RingBuffer (contracts/ring-buffer.md)
 */
import { createRingBuffer } from '@/modules/sensors-playground/ring-buffer';

describe('createRingBuffer', () => {
  it('RB-1: throws on capacity 0', () => {
    expect(() => createRingBuffer(0)).toThrow(/positive integer/);
  });

  it('RB-2: throws on negative capacity', () => {
    expect(() => createRingBuffer(-3)).toThrow(/positive integer/);
  });

  it('RB-3: starts with length 0', () => {
    const buf = createRingBuffer<number>(60);
    expect(buf.length).toBe(0);
  });

  it('RB-4: push increments length up to capacity', () => {
    const buf = createRingBuffer<number>(60);
    for (let i = 0; i < 5; i++) buf.push(i);
    expect(buf.length).toBe(5);
  });

  it('RB-5/RB-6: at capacity, length stays at capacity and oldest is evicted', () => {
    const buf = createRingBuffer<number>(60);
    for (let i = 1; i <= 70; i++) buf.push(i);
    expect(buf.length).toBe(60);
    expect(buf.snapshot(60)[0]).toBe(11);
  });

  it('RB-7: snapshot returns chronological order (oldest first)', () => {
    const buf = createRingBuffer<string>(10);
    buf.push('a');
    buf.push('b');
    buf.push('c');
    expect(buf.snapshot(3)).toEqual(['a', 'b', 'c']);
  });

  it('RB-8: snapshot(n > length) returns at most length items', () => {
    const buf = createRingBuffer<number>(60);
    buf.push(1);
    buf.push(2);
    buf.push(3);
    expect(buf.snapshot(30)).toHaveLength(3);
  });

  it('RB-9: snapshot(0) returns []', () => {
    const buf = createRingBuffer<number>(60);
    buf.push(1);
    expect(buf.snapshot(0)).toEqual([]);
  });

  it('RB-10: snapshot(-n) returns []', () => {
    const buf = createRingBuffer<number>(60);
    buf.push(1);
    expect(buf.snapshot(-3)).toEqual([]);
  });

  it('RB-11: clear resets length to 0', () => {
    const buf = createRingBuffer<number>(60);
    buf.push(1);
    buf.push(2);
    buf.clear();
    expect(buf.length).toBe(0);
    expect(buf.snapshot(60)).toEqual([]);
  });

  it('RB-12: clear preserves capacity', () => {
    const buf = createRingBuffer<number>(60);
    buf.push(1);
    buf.clear();
    expect(buf.capacity).toBe(60);
  });

  it('RB-13: after clear+push, behaves like a fresh buffer', () => {
    const buf = createRingBuffer<number>(3);
    buf.push(1);
    buf.push(2);
    buf.clear();
    buf.push(7);
    buf.push(8);
    expect(buf.snapshot(3)).toEqual([7, 8]);
  });

  it('RB-14: snapshot returns a defensive copy (mutation does not affect future snapshots)', () => {
    const buf = createRingBuffer<number>(3);
    buf.push(1);
    buf.push(2);
    const snap = buf.snapshot(3) as number[];
    snap[0] = 999;
    expect(buf.snapshot(3)).toEqual([1, 2]);
  });
});
