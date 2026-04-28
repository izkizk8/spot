# Phase 1 — Data Model: StandBy Mode Showcase Module

This document enumerates the entities the feature introduces, their
shapes, validation rules, defaults, and storage locations. Types are
expressed as TypeScript (TS) and / or Swift where they cross the
JS / native boundary.

## 1. `StandByConfig` (TypeScript)

The in-app draft and persisted shape. Authored by the configuration
panel, written to the App Group on Push, mirrored to AsyncStorage on
non-iOS-17+ platforms for the in-app preview path.

```ts
// src/modules/standby-lab/standby-config.ts
import type { Tint } from '@/modules/widgets-lab/widget-config';

export type RenderingMode = 'fullColor' | 'accented' | 'vibrant';

export interface StandByConfig {
  /** Free-form headline. Defaults to "StandBy" (FR-SB-029). */
  showcaseValue: string;
  /** Signed integer; clamped to [-9999, 9999] at the input layer
   *  (matches 014/027 empty-input policy per spec edge cases). */
  counter: number;
  /** One of the 4 documented swatches (re-imported from 014, NOT
   *  redefined locally per FR-SB-029 + research §5). */
  tint: Tint;
  /** User's preferred rendering-mode treatment for the in-app
   *  preview AND the persisted preference for the on-device
   *  TimelineProvider (FR-SB-013, FR-SB-031, FR-SB-048). */
  mode: RenderingMode;
}
```

### Defaults

```ts
export const DEFAULT_STANDBY_CONFIG: StandByConfig = {
  showcaseValue: 'StandBy',
  counter: 0,
  tint: DEFAULT_TINT,        // re-imported from 014
  mode: 'fullColor',
} as const;
```

| Field | Default | Spec ref |
|-------|---------|----------|
| `showcaseValue` | `'StandBy'` | FR-SB-029 |
| `counter` | `0` | FR-SB-029 |
| `tint` | 014's default tint (re-imported, not redefined) | FR-SB-029 |
| `mode` | `'fullColor'` | FR-SB-029 |

### Validation rules

`validate(input: unknown): StandByConfig` is a pure function that
normalises an unknown payload (e.g. AsyncStorage JSON parse output,
or an App Group read mediated by the bridge) into a valid
`StandByConfig`. It MUST NOT throw. Behaviour:

| Field | Malformed input | Substituted value |
|-------|-----------------|-------------------|
| `showcaseValue` | non-string, `null`, `undefined` | `DEFAULT_STANDBY_CONFIG.showcaseValue` |
| `showcaseValue` | string longer than 64 chars | first 64 chars |
| `counter` | non-number, `NaN`, `±Infinity` | `DEFAULT_STANDBY_CONFIG.counter` |
| `counter` | number outside `[-9999, 9999]` | clamped |
| `tint` | unknown string, `null`, `undefined`, non-string | `DEFAULT_STANDBY_CONFIG.tint` |
| `mode` | not one of `'fullColor' / 'accented' / 'vibrant'`, `null`, `undefined`, non-string | `DEFAULT_STANDBY_CONFIG.mode` |

### State transitions

There is no formal state machine for `StandByConfig`. The lifecycle
is:

```text
mounted
  └─ initialDraft = await loadShadowStandByConfig()  // or DEFAULT
       └─ user edits any field → draft = { ...draft, [field]: value }
            └─ tap "Push to StandBy widget" (iOS 17+ only)
                 ├─ saveShadowStandByConfig(draft)            (always)
                 ├─ bridge.setStandByConfig(draft)            (iOS 17+; throws on other platforms)
                 ├─ bridge.reloadTimelinesByKind('SpotStandByWidget')
                 └─ prepend ReloadLogEntry { status: 'success' | 'failure' }
unmounted
  └─ in-memory ReloadEventLog discarded (FR-SB-033 / FR-SB-050)
```

Edits to the rendering-mode segment update the in-memory draft only;
the App Group is written only on Push (FR-SB-031, US1 AS7).

## 2. `RenderingMode` (TypeScript) ↔ `RenderingMode` (Swift)

