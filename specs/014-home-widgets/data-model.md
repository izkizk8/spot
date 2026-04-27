# Phase 1 — Data Model: Home Screen Widgets Module

All entities are local to this feature. No new global stores; no new
database tables. The single new persistence surface is the App Group
`UserDefaults(suiteName:)` suite identified by
`group.<ios.bundleIdentifier>.showcase`.

## Entities

### `WidgetConfig` (TypeScript + Swift)

The shared configuration the user pushes from the app to the widget.

```ts
// src/modules/widgets-lab/widget-config.ts
export type Tint = 'blue' | 'green' | 'orange' | 'pink';

export const TINTS: readonly Tint[] = ['blue', 'green', 'orange', 'pink'] as const;

export interface WidgetConfig {
  /** Free-form headline string. Initialised to "Hello, Widget!". */
  showcaseValue: string;
  /** Signed integer; clamped to [-9999, 9999] at the input layer. */
  counter: number;
  /** One of the 4 documented swatches. Default 'blue'. */
  tint: Tint;
}

export const DEFAULT_CONFIG: WidgetConfig = {
  showcaseValue: 'Hello, Widget!',
  counter: 0,
  tint: 'blue',
};
```

```swift
// native/ios/widgets/ShowcaseEntry.swift (excerpt)
enum Tint: String, Codable, CaseIterable {
    case blue, green, orange, pink
}
struct WidgetConfig {
    let showcaseValue: String
    let counter: Int
    let tint: Tint
    static let `default` = WidgetConfig(
        showcaseValue: "Hello, Widget!", counter: 0, tint: .blue
    )
}
```

**Validation rules** (FR-025 / FR-026 / FR-027):
- `showcaseValue`: any string accepted; empty/whitespace handled at the
  input layer per Edge Cases (push button disabled OR pushes default).
  This implementation **disables the push button** when the trimmed value
  is empty, matching the same behaviour in the iOS path and previews.
- `counter`: signed integer; clamped to `[-9999, 9999]` at input. Out-of-
  range JS values pass through `validate()` untouched (preserves legacy
  values written by older app versions, if any).
- `tint`: must be one of `TINTS`; `validate()` falls back to `DEFAULT_CONFIG.tint`.

**Storage keys** (App Group `UserDefaults` suite,
`group.<bundleId>.showcase`):
- `widgetConfig.showcaseValue` — String
- `widgetConfig.counter` — Int
- `widgetConfig.tint` — String (raw value of `Tint` enum)

**JS-side shadow store** (non-iOS-14+ only): `AsyncStorage` key
`widgets-lab:config`, JSON-serialised `WidgetConfig`. Mirrors what the App
Group would hold; not read on iOS.

### `ShowcaseEntry` (Swift, `TimelineEntry`)

```swift
struct ShowcaseEntry: TimelineEntry {
    let date: Date
    let showcaseValue: String
    let counter: Int
    let tint: Tint
}
```

Built by `ShowcaseProvider`:
- `placeholder(in:)` → `ShowcaseEntry(date: .now, ...DEFAULT)`
- `getSnapshot(in:completion:)` → reads App Group; defaults on read failure
- `getTimeline(in:completion:)` → reads App Group; returns `Timeline([entry], policy: .after(now + 30min))`

### `ReloadEvent` (TypeScript, in-memory only)

```ts
export type ReloadEventStatus = 'success' | 'failure';

export interface ReloadEvent {
  /** Stable id (e.g. crypto.randomUUID() or `${ts}-${rand}`). */
  id: string;
  /** ms since epoch; formatted in user locale at render time. */
  timestamp: number;
  status: ReloadEventStatus;
  /** Present iff status === 'failure'. */
  errorMessage?: string;
}
```

State lives in a `useReducer` ring buffer of capacity exactly 10
(FR-036 / SC-004). Reducer actions:
- `{ type: 'push', event: ReloadEvent }` → prepend, drop tail beyond index 9
- `{ type: 'clear' }` → unused in this feature; reserved for future

### `Tint` (TypeScript + Swift)

The four documented swatches. Same names + ordering on both sides
(`blue, green, orange, pink`). See `widget-config.ts` and `ShowcaseEntry.swift`.

Hex map (used by the SwiftUI view + the RN previews + the picker):

| Tint    | Hex       | Source                         |
|---------|-----------|--------------------------------|
| blue    | `#0A84FF` | `Colors.dark.tintA` (theme)    |
| green   | `#30D158` | iOS dark system green          |
| orange  | `#FF9F0A` | `Colors.dark.tintB` (theme)    |
| pink    | `#FF375F` | iOS dark system pink           |

### `WidgetCenterAvailability` (TypeScript)

Pure derived value, computed per render in `screen.tsx`:

```ts
const isAvailable: boolean = bridge.isAvailable();
// === Platform.OS === 'ios' && iosVersion >= 14 && nativeModulePresent
```

Drives whether the iOS-only chrome (status panel "next refresh time" line,
setup instructions card, reload event log) renders, and whether the
"Push to widget" button is enabled (FR-024).

### `ModuleManifest` (existing — `src/modules/types.ts`)

The widget-lab manifest is a normal `ModuleManifest` instance:

```ts
{
  id: 'widgets-lab',
  title: 'Widgets Lab',
  description: 'Ship a real Home Screen widget on iOS 14+; preview-only on Android/Web.',
  icon: { ios: 'square.grid.2x2', fallback: '🟦' },
  platforms: ['ios', 'android', 'web'],
  minIOS: '14.0',
  render: () => <WidgetsLabScreen />,
}
```

## State transitions

### `WidgetConfig` (App Group, iOS 14+)

```
            setConfig(c)
   (empty)  ─────────────►  (showcaseValue, counter, tint persisted)
       ▲                              │
       │                              │ widget extension wakes
       │ (suite never cleared by app) │
       │                              ▼
       │                     getTimeline / getSnapshot reads
       │                              │
       └──────────── on read failure: returns DEFAULT
```

### `ReloadEvent` log (in-memory)

```
   mount: []
     │
     │ user taps Push → setConfig().then(reloadAllTimelines())
     │
     ├── success → push({ id, ts, status:'success' })
     │
     └── failure → push({ id, ts, status:'failure', errorMessage })

   length > 10 → drop tail until length === 10
   unmount: discarded (FR-044 / FR-036)
```

## Cross-target invariants

- The 4 `Tint` enum cases on the Swift side and the 4 `Tint` string-union
  members on the JS side MUST stay in sync. Drift is detected by
  `widget-config.test.ts` (asserts `TINTS.length === 4` and exact members)
  + a hand-review checklist item before any merge that adds a 5th tint.
- The 3 App Group `UserDefaults` keys MUST be the exact strings listed
  above and used by both the Swift module (main app side via
  `SpotWidgetCenter` Expo module) and the widget extension's
  `ShowcaseProvider`. A constant file
  `native/ios/widgets/AppGroupKeys.swift` holds them once and is added to
  both targets' compile sources by the plugin (mirrors how feature 007
  shares `LiveActivityDemoAttributes.swift`).
