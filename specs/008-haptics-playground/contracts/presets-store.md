# Contract — `presets-store.ts`

**File**: `src/modules/haptics-playground/presets-store.ts`
**Storage**: AsyncStorage, single key `spot.haptics.presets` (FR-018).

---

## Public API

```ts
import type { Pattern, Preset } from './types';
import { PresetsStoreError } from './types';

/** Read all presets. Tolerant of read / parse errors → returns []. */
export function list(): Promise<Preset[]>;

/**
 * Persist `pattern` as a new preset. Auto-generates id and name.
 * Returns the saved preset.
 *
 * Throws PresetsStoreError('empty-pattern') if every cell is `{kind:'off'}`.
 * Throws PresetsStoreError('write-failed', cause) if AsyncStorage rejects.
 */
export function save(pattern: Pattern): Promise<Preset>;

/** Delete by id. No-op for unknown ids. Never throws. */
export function deletePreset(id: string): Promise<void>;
```

(`deletePreset` rather than `delete` because `delete` is a reserved word.)

---

## Behaviour rules

### `list()`

1. `await AsyncStorage.getItem('spot.haptics.presets')`
2. If `null` → return `[]`.
3. `JSON.parse` the value. On any thrown error → return `[]` (FR-024).
4. If parsed is not an array → return `[]`.
5. For each entry, run the `Preset` shape validator (data-model.md).
   *Skip* invalid entries individually; keep valid ones (FR-025).
6. Return the filtered array.
7. Any other thrown error from `AsyncStorage.getItem` → caught and returned
   as `[]`.

### `save(pattern)`

1. Reject empty pattern: if `pattern.every(c => c.kind === 'off')` → throw
   `PresetsStoreError('empty-pattern', ...)` (FR-020). Never writes.
2. `const existing = await list()` (uses the same tolerant read above).
3. Compute `name`:
   - Extract the trailing integer from each existing `name` matching
     `/^Preset (\d+)$/`. Collect into `Set<number>`.
   - `N` = smallest positive integer not in that set (i.e. 1, 2, 3 … skip
     used). FR-019.
   - `name = \`Preset ${N}\``.
4. Compute `id`: `\`${Date.now()}-${randomBase36(6)}\``.
5. Build `preset = { id, name, pattern, createdAt: new Date().toISOString() }`.
6. `await AsyncStorage.setItem(KEY, JSON.stringify([...existing, preset]))`.
   On failure → throw `PresetsStoreError('write-failed', cause)`.
7. Return `preset`.

### `deletePreset(id)`

1. `const existing = await list()`.
2. `const next = existing.filter(p => p.id !== id)`.
3. If `next.length === existing.length` → return (no-op, unknown id).
4. `await AsyncStorage.setItem(KEY, JSON.stringify(next))`.
5. Any thrown error → caught and swallowed (delete is best-effort, never
   throws — keeps callers ceremony-free).

---

## Error semantics summary

| Operation | Read failure | Parse failure | Write failure | Empty pattern |
|---|---|---|---|---|
| `list()` | returns `[]` | returns `[]` | n/a | n/a |
| `save()` | treated as `[]` (proceed) | treated as `[]` (proceed) | throws `'write-failed'` | throws `'empty-pattern'` |
| `deletePreset()` | swallowed | swallowed | swallowed | n/a |

This shape is what the screen expects: only `save` can fail loudly, and
only on user-actionable conditions (write failure → "couldn't save, try
again"; empty pattern → "compose something first"). All other errors are
silent because they're either indistinguishable from "fresh install" or
non-actionable.

---

## Test surface (assertions for `presets-store.test.ts`)

- Round-trip: `save` then `list` returns the saved preset.
- Sequential saves produce unique ids (regression guard for the random
  suffix).
- After `save` × 3 → `deletePreset(presets[1].id)` → `save` again, the new
  preset is named `Preset 2` (numbering recycles per FR-019).
- Corrupt JSON in storage → `list()` returns `[]` and does not throw.
- One valid entry + one invalid entry in the same blob → `list()` returns
  the one valid entry (FR-025).
- `save` with an all-`off` pattern → throws `PresetsStoreError` with code
  `'empty-pattern'`; nothing is written to storage.
- `AsyncStorage.setItem` rejects → `save` throws `PresetsStoreError` with
  code `'write-failed'`; previously-stored data is unaffected.
- `deletePreset('nonexistent')` resolves without writing.
