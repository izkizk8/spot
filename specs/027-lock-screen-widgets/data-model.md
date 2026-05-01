# Phase 1 — Data Model: Lock Screen Widgets Module

All entities are local to this feature. No new global stores; no new
database tables. Persistence surfaces:

- App Group `UserDefaults(suiteName: group.<bundleId>.showcase)` —
  **same suite 014 established**, under the disjoint key namespace
  `spot.widget.lockConfig.*`.
- AsyncStorage shadow store keyed `spot.widget.lockConfig` — used only
  on Android / Web / iOS < 16 for the preview path.
- React reducer in `screen.tsx` (in-memory, discarded on unmount) —
  reload event log.

## Entities

### `LockConfig` (TypeScript + Swift)

The shared lock-screen widget configuration the user pushes from the
app to the widget.

```ts
// src/modules/lock-widgets-lab/lock-config.ts
import type { Tint } from '@/modules/widgets-lab/widget-config';

export interface LockConfig {
  /** Free-form headline string. Initialised to "Hello, Lock!". */
  showcaseValue: string;
  /** Signed integer; clamped to [-9999, 9999] at the input layer. */
  counter: number;
  /** One of the 4 documented swatches (re-imported from 014, NOT redefined). */
  tint: Tint;
}

export const DEFAULT_LOCK_CONFIG: LockConfig = {
  showcaseValue: 'Hello, Lock!',
  counter: 0,
  tint: 'blue', // mirrors 014's DEFAULT_CONFIG.tint
};
```

```swift
// native/ios/widgets/lock-screen/LockScreenAccessoryEntry.swift (excerpt)
// Tint is shared with feature 014's enum (same 4 cases, same raw values).
struct LockConfig {
    let showcaseValue: String
    let counter: Int
    let tint: Tint
    static let `default` = LockConfig(
        showcaseValue: "Hello, Lock!", counter: 0, tint: .blue
    )
}
```

**Validation rules** (FR-LW-027 / FR-LW-044):