A symmetric tri-state enum carrying the user-selected StandBy
rendering treatment. Lives in both layers; the wire format (App
Group `UserDefaults` value) is the lowercase string.

| TS literal | Swift case | App Group value | Smart Stack treatment |
|------------|------------|-----------------|-----------------------|
| `'fullColor'` | `.fullColor` | `"fullColor"` | Saturated colour (the system default) |
| `'accented'` | `.accented` | `"accented"` | Two-layer accented rendering driven by `.widgetAccentable()` annotations |
| `'vibrant'` | `.vibrant` | `"vibrant"` | Translucent / luminance-preserving treatment in night-mode StandBy |

The Swift `RenderingMode` MUST round-trip the TS string via
`UserDefaults.string(forKey:)` and a thin
`init(rawValue: String)` initialiser. Unknown values fall back to
`.fullColor` in Swift (mirroring `validate()` in TS).

## 3. `Tint` (TypeScript & Swift, re-imported from 014)

Same four-swatch enum as 014 / 027, **re-imported, not redefined**
(FR-SB-013 spec assumption + research §5). Listed here for
completeness; authoritative source is 014's `widget-config.ts`
(TS) / 014's `Tint.swift` (Swift, in the widget extension target).

| TS literal | Swift case | Hex (light theme) |
|------------|------------|-------------------|
| `'red'` | `.red` | `#E5484D` (or whatever 014 declared) |
| `'blue'` | `.blue` | `#0090FF` |
| `'green'` | `.green` | `#3DD68C` |
| `'orange'` | `.orange` | `#F76808` |

028 does not modify this enum, does not add new cases, and does not
add new hex values. The `tint` field on `StandByConfig` carries one
of these four labels. Defaults inherit 014's documented default
tint.

## 4. `StandByEntry` (Swift, `TimelineEntry`)

The widget extension's per-entry data structure consumed by both
`.systemMedium` and `.systemLarge` views.

```swift
// native/ios/widgets/standby/StandByEntry.swift
import WidgetKit

@available(iOS 17.0, *)
struct StandByEntry: TimelineEntry {
    let date: Date
    let showcaseValue: String
    let counter: Int
    let tint: Tint            // 014's existing enum, imported
    let mode: RenderingMode   // 028's new enum
}
```

| Field | Type | Source | Notes |
|-------|------|--------|-------|
| `date` | `Date` | `Date()` at provider call time | Required by `TimelineEntry` |
| `showcaseValue` | `String` | `UserDefaults.string(forKey: "spot.widget.standbyConfig.showcaseValue")` | Defaults to `"StandBy"` if missing |
| `counter` | `Int` | `UserDefaults.integer(forKey: "spot.widget.standbyConfig.counter")` | Defaults to `0` (UserDefaults `.integer` returns 0 for missing) |
| `tint` | `Tint` | `UserDefaults.string(forKey: "spot.widget.standbyConfig.tint")` → `Tint(rawValue:)` | Defaults to 014's default tint |
| `mode` | `RenderingMode` | `UserDefaults.string(forKey: "spot.widget.standbyConfig.mode")` → `RenderingMode(rawValue:)` | Defaults to `.fullColor` |

`StandByProvider.placeholder(in:)` MUST return a hardcoded entry
with the documented defaults — it MUST NOT read the App Group, per
FR-SB-010 (the system may render placeholders before the app has
ever run).

## 5. `ReloadLogEntry` (TypeScript, screen-state only)

Per-kind reload event log entry. In-memory ring buffer of capacity
exactly 10 (FR-SB-033). Discarded on screen unmount (FR-SB-050). Not
persisted, not shared with 014/027.

```ts
// internal to src/modules/standby-lab/components/ReloadEventLog.tsx
interface ReloadLogEntry {
  /** Locale-formatted timestamp displayed in the log row. */
  at: Date;
  /** Always the literal string 'SpotStandByWidget' for this module. */
  kind: 'SpotStandByWidget';
  /** Outcome of the bridge call. */
  status: 'success' | 'failure';
  /** Short error message; populated only when status === 'failure'. */
  error?: string;
}
```

State transitions:

