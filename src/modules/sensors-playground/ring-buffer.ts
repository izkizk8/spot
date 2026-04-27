/**
 * @file ring-buffer.ts
 * @description Fixed-capacity FIFO with chronological snapshot.
 * Pure utility — no React, no expo-sensors, no IO.
 * Contract: specs/011-sensors-playground/contracts/ring-buffer.md
 */

export interface RingBuffer<T> {
  readonly capacity: number;
  readonly length: number;
  push(value: T): void;
  snapshot(n: number): readonly T[];
  clear(): void;
}

class CircularBuffer<T> implements RingBuffer<T> {
  readonly capacity: number;
  private readonly slots: (T | undefined)[];
  private writeIndex = 0;
  private count = 0;

  constructor(capacity: number) {
    if (!Number.isInteger(capacity) || capacity <= 0) {
      throw new Error(`RingBuffer capacity must be a positive integer (got ${capacity})`);
    }
    this.capacity = capacity;
    this.slots = Array.from({ length: capacity }) as (T | undefined)[];
  }

  get length(): number {
    return this.count;
  }

  push(value: T): void {
    this.slots[this.writeIndex] = value;
    this.writeIndex = (this.writeIndex + 1) % this.capacity;
    if (this.count < this.capacity) this.count += 1;
  }

  snapshot(n: number): readonly T[] {
    if (n <= 0 || this.count === 0) return [];
    const take = Math.min(n, this.count);
    const out: T[] = Array.from({ length: take }) as T[];
    // Oldest of the slice first.
    // Index of the oldest item in the slice = writeIndex - take (mod capacity).
    const start = (this.writeIndex - take + this.capacity) % this.capacity;
    for (let i = 0; i < take; i++) {
      out[i] = this.slots[(start + i) % this.capacity] as T;
    }
    return out;
  }

  clear(): void {
    this.writeIndex = 0;
    this.count = 0;
    for (let i = 0; i < this.capacity; i++) this.slots[i] = undefined;
  }
}

export function createRingBuffer<T>(capacity: number): RingBuffer<T> {
  return new CircularBuffer<T>(capacity);
}
