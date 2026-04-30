# Contract: `with-handoff` plugin Info.plist merge

**Feature**: 040-handoff-continuity
**Consumed by**: `plugins/with-handoff/index.ts`, `app.json`
**Mirrors**: `plugins/with-spotlight/index.ts` (feature 031)

---

## Pure helper signature

```ts
import { HANDOFF_DEMO_ACTIVITY_TYPE } from 'src/modules/handoff-lab/activity-types';

export function applyHandoffInfoPlist(
  input: Record<string, unknown>
): Record<string, unknown>;
```

**Behaviour**:

1. Returns a **new** object (immutable input).
2. Reads `input.NSUserActivityTypes`.
3. If it's an array, filters to `string[]` (drops non-string entries silently — defensive).
4. If it's missing OR not an array, treats prior entries as `[]`. When non-array AND non-undefined, emits a one-line `console.warn`: `"with-handoff: NSUserActivityTypes was not an array; replacing."` (Edge Case #4.)
5. Appends `HANDOFF_DEMO_ACTIVITY_TYPE` (= `'com.izkizk8.spot.activity.handoff-demo'`) only if not already present.
6. Writes the merged array back to `next.NSUserActivityTypes`, preserving prior entries' order verbatim.
7. Returns `next`.

---

## Plugin wrapper

```ts
import type { ConfigPlugin } from '@expo/config-plugins';
import { withInfoPlist } from '@expo/config-plugins';

const withHandoff: ConfigPlugin = (config) =>
  withInfoPlist(config, (mod) => {
    mod.modResults = applyHandoffInfoPlist(
      mod.modResults as unknown as Record<string, unknown>,
    ) as typeof mod.modResults;
    return mod;
  });

export default withHandoff;
```

---

## Invariants & test matrix

Tests live in `test/unit/plugins/with-handoff/index.test.ts`. The pure helper is the test target; the `withInfoPlist` wrapper is asserted only for "calls the helper exactly once" via a spy.

| # | Input `NSUserActivityTypes`                              | Expected output `NSUserActivityTypes`                              |
|---|----------------------------------------------------------|--------------------------------------------------------------------|
| 1 | _missing key_                                            | `['com.izkizk8.spot.activity.handoff-demo']`                       |
| 2 | `[]`                                                     | `['com.izkizk8.spot.activity.handoff-demo']`                       |
| 3 | `['spot.showcase.activity']` (031 ran first)             | `['spot.showcase.activity', 'com.izkizk8.spot.activity.handoff-demo']` |
| 4 | `['com.izkizk8.spot.activity.handoff-demo']` (re-run)    | `['com.izkizk8.spot.activity.handoff-demo']` (idempotent)          |
| 5 | `['spot.showcase.activity', 'com.izkizk8.spot.activity.handoff-demo']` (both already present) | identical (idempotent)                  |
| 6 | `'not-an-array'`                                         | `['com.izkizk8.spot.activity.handoff-demo']` + `console.warn` fired |
| 7 | `null`                                                   | `['com.izkizk8.spot.activity.handoff-demo']` + `console.warn` fired |
| 8 | `[42, 'spot.showcase.activity', null]` (mixed)           | `['spot.showcase.activity', 'com.izkizk8.spot.activity.handoff-demo']` (non-strings dropped) |

**Idempotency invariant** (FR-004): For any input `x`, `applyHandoffInfoPlist(applyHandoffInfoPlist(x))` MUST deep-equal `applyHandoffInfoPlist(x)`. Tested with row #4 and a generative pass over rows #1-#8.

**Coexistence with 031** (FR-005): For both helpers `H = applyHandoffInfoPlist`, `S = applySpotlightInfoPlist`, and any input `x` not containing either activity type:

- `H(S(x)).NSUserActivityTypes` as a **set** equals `S(H(x)).NSUserActivityTypes` as a set.
- Both equal `{ 'spot.showcase.activity', 'com.izkizk8.spot.activity.handoff-demo' } ∪ priorStrings(x)`.

The test asserts set equality (sorted compare), NOT array equality, because the order depends on plugin run order — both are valid.

**Order preservation** (FR-003): For input `['a', 'b', 'c']`, output starts with `['a', 'b', 'c', ...]` — no reordering of prior entries.

---

## `app.json` integration

The plugin is appended to the existing `plugins` array:

```json
"plugins": [
  // … 30 prior entries (last is "./plugins/with-spotlight" from feature 031) …
  "./plugins/with-handoff"
]
```

The plugin-count assertion in `test/unit/plugins/with-mapkit/index.test.ts` is updated:

```ts
expect(plugins.length).toBe(31); // bumped from 30 by feature 040
```

---

## What this contract does NOT do

- Does **not** add Associated Domains entitlement (Universal Links — deferred).
- Does **not** add an AASA file (Universal Links — deferred).
- Does **not** modify any other Info.plist key.
- Does **not** invoke the `with-spotlight` plugin or read its constants — coupling between 031 and 040 is by Info.plist convergence, not by plugin import.
