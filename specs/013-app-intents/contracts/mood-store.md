# Contract: Mood Store (`mood-store.ts`)

`src/modules/app-intents-lab/mood-store.ts` is a pure-JS module
backed by AsyncStorage. It is the **shared source of truth**
between the iOS Swift intent path (which writes through a small
Swift bridge) and the JS UI path (which reads and writes through
this module). No React, no networking, no in-memory caching
beyond what the underlying AsyncStorage layer provides.

## Public surface

```ts
import AsyncStorage from '@react-native-async-storage/async-storage';

/** One of the three Mood values shared with the Swift SpotMood enum. */
export type Mood = 'happy' | 'neutral' | 'sad';

/** A single record persisted to the mood store. */
export interface MoodRecord {
  readonly mood: Mood;
  readonly timestamp: number;  // ms epoch
}

// Constants
export const MOOD_STORE_KEY = 'spot.app-intents.moods';
export const MOOD_STORE_DISK_CAP = 100;
export const MOOD_STORE_DEFAULT_LIST_CAP = 100;
export const MOODS: readonly Mood[];   // ['happy','neutral','sad']
export const DEFAULT_MOOD: Mood;       // 'neutral' (FR-020)

// Helpers
/** Append a new record. Truncates the on-disk array to
 *  MOOD_STORE_DISK_CAP entries (oldest first). */
export function push(record: MoodRecord): Promise<void>;

/** Return entries newest-first, capped at `limit`
 *  (default MOOD_STORE_DEFAULT_LIST_CAP).
 *  Resolves to [] on AsyncStorage read failure. */
export function list(opts?: { limit?: number }): Promise<readonly MoodRecord[]>;

/** Remove every record. */
export function clear(): Promise<void>;
```

## On-disk format

The AsyncStorage value at `MOOD_STORE_KEY` is a JSON string of an
array of `MoodRecord`, in **insertion order (oldest first)**.
Example:

```json
[
  { "mood": "neutral", "timestamp": 1745800000000 },
  { "mood": "happy",   "timestamp": 1745800030000 },
  { "mood": "sad",     "timestamp": 1745800090000 }
]
```

`list()` reverses the in-memory array before slicing to `limit`,
so callers always see newest-first ordering. The on-disk
oldest-first ordering is an implementation detail that simplifies
truncation (`array.slice(-MOOD_STORE_DISK_CAP)` on every push).

## Invariants asserted by `mood-store.test.ts`

### Constants

- `MOOD_STORE_KEY === 'spot.app-intents.moods'`.
- `MOOD_STORE_DISK_CAP === 100`.
- `MOOD_STORE_DEFAULT_LIST_CAP === 100`.
- `MOODS` is exactly `['happy','neutral','sad']`.
- `DEFAULT_MOOD === 'neutral'`.

### `push(record)`

- After `await push(r)`, `await list({ limit: 1 })` returns `[r]`.
- After N successive pushes (N ≤ 100),
  `(await list()).length === N` and the array is in
  reverse-chronological-of-push order.
- After 101 successive pushes,
  `(await list()).length === 100`; the very first pushed
  record is absent; the most recently pushed record is at
  index 0.
- `push` rejects (and the disk state is not modified) when
  AsyncStorage `setItem` rejects (FR-016 — surface to caller).
- `push` reads-modifies-writes the underlying key — concurrent
  `push` calls are serialised by AsyncStorage's underlying
  implementation; the test pins the documented behaviour
  (back-to-back `await push(a); await push(b);` produces
  `[b, a, …]` in `list()`).

### `list(opts?)`

- `await list()` on a fresh store returns `[]`.
- `await list({ limit: 0 })` returns `[]` (defensive — limit
  zero is allowed and returns nothing).
- `await list({ limit: K })` for `K < length` returns the K
  most recent entries.
- `await list()` defaults to `limit:
  MOOD_STORE_DEFAULT_LIST_CAP` (100) — for a store with
  exactly 100 entries the call returns 100; for a store with
  fewer it returns all of them.
- `list` returns `[]` when AsyncStorage `getItem` rejects
  (FR-016); the rejection MUST NOT propagate to the caller.
- `list` returns `[]` when the stored JSON is unparseable
  (defence in depth — corrupted state is treated as empty
  rather than throwing).
- The returned array is always `readonly` (TS contract; the
  underlying object is `Object.freeze`d in tests for runtime
  assurance).

### `clear()`

- After `await clear()`, `await list()` returns `[]`.
- `clear` returns immediately if the store was already empty
  (no-op-safe).
- `clear` rejects if AsyncStorage `removeItem` rejects (FR-016
  parallel — the UI surfaces the error).

### Round-trip

- `await push({ mood: 'sad', timestamp: 1 })`; the value at
  `MOOD_STORE_KEY` parses to `[{ mood: 'sad', timestamp: 1 }]`.
- The same parse round-trips through `list({ limit: 1 })` and
  yields `{ mood: 'sad', timestamp: 1 }` (no precision loss on
  the timestamp, no string mangling on the mood).

## Cross-platform behaviour

- The module is platform-uniform pure JS — there is **no**
  `.web.ts` / `.android.ts` split. The same code runs on iOS,
  Android, and Web; the underlying AsyncStorage backend differs
  per platform but the JS surface does not.
- On iOS, the **same on-disk file** is read by the Swift
  `MoodStoreBridge` (see `research.md` Decision 1) so a record
  written by `LogMoodIntent` is visible to a subsequent `list()`
  call from the JS UI without any cache invalidation.
- If the Swift-side AsyncStorage file format proves unreadable
  (the documented fallback in `research.md` Decision 1), the
  Swift side writes to a parallel JSON file and `list()` is
  extended to merge both files (taking the parallel file's
  entries as authoritative). The TS contract above is unchanged.

## Mock used by all dependent tests

```ts
// test/unit/test-utils/mock-async-storage.ts
let backing = new Map<string, string>();
export function reset() { backing = new Map(); }
export function setShouldThrowOnGetItem(b: boolean) { /* … */ }
export function setShouldThrowOnSetItem(b: boolean) { /* … */ }
export default {
  getItem:   async (k: string) => { if (throwGet) throw new Error('boom'); return backing.get(k) ?? null; },
  setItem:   async (k: string, v: string) => { if (throwSet) throw new Error('boom'); backing.set(k, v); },
  removeItem: async (k: string) => { backing.delete(k); },
  clear:      async () => { backing.clear(); },
};
```

`mood-store.test.ts` `jest.mock`s
`@react-native-async-storage/async-storage` with this
implementation so it can drive read / write success and failure
deterministically.
