# Contract: `RingBuffer<T>`

Pure utility at `src/modules/sensors-playground/ring-buffer.ts`.
No React, no `expo-sensors`, no IO — just a fixed-capacity FIFO with
chronological snapshot.

## Signature

```ts
export interface RingBuffer<T> {
  readonly capacity: number;
  /** Current count of stored items, in [0, capacity]. */
  readonly length: number;
  /** Append; if at capacity, evict oldest first. */
  push(value: T): void;
  /** Most-recent N items in chronological order (oldest of the slice first). */
  snapshot(n: number): readonly T[];
  /** Drop all items; capacity unchanged. */
  clear(): void;
}

export function createRingBuffer<T>(capacity: number): RingBuffer<T>;
```

## Invariants

| # | Invariant | Test (`ring-buffer.test.ts`) |
|---|---|---|
| RB-1 | `createRingBuffer(0)` throws | `expect(() => createRingBuffer(0)).toThrow()` |
| RB-2 | `createRingBuffer(-3)` throws | same shape |
| RB-3 | `length` starts at 0 | `expect(buf.length).toBe(0)` |
| RB-4 | `push` increments `length` until capacity | push 5 of cap 60 → `length === 5` |
| RB-5 | At capacity, `push` keeps `length === capacity` | push 70 of cap 60 → `length === 60` |
| RB-6 | At capacity, `push` evicts oldest | push 1..70, `snapshot(60)[0] === 11` |
| RB-7 | `snapshot(n)` returns chronological order (oldest first) | push a, b, c → `snapshot(3) === [a,b,c]` |
| RB-8 | `snapshot(n > length)` returns at most `length` items | push 3 of cap 60, `snapshot(30).length === 3` |
| RB-9 | `snapshot(0)` returns `[]` | empty array |
| RB-10 | `snapshot(-n)` returns `[]` (defensive) | empty array |
| RB-11 | `clear()` resets length to 0 | next `snapshot(60)` returns `[]` |
| RB-12 | `clear()` does not change `capacity` | `buf.capacity` unchanged after clear |
| RB-13 | After clear + push, behavior is identical to a fresh buffer | sequence test |
| RB-14 | `snapshot` returns a defensive copy | mutating the result MUST NOT change subsequent `snapshot` results |

## Implementation note (advisory, not contract)

A typical implementation uses a circular array of length `capacity`
plus a write index and a count. `snapshot(n)` reads the most recent
`min(n, length)` slots in chronological order by walking back from
the write index. This gives O(1) push and O(n) snapshot — the only
reasonable trade for the use case (push at 120 Hz, snapshot at
display rate).

The implementation MAY use a plain array with `Array.prototype.shift`
on overflow (O(n) push) for simplicity in v1. If a profiler later
shows the shift cost matters, swap to the circular variant — the
test suite covers behavior, not implementation.