- `showcaseValue`: any string accepted; empty/whitespace handled at
  the input layer per Edge Cases (push button disabled OR pushes
  default — must match 014's policy).
- `counter`: signed integer; clamped to `[-9999, 9999]` at input
  (consistent with 014). `validate()` passes through values outside
  the clamp range so legacy values are preserved.
- `tint`: must be one of `TINTS` (re-exported from 014); `validate()`
  falls back to `DEFAULT_LOCK_CONFIG.tint` on unknown values.

**Storage keys** (App Group `UserDefaults` suite,
`group.<bundleId>.showcase`, **disjoint from 014's
`widgetConfig.*`**):

- `spot.widget.lockConfig.showcaseValue` — String
- `spot.widget.lockConfig.counter` — Int
- `spot.widget.lockConfig.tint` — String (raw value of `Tint` enum)

**JS-side shadow store** (non-iOS-16+ only): `AsyncStorage` key
`spot.widget.lockConfig`, JSON-serialised `LockConfig`. Mirrors what
the App Group would hold; not read on iOS 16+.

### `AccessoryFamily` (TypeScript)

The discriminator for the live preview panel (RN-rendered, all
platforms).

```ts
// src/modules/lock-widgets-lab/components/AccessoryPreview.tsx
export type AccessoryFamily = 'rectangular' | 'circular' | 'inline';

export const ACCESSORY_FAMILIES: readonly AccessoryFamily[] =
  ['rectangular', 'circular', 'inline'] as const;
```

Each value maps 1:1 to a WidgetKit family on the Swift side:

| `AccessoryFamily` (TS) | `WidgetFamily` (Swift)    |
|------------------------|---------------------------|
| `'rectangular'`        | `.accessoryRectangular`   |
| `'circular'`           | `.accessoryCircular`      |
| `'inline'`             | `.accessoryInline`        |

The preview panel renders three cards in this fixed order.

### `LockScreenAccessoryEntry` (Swift, `TimelineEntry`)

```swift
// native/ios/widgets/lock-screen/LockScreenAccessoryEntry.swift
struct LockScreenAccessoryEntry: TimelineEntry {
    let date: Date
    let showcaseValue: String
    let counter: Int
    let tint: Tint
}
```

Built by `LockScreenAccessoryProvider` (FR-LW-009 / FR-LW-010 /
FR-LW-011):

- `placeholder(in:)` → `LockScreenAccessoryEntry(date: .now, showcaseValue: "Hello, Lock!", counter: 0, tint: .blue)` — **does not** read the App Group (placeholders may render before the app has run).
- `getSnapshot(in:completion:)` → reads App Group keys
  `spot.widget.lockConfig.*`; on read failure returns
  `LockConfig.default` rather than throwing.
- `getTimeline(in:completion:)` → reads the same keys; returns
  `Timeline([entry], policy: .after(now + 30 min))`. Cadence matches
  014's 30-minute reload policy unless plan.md documents otherwise.

### `ReloadLogEntry` (TypeScript, in-memory only)

```ts
// src/modules/lock-widgets-lab/components/ReloadEventLog.tsx
export type ReloadLogStatus = 'success' | 'failure';

export interface ReloadLogEntry {
  /** Stable id (e.g. `${ts}-${rand}`). */
  id: string;
  /** ms since epoch; formatted in user locale at render time. */
  at: number;
  /** Always 'SpotLockScreenWidget' for this module (kept explicit for parity with 014). */
  kind: 'SpotLockScreenWidget';
  status: ReloadLogStatus;
  /** Present iff status === 'failure'. */
  errorMessage?: string;
}
```

State lives in a `useReducer` ring buffer of capacity exactly 10
(FR-LW-029 / Edge Cases "Per-kind reload event log overflow").
Reducer actions:

- `{ type: 'push', entry: ReloadLogEntry }` → prepend; drop tail
  beyond index 9.
- `{ type: 'reset' }` → unused in this feature; reserved for future.

Discarded on unmount per FR-LW-029.

### `Tint` (TypeScript + Swift)

**Re-imported, not redefined** (FR-LW-012 / spec-resolved decision
about ConfigPanel parity). Same four swatches, same labels, same hex
map, same Swift enum 014 already exports. The lock-screen demo does
not introduce new swatches.

```ts
// src/modules/lock-widgets-lab/lock-config.ts
import type { Tint } from '@/modules/widgets-lab/widget-config';
import { TINTS } from '@/modules/widgets-lab/widget-config';
```

Hex map (used by both the SwiftUI views and the RN previews):

| Tint    | Hex       | Source                         |
|---------|-----------|--------------------------------|
| blue    | `#0A84FF` | `Colors.dark.tintA` (theme)    |
| green   | `#30D158` | iOS dark system green          |
| orange  | `#FF9F0A` | `Colors.dark.tintB` (theme)    |
| pink    | `#FF375F` | iOS dark system pink           |

Lock Screen renders accessory widgets in `vibrantForegroundStyle`,
so colour fidelity is limited; tint is expressed via shape contrast
where colour cannot be honoured (FR-LW-014). Accessibility labels
still name the tint per FR-LW-050.

### `RegistryEntry` (existing — `src/modules/types.ts`)

The lock-widgets-lab manifest is a normal `ModuleManifest`:

```ts
// src/modules/lock-widgets-lab/index.tsx
{
  id: 'lock-widgets-lab',
  title: 'Lock Screen Widgets',
  description: 'Ship a real Lock Screen accessory widget on iOS 16+; preview-only on Android/Web.',
  icon: { ios: 'lock.square.stack', fallback: '🔒' },
  platforms: ['ios', 'android', 'web'],
  minIOS: '16.0',
  render: () => <LockWidgetsLabScreen />,
}
```

The registry-entry contract is asserted by `manifest.test.ts` against
`contracts/manifest.contract.ts`.

## State transitions

### `LockConfig` (App Group, iOS 16+)

```
              setLockConfig(c)
   (empty)  ───────────────────►  (showcaseValue, counter, tint persisted under
        ▲                          spot.widget.lockConfig.*)
        │                                  │
        │                                  │ widget extension wakes
        │ (suite never cleared by app)     │
        │                                  ▼
        │                         getTimeline / getSnapshot reads keys
        │                                  │
        └──────────── on read failure: returns LockConfig.default
```

### `ReloadLogEntry` log (in-memory, per-screen-mount)

```
   mount: []
     │
     │ user taps Push → setLockConfig(c).then(reloadTimelinesByKind('SpotLockScreenWidget'))
     │
     ├── success → push({ id, at, kind, status:'success' })
     │
     └── failure → push({ id, at, kind, status:'failure', errorMessage })

   length > 10 → drop tail until length === 10
   unmount: discarded (FR-LW-029)
```

### Cross-feature isolation

```
014 home widget                    027 lock-screen widget
─────────────────                  ──────────────────────
spot.widget.config                 spot.widget.lockConfig
  └── widgetConfig.showcaseValue     └── spot.widget.lockConfig.showcaseValue
  └── widgetConfig.counter           └── spot.widget.lockConfig.counter
  └── widgetConfig.tint              └── spot.widget.lockConfig.tint

reloadAllTimelines()               reloadTimelinesByKind('SpotLockScreenWidget')
  └── refreshes ALL widgets          └── refreshes ONLY lock-screen kind

ReloadEventLog (014's screen)      ReloadEventLog (027's screen)
  └── home reloads only              └── lock-screen reloads only
```

Pushes to one surface MUST NOT cause the other surface to refresh
(FR-LW-030 / spec Edge Case "014 home widget and 027 lock widget
pushed in alternation"); cross-contamination is impossible because
the key namespaces and the reload-targeting strings are disjoint.

## Cross-target invariants

- **Tint set parity**: the 4 `Tint` enum cases on the Swift side
  (shared with 014) and the 4 `Tint` string-union members on the JS
  side MUST stay in sync. Drift is detected by 014's existing
  `widget-config.test.ts` (which 027 leaves untouched). If 027 ever
  adds a 5th tint, both sides must update simultaneously.
- **Key namespace disjointness**: the literal strings
  `spot.widget.lockConfig.*` (027) and `widgetConfig.*` (014) MUST
  never overlap. Asserted by `lock-config.test.ts` (027 keys never
  mention `widgetConfig`) and by hand-review on any future namespace
  change.
- **Bundle marker contract**: the marker comments
  `// MARK: spot-widgets:bundle:additional-widgets:start` /
  `:end` MUST be present in `ios-widget/SpotWidgetBundle.swift`
  (emitted by 014's `add-widget-bundle.ts`). 027's plugin fails
  loudly if either is missing (FR-LW-041 / research §3).
- **Single widget extension target**: the generated Xcode project
  MUST contain exactly one widget extension target,
  `LiveActivityDemoWidget`, hosting both 014's `ShowcaseWidget()`
  and 027's `LockScreenAccessoryWidget()` via the shared
  `SpotWidgetBundle`. Asserted at on-device verification time
  (`quickstart.md` §7).