```text
empty            ─push success─▶ [E1]
[E1]             ─push success─▶ [E2, E1]
[E1, …, E10]     ─push success─▶ [E11, E1, …, E9]   (E10 evicted; FIFO)
any              ─unmount─────▶  []
```

## 6. App Group `UserDefaults` keys (the wire format)

All four keys live in the same `UserDefaults(suiteName:)` 014 / 027
already use. The suite name is derived at plugin time from
`ios.bundleIdentifier` (014's research §2). 028 does not touch this
derivation.

| Key | Type | Default if missing |
|-----|------|--------------------|
| `spot.widget.standbyConfig.showcaseValue` | `String` | `"StandBy"` |
| `spot.widget.standbyConfig.counter` | `Int` | `0` |
| `spot.widget.standbyConfig.tint` | `String` (raw `Tint` value) | 014's default tint label |
| `spot.widget.standbyConfig.mode` | `String` (raw `RenderingMode` value) | `"fullColor"` |

The four keys are read together by `StandByProvider.getSnapshot` and
`StandByProvider.getTimeline` to assemble a `StandByEntry`. They are
written together by `setStandByConfig` (the bridge writes all four
in a single `UserDefaults` transaction).

**Disjoint from 014 / 027**: 014 uses `spot.widget.config.*`; 027
uses `spot.widget.lockConfig.*`. The three namespaces share no keys
and no prefix beyond `spot.widget.`. Reading one namespace via
`UserDefaults.string(forKey:)` MUST NOT return a value from another.

## 7. AsyncStorage shadow key (the cross-platform fallback)

```ts
export const SHADOW_STORE_KEY = 'spot.widget.standbyConfig' as const;
```

The shadow store holds the JSON-serialised `StandByConfig` object as
a single string value. On Android / Web / iOS < 17 the configuration
panel reads from and writes to this key (so the live preview is
preserved across screen mounts), but never invokes the bridge.

| Operation | Behaviour |
|-----------|-----------|
| `loadShadowStandByConfig()` | `AsyncStorage.getItem(SHADOW_STORE_KEY)` → `JSON.parse` → `validate` → `StandByConfig`. Returns `DEFAULT_STANDBY_CONFIG` on missing key, parse error, or any AsyncStorage error. MUST NOT throw. |
| `saveShadowStandByConfig(config)` | `AsyncStorage.setItem(SHADOW_STORE_KEY, JSON.stringify(config))`. Silently swallows AsyncStorage errors (the preview path is non-blocking). MUST NOT throw. |

The shadow store key `'spot.widget.standbyConfig'` is **disjoint
from** 014's `'widgets-lab:config'` and 027's
`'spot.widget.lockConfig'`.

## 8. Registry entry (TypeScript, FR-SB-001)

```ts
// src/modules/standby-lab/index.tsx
import type { ModuleManifest } from '@/modules/types';

const manifest: ModuleManifest = {
  id: 'standby-lab',
  title: 'StandBy Mode',
  platforms: ['ios', 'android', 'web'],
  minIOS: '17.0',
  description: 'iOS 17+ StandBy widget rendering modes — see widgets render in fullColor / accented / vibrant on a charging iPhone in landscape.',
  icon: { ios: 'powersleep', fallback: '🌙' },
  render: () => <StandByModeScreen />,
};

export default manifest;
```

## 9. Module file inventory (recap)

See plan.md "Project Structure" §"Source Code (repository root)" for
the full enumeration. The data-model-relevant files are:

| File | Owns |
|------|------|
| `src/modules/standby-lab/standby-config.ts` | `StandByConfig`, `RenderingMode`, `DEFAULT_STANDBY_CONFIG`, `validate`, `loadShadowStandByConfig`, `saveShadowStandByConfig`, `SHADOW_STORE_KEY` |
| `src/native/widget-center.types.ts` | `WidgetCenterBridge` interface extension (adds `setStandByConfig` / `getStandByConfig`); re-exports `StandByConfig` for ergonomic import from the bridge module |
| `native/ios/widgets/standby/StandByEntry.swift` | Swift `StandByEntry` `TimelineEntry` |
| `native/ios/widgets/standby/StandByProvider.swift` | Swift `StandByProvider`; reads the four App Group keys |
