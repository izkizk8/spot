# Implementation Plan: Core Location Lab Module

**Branch**: `025-core-location` | **Date**: 2026-04-29 | **Spec**: [spec.md](./spec.md)

## Summary

Ship `core-location-lab` (id `core-location-lab`, label `"Core Location"`,
`platforms: ['ios','android','web']`, `minIOS: '8.0'`) as a single-line
addition to `src/modules/registry.ts` and the `app.json` `plugins` array.
The module showcases Apple's **Core Location** framework via
`expo-location` (already present from feature 024) plus
`expo-task-manager` (added via `npx expo install`) for the geofencing
callback. It demonstrates surfaces 024's MapKit Lab did not touch:
permission escalation (when-in-use → always), continuous location
updates with desired-accuracy and distance-filter controls, region
monitoring (geofences), magnetic-north heading, and significant
location changes. Beacon ranging is explicitly out of scope.

The single screen is composed of five collapsible cards
(Permissions, Live updates, Region monitoring, Heading, Significant
changes). Region monitoring is iOS-only; on Android and web that one
card renders an `IOSOnlyBanner`. All other cards function on all
three platforms via `expo-location`'s cross-platform surfaces.

A new Expo config plugin `plugins/with-core-location/` idempotently
adds `NSLocationWhenInUseUsageDescription`,
`NSLocationAlwaysAndWhenInUseUsageDescription`, and `"location"` to
`UIBackgroundModes` in the iOS Info.plist. It coexists with all 11
prior plugins (010 → 024) including 024's `with-mapkit` without
modifying any of them.

The integration surface is exactly:

- `src/modules/registry.ts` — +1 import + 1 array entry (+2 lines)
- `app.json` `plugins` — +1 entry (`./plugins/with-core-location`)
- `package.json` / `pnpm-lock.yaml` — +1 dep (`expo-task-manager` via
  `npx expo install`); `expo-location` is reused from 024
- `test/setup.ts` — +1 mock entry for `expo-task-manager` (next to
  the existing `expo-location` line; do **not** replace
  `expo-modules-core` — see 024's pattern at `test/setup.ts:84-122`)

No existing module file, plugin file, screen, registry entry,
component, or `app.json` plugin is modified. 024's MapKit Lab
continues to work unchanged.

## Technical Context

- **Language**: TypeScript 5.9 strict (no Swift bridges this feature
  — every Core Location surface needed is already exposed by
  `expo-location`).
- **Runtime**: React 19.2 (React Compiler enabled), React Native
  0.83.6, Expo SDK ~55.0.17, expo-router (typed routes),
  `react-native-reanimated` Keyframe API + `react-native-worklets`.
- **Existing dependency reused (added by 024)**: `expo-location`.
  No version bump.
- **New dependency (pinned by `npx expo install` against SDK 55)**:
  - `expo-task-manager` — current SDK 55 selection (expected
    `~13.x.x`; actual version is whatever `npx expo install`
    resolves and writes to `package.json` / `pnpm-lock.yaml`; the
    plan does not pre-pin a floating range). Installed with
    `npx expo install expo-task-manager` so the resolver picks the
    SDK-aligned version and lockfile churn is one commit.
- **Reused in-tree component**: `CompassNeedle` from feature 011
  (sensors playground) at
  `src/modules/sensors-playground/components/CompassNeedle.tsx`.
  Imported as-is; accepts a heading-degrees prop. **Feature 011 is
  not modified.**
- **State / data shapes**: defined in §"Data & Hook Contracts"
  below. No external storage; everything is in-memory and bounded
  (region/significant-change event logs FIFO-evicted at 100
  entries, per spec assumptions).
- **Test stack**: jest-expo + RNTL, JS-pure. Reuses the existing
  `test/__mocks__/expo-location.ts` from 024. Adds one new mock
  `test/__mocks__/expo-task-manager.ts` wired through
  `test/setup.ts` next to the existing `expo-location` line. **Do
  not replace `expo-modules-core` globally** (see comment at
  `test/setup.ts:87-90`); mock at the import boundary instead.
- **No `eslint-disable` directives for unregistered rules.**
- **`pnpm format` is run before commit.**
- **Build Validation (Constitution v1.1.0 §Validate-Before-Spec)**:
  this feature does not introduce a new build pipeline or change
  any prebuild/EAS configuration beyond a single Info.plist
  delta and one background-mode entry. The plugin idempotency is
  validated by unit test (Phase 1 contract) rather than by a real
  prebuild, matching the precedent set by 023 / 024. A real
  `npx expo prebuild` is run once during implementation as a smoke
  check (SC-005) but is not a gate on the plan.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Walked principle-by-principle against constitution v1.1.0
(`.specify/memory/constitution.md`):

- **I. Cross-Platform Parity** ✅ — Three screen variants
  (`screen.tsx` / `screen.android.tsx` / `screen.web.tsx`). The core
  user journey (grant permission → see a live location readout) works
  identically on iOS, Android, and web via `expo-location`'s
  cross-platform surfaces. Region monitoring is the one
  iOS-only carve-out, explicitly permitted by Principle I as a
  "platform-specific behavior that improves UX on that platform";
  Android/web render `IOSOnlyBanner` in that card so the screen does
  not crash and the absence is documented in-app.
- **II. Token-Based Theming** ✅ — All new components use
  `ThemedText` / `ThemedView` from `src/components/themed-*` and the
  `Spacing` scale from `src/constants/theme.ts`. Colors resolve via
  `useTheme()`. No hex literals. Verified by component tests (no
  hex assertions; grep-checked during cleanup).
- **III. Platform File Splitting** ✅ —
  `screen.tsx` / `screen.android.tsx` / `screen.web.tsx` for the
  one place platform behavior diverges materially (region monitoring
  renders controls on iOS and `IOSOnlyBanner` on Android/web). Hooks
  use `Platform.OS === 'ios'` only as a single-expression guard
  inside `useRegionMonitoring` to early-return on non-iOS — that is
  permitted by Principle III ("inline `Platform.select()` is
  acceptable only for single-value differences").
- **IV. StyleSheet Discipline** ✅ — Every component declares its
  styles via `StyleSheet.create()`. No CSS-in-JS, no inline style
  objects defined outside `StyleSheet`, no utility-class framework.
  Spacing values from the `Spacing` scale.
- **V. Test-First for New Features** ✅ — Comprehensive UT scope
  covers every constant table, hook, component, screen variant,
  plugin, and the manifest. Tests are written alongside or before
  implementation. See §"Test Strategy" below for the full file list.
- **Technology Constraints** ✅ — TypeScript 5.9 strict; no new
  Animated-API usage; no new `Image` usage (no images in this
  feature); pnpm with `nodeLinker: hoisted`; React Compiler
  enabled; path aliases `@/*` and `@/assets/*` respected.
- **Development Workflow** ✅ — SDD lifecycle followed
  (specify → plan → tasks → implement). Constitution Check passes
  (this section). Validate-Before-Spec satisfied: this is not a
  build-pipeline feature; the one plugin change is unit-tested for
  idempotency.

**Result: PASS — no violations to justify.** §"Complexity Tracking"
remains empty.

## Project Structure

### Documentation (this feature)

```text
specs/025-core-location/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (deferred — no NEEDS CLARIFICATION)
├── data-model.md        # Phase 1 output (entities defined inline below)
├── quickstart.md        # Phase 1 output (deferred to /speckit.tasks if needed)
├── contracts/           # Phase 1 output (hook/plugin contracts inline below)
└── tasks.md             # Phase 2 output (/speckit.tasks — NOT created here)
```

> **Note on Phase 0 / Phase 1 artifacts.** The spec contains no
> `NEEDS CLARIFICATION` markers and the dependency / API choices are
> fully resolved (reuse 024's `expo-location` + add
> `expo-task-manager`; reuse 011's `CompassNeedle`). Rather than emit
> stub `research.md` / `data-model.md` / `quickstart.md` /
> `contracts/` files, this plan inlines the equivalent content
> below (Architecture, Data & Hook Contracts, Plugin Contract,
> Test Strategy). `/speckit.tasks` may extract these into separate
> files if it benefits the task generation; this plan does not
> require them.

### Source Code (repository root)

```text
src/modules/core-location-lab/
  index.tsx                   ModuleManifest (id 'core-location-lab',
                              label 'Core Location', icon
                              'location.fill', platforms
                              ['ios','android','web'], minIOS '8.0')
  screen.tsx                  iOS screen — composes 5 collapsible
                              cards (PermissionsCard, LiveUpdatesCard,
                              RegionMonitoringCard, HeadingCard,
                              SignificantChangesCard)
  screen.android.tsx          Android — same shell; RegionMonitoringCard
                              slot replaced by <IOSOnlyBanner
                              reason="region-monitoring" />
  screen.web.tsx              Web — same shell; RegionMonitoringCard
                              slot replaced by <IOSOnlyBanner
                              reason="region-monitoring" />; significant-
                              change toggle is inert (warning copy)
  geofence-task.ts            TaskManager.defineTask handler for the
                              GEOFENCE_TASK_NAME task; appends events
                              to the in-memory event store
  accuracy-presets.ts         Constant table mapping the 4 labels
                              ('Best', 'Best for navigation',
                              'Hundred meters', 'Kilometer') to
                              expo-location LocationAccuracy enum
                              values
  distance-filters.ts         Constant table for the 3 distance
                              filters (5, 50, 500 meters)
  hooks/
    useLocationUpdates.ts     Start/Stop subscription; restarts on
                              accuracy/distance-filter change;
                              maintains a rolling 60s window for the
                              samples-per-minute stat; mountedRef
                              guards setState after unmount
                              (021/022/023 pattern)
    useHeading.ts             Subscribes to watchHeadingAsync;
                              exposes current heading + calibration
                              flag; cleans up on unmount
    useRegionMonitoring.ts    iOS-only (single-expression
                              Platform.OS guard); wraps
                              startGeofencingAsync /
                              stopGeofencingAsync; exposes regions
                              list, addRegion(radius), removeRegion,
                              and event log
  components/
    PermissionsCard.tsx       Status pill + Request button +
                              Open Settings link (iOS deep link
                              via Linking.openSettings)
    LiveUpdatesCard.tsx       Start/Stop toggle + accuracy selector
                              + distance-filter selector + readout
    LocationReadout.tsx       Pure presentational — renders lat,
                              lng, alt, accuracy, speed, heading,
                              samples/min
    RegionMonitoringCard.tsx  Add at current location button +
                              radius selector + RegionRow list +
                              EventLog (iOS only — wrapper renders
                              IOSOnlyBanner on Android/web; that
                              substitution is done by the screen
                              variant, not inside this component)
    RegionRow.tsx             Single row: id, radius, state pill
    HeadingCard.tsx           Reuses CompassNeedle from 011 +
                              calibration banner
    SignificantChangesCard.tsx Toggle + explanatory copy + EventLog
    EventLog.tsx              Generic FIFO log renderer (capped at
                              100 entries); used by both
                              RegionMonitoringCard and
                              SignificantChangesCard
    IOSOnlyBanner.tsx         Banner with per-reason copy; reused on
                              Android and web for the
                              RegionMonitoringCard slot

plugins/with-core-location/
  index.ts                    withInfoPlist + withInfoPlist (chained);
                              idempotently sets the two usage-
                              description keys and appends 'location'
                              to UIBackgroundModes
  index.test.ts               idempotency + coexistence with 024's
                              with-mapkit + 11-plugin total
                              coexistence
  package.json                { name, version, main, types }

test/__mocks__/
  expo-task-manager.ts        (new) defineTask, isTaskRegisteredAsync,
                              getRegisteredTasksAsync — programmable
                              per test; exposes
                              __triggerGeofenceEvent(regionId, eventType)
                              for handler tests

test/unit/modules/core-location-lab/
  manifest.test.ts
  accuracy-presets.test.ts
  distance-filters.test.ts
  geofence-task.test.ts
  hooks/
    useLocationUpdates.test.tsx
    useHeading.test.tsx
    useRegionMonitoring.test.tsx
  components/
    PermissionsCard.test.tsx
    LiveUpdatesCard.test.tsx
    LocationReadout.test.tsx
    RegionMonitoringCard.test.tsx
    RegionRow.test.tsx
    HeadingCard.test.tsx
    SignificantChangesCard.test.tsx
    EventLog.test.tsx
    IOSOnlyBanner.test.tsx
  screen.test.tsx
  screen.android.test.tsx
  screen.web.test.tsx

test/unit/plugins/with-core-location/
  index.test.ts               idempotency + coexistence with
                              with-mapkit + 12-in-tree-plugin total
```

**Structure Decision**: Single-project Expo app layout (matches every
prior module under `src/modules/<feature>/`). Each module owns its
manifest, screens, components, hooks, and constants. Tests mirror
the source tree under `test/unit/`. Plugins live under `plugins/`
with a sibling test under `test/unit/plugins/`.

## Architecture

### Data & Hook Contracts

#### Constant tables

```ts
// accuracy-presets.ts
import * as Location from 'expo-location';

export type AccuracyPresetLabel =
  | 'Best'
  | 'Best for navigation'
  | 'Hundred meters'
  | 'Kilometer';

export interface AccuracyPreset {
  label: AccuracyPresetLabel;
  value: Location.LocationAccuracy;
}

export const ACCURACY_PRESETS: readonly AccuracyPreset[] = [
  { label: 'Best',                value: Location.LocationAccuracy.Best },
  { label: 'Best for navigation', value: Location.LocationAccuracy.BestForNavigation },
  { label: 'Hundred meters',      value: Location.LocationAccuracy.Hundred },
  { label: 'Kilometer',           value: Location.LocationAccuracy.Lowest },
];

export const DEFAULT_ACCURACY_PRESET: AccuracyPreset = ACCURACY_PRESETS[0];
```

```ts
// distance-filters.ts
export type DistanceFilterMeters = 5 | 50 | 500;

export interface DistanceFilter {
  label: string;          // e.g. '5 m'
  meters: DistanceFilterMeters;
}

export const DISTANCE_FILTERS: readonly DistanceFilter[] = [
  { label: '5 m',   meters: 5 },
  { label: '50 m',  meters: 50 },
  { label: '500 m', meters: 500 },
];

export const DEFAULT_DISTANCE_FILTER: DistanceFilter = DISTANCE_FILTERS[0];
```

#### Entities (in-memory only — no persistence)

```ts
export type RegionRadiusMeters = 50 | 100 | 500;

export interface MonitoredRegion {
  id: string;            // generated: `region-${Date.now()}-${counter}`
  latitude: number;
  longitude: number;
  radius: RegionRadiusMeters;
  state: 'inside' | 'outside' | 'unknown';
}

export interface RegionEvent {
  id: string;            // generated: `revt-${Date.now()}-${counter}`
  regionId: string;
  type: 'enter' | 'exit';
  timestamp: Date;
}

export interface LocationSample {
  latitude: number;
  longitude: number;
  altitude: number | null;
  accuracy: number | null;
  speed: number | null;
  heading: number | null;
  timestamp: Date;
}

export interface HeadingSample {
  headingMagneticNorth: number;
  accuracy: number;       // expo-location reports 0..3 (0 = uncalibrated)
  timestamp: Date;
}

export interface SignificantChangeEvent {
  id: string;            // generated: `sce-${Date.now()}-${counter}`
  latitude: number;
  longitude: number;
  timestamp: Date;
}
```

Event logs (`RegionEvent[]` and `SignificantChangeEvent[]`) are
FIFO-capped at 100 entries each (spec Assumption: "in-memory logs
… capped at a reasonable size … with FIFO eviction").

#### `useLocationUpdates`

```ts
export interface UseLocationUpdates {
  isRunning: boolean;
  latest: LocationSample | null;
  samplesPerMinute: number;     // computed from trailing 60s window
  start(): Promise<void>;
  stop(): Promise<void>;
  setAccuracy(preset: AccuracyPreset): void;
  setDistanceFilter(filter: DistanceFilter): void;
  error: Error | null;
}
```

Lifecycle:

1. **start()** — calls `Location.watchPositionAsync({ accuracy:
   preset.value, distanceInterval: filter.meters })`; stores the
   returned subscription on a ref; sets `isRunning = true`. Each
   callback pushes a `LocationSample` into a trailing 60s window
   (FIFO by timestamp) and updates `latest`. The
   `samplesPerMinute` selector returns
   `window.filter(s => now - s.timestamp <= 60_000).length`.
2. **stop()** — `subRef.current?.remove(); subRef.current = null;
   isRunning = false`. Window is preserved (so the user can read the
   last value).
3. **setAccuracy / setDistanceFilter** — when `isRunning`, calls
   `subRef.current?.remove()` and re-invokes `start()` with the new
   settings (FR-007: "MUST restart the subscription with the new
   settings; the user MUST NOT be required to tap Stop and Start").
   When not running, the change is staged and applied on the next
   `start()`.
4. **Unmount** — effect cleanup calls `subRef.current?.remove()`;
   `mountedRef` guards `setState` calls after unmount (021/022/023
   pattern).
5. **Errors** — any throw from `watchPositionAsync` or its callback
   is captured into `error`; `isRunning` is set false; the
   subscription is torn down.

#### `useHeading`

```ts
export interface UseHeading {
  isRunning: boolean;
  latest: HeadingSample | null;
  isCalibrated: boolean;       // false when latest.accuracy === 0
  start(): Promise<void>;
  stop(): Promise<void>;
  error: Error | null;
}
```

Lifecycle: identical to `useLocationUpdates` but backed by
`Location.watchHeadingAsync(callback)`. `isCalibrated` is derived
from `latest?.accuracy` (expo-location convention: 0 = uncalibrated,
1–3 = calibrated to varying degrees). Unmount tears down the
subscription via `subRef.current?.remove()`.

#### `useRegionMonitoring` (iOS-only)

```ts
export interface UseRegionMonitoring {
  regions: ReadonlyArray<MonitoredRegion>;
  events: ReadonlyArray<RegionEvent>;       // newest first, capped 100
  addRegion(args: {
    latitude: number; longitude: number; radius: RegionRadiusMeters;
  }): Promise<void>;
  removeRegion(id: string): Promise<void>;
  error: Error | null;
}
```

Lifecycle:

1. On non-iOS (`Platform.OS !== 'ios'`), the hook returns a stable
   no-op shape with empty arrays and `addRegion` / `removeRegion`
   that throw `new Error('Region monitoring is iOS-only')`. Components
   never call these on Android/web because the screen variants
   replace `RegionMonitoringCard` with `IOSOnlyBanner` — the throw is
   defense-in-depth.
2. **addRegion()** — generates a `region.id`, appends to local
   `regions` state (state `'unknown'`), and calls
   `Location.startGeofencingAsync(GEOFENCE_TASK_NAME, regionsForExpo)`
   where `regionsForExpo` is the full current list mapped to
   expo-location's region shape (`{ identifier, latitude, longitude,
   radius, notifyOnEnter: true, notifyOnExit: true }`). Errors
   (e.g., the iOS 20-region quota — spec edge case) are captured
   into `error`; the optimistic append is rolled back.
3. **removeRegion()** — drops the id from local state and re-invokes
   `startGeofencingAsync` with the reduced list (or
   `stopGeofencingAsync(GEOFENCE_TASK_NAME)` when the list is empty).
4. **Event ingestion** — `geofence-task.ts` (see below) writes
   incoming enter/exit events into a module-scoped event store
   (`globalThis.__coreLocationGeofenceStore`). The hook subscribes
   to this store on mount via a tiny pub/sub and updates `regions[i]
   .state` and `events` accordingly.
5. **Unmount** — unsubscribes from the store; does **not** call
   `stopGeofencingAsync` (regions persist for the lifetime of the
   process, matching iOS semantics — but they do not survive app
   restart because we never persist the list to disk; the spec
   says "in-memory only; not persisted across launches").

### `geofence-task.ts`

```ts
import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';

export const GEOFENCE_TASK_NAME = 'spot.core-location-lab.geofence';

interface GeofenceTaskBody {
  data: {
    eventType: Location.GeofencingEventType;   // 1 = Enter, 2 = Exit
    region: Location.LocationRegion;
  };
  error: { code?: string; message: string } | null;
}

TaskManager.defineTask(GEOFENCE_TASK_NAME, ({ data, error }: GeofenceTaskBody) => {
  if (error) {
    // surface to a module-scoped error sink consumed by the hook
    return;
  }
  const { eventType, region } = data;
  const type = eventType === Location.GeofencingEventType.Enter ? 'enter' : 'exit';
  // Append to the module-scoped event store (FIFO cap 100).
  // Idempotent: a duplicate { regionId, type, timestamp-bucket } is
  // collapsed to a single entry.
  appendGeofenceEvent({ regionId: region.identifier, type, timestamp: new Date() });
});
```

`appendGeofenceEvent` is a small in-tree helper (`event-store.ts`
inside the module) that owns the FIFO + idempotency. It is exported
for the hook's pub/sub and for the unit test to read.

### Plugin Contract — `with-core-location`

```ts
import type { ConfigPlugin } from '@expo/config-plugins';
import { withInfoPlist } from '@expo/config-plugins';

const WHEN_IN_USE_KEY = 'NSLocationWhenInUseUsageDescription';
const WHEN_IN_USE_COPY =
  'Spot uses your location to show live updates, geofences, and a ' +
  'compass in the Core Location Lab.';

const ALWAYS_KEY = 'NSLocationAlwaysAndWhenInUseUsageDescription';
const ALWAYS_COPY =
  'Spot uses your location in the background to deliver geofence ' +
  'crossings and significant location changes when the app is not in ' +
  'the foreground.';

const BACKGROUND_MODE = 'location';

const withCoreLocation: ConfigPlugin = (config) => {
  return withInfoPlist(config, (mod) => {
    if (mod.modResults[WHEN_IN_USE_KEY] !== WHEN_IN_USE_COPY) {
      mod.modResults[WHEN_IN_USE_KEY] = WHEN_IN_USE_COPY;
    }
    if (mod.modResults[ALWAYS_KEY] !== ALWAYS_COPY) {
      mod.modResults[ALWAYS_KEY] = ALWAYS_COPY;
    }
    const modes = (mod.modResults.UIBackgroundModes as string[] | undefined) ?? [];
    if (!modes.includes(BACKGROUND_MODE)) {
      mod.modResults.UIBackgroundModes = [...modes, BACKGROUND_MODE];
    }
    return mod;
  });
};

export default withCoreLocation;
```

Properties (FR-003):

- Touches **only** the two usage-description keys and
  `UIBackgroundModes`. Never reads or writes any other Info.plist
  key, no entitlements, no capabilities, no build settings.
- Idempotent: re-running on a config that already contains the
  identical copy and the `'location'` mode is a literal no-op (the
  inequality and `includes` guards prevent unnecessary writes);
  re-running on a config with a different prior value overwrites
  it once and is then idempotent.
- Coexists with all 11 prior plugins including 024's `with-mapkit`
  (which sets `NSLocationWhenInUseUsageDescription` to its own
  copy). Insertion order in `app.json` puts `with-core-location`
  **after** `with-mapkit`, so this feature's copy is the one that
  ships. The plugin test asserts both that `with-mapkit` still loads
  without error and that the final Info.plist has this feature's
  usage-description copy as the winner.

### Registry Update — Exact Location

Adding `core-location-lab` to `src/modules/registry.ts` is two lines:

- **Import** — append after the `mapkitLab` import:
  ```ts
  import coreLocationLab from './core-location-lab';
  ```
- **Array entry** — append inside `MODULES` after `mapkitLab,` and
  before the trailing comment:
  ```ts
  export const MODULES: readonly ModuleManifest[] = [
    // ... 19 prior entries ...
    mapkitLab,
    coreLocationLab,
    // ↑ Append new manifests here in the order they should appear.
  ];
  ```

No other line in `registry.ts` is edited. The diff against the
024-merged main is exactly +2 lines.
`test/unit/modules/registry.test.ts` already enforces "unique
kebab-case ids", so no test changes are required there;
`core-location-lab/manifest.test.ts` covers the new manifest shape.

### `app.json` Update — Exact Change

Append `"./plugins/with-core-location"` to the `plugins` array.
Insertion position: after `"./plugins/with-mapkit"` and before the
inline `"expo-sensors"` configured-array entry, preserving the
convention that the only inline configured array sits at the array
tail:

```jsonc
"plugins": [
  "expo-router",
  ["expo-splash-screen", { ... }],
  "expo-image",
  "./plugins/with-live-activity",
  "./plugins/with-app-intents",
  "./plugins/with-home-widgets",
  "./plugins/with-screentime",
  "./plugins/with-coreml",
  "./plugins/with-vision",
  "./plugins/with-speech-recognition",
  "./plugins/with-audio-recording",
  "./plugins/with-sign-in-with-apple",
  "./plugins/with-local-auth",
  "./plugins/with-keychain-services",
  "./plugins/with-mapkit",
  "./plugins/with-core-location",
  ["expo-sensors", { "motionPermission": "..." }]
]
```

The total count after the change is **17** array entries (3
baseline Expo plugins + 12 in-tree `./plugins/*` + 1 inline-
configured `expo-sensors` array). The plugin test asserts on the
in-tree custom count to avoid coupling to bare-string Expo plugins.

## Test Strategy

All tests are JS-pure (jest-expo + RNTL). No native runtime is
exercised. Reuses the global `expo-location` mock from 024 and adds
one new global mock for `expo-task-manager`.

### `manifest.test.ts`
- `id === 'core-location-lab'` (kebab-case, unique within `MODULES`).
- `label === 'Core Location'`.
- `platforms === ['ios','android','web']`.
- `minIOS === '8.0'`.
- `screen` is a function / component reference.

### `accuracy-presets.test.ts`
- 4 entries; `label`s are the 4 documented strings.
- Each `value` is a member of `Location.LocationAccuracy`.
- `DEFAULT_ACCURACY_PRESET === ACCURACY_PRESETS[0]`
  (label `'Best'`).
- Labels are unique.

### `distance-filters.test.ts`
- 3 entries; `meters` ∈ `{5, 50, 500}` and exactly those three.
- Labels include the meter count and a unit suffix.
- `DEFAULT_DISTANCE_FILTER === DISTANCE_FILTERS[0]`.

### `geofence-task.test.ts`
- The handler records an event with `regionId === region.identifier`,
  `type === 'enter'` for `eventType === Enter` and `'exit'` for
  `Exit`, and a `timestamp` instance of `Date`.
- The handler is idempotent: invoking it twice with the same
  `(regionId, type, timestamp-bucket)` produces only one entry in
  the store.
- `error !== null` short-circuits without writing an event.
- Reaching 101 events FIFO-evicts the oldest.

### Hook tests
All three hook tests cover the same five behaviors required by the
prompt: **start subscribes**, **stop unsubscribes**, **samples
populate state**, **error path**, and **unmount cleanup**.

- **`useLocationUpdates.test.tsx`** —
  - `start()` calls `Location.watchPositionAsync` with the current
    accuracy/distance settings; flips `isRunning = true`.
  - The mocked subscription's callback pushes a `LocationSample`;
    `latest` reflects the most recent push.
  - `samplesPerMinute` rises after multiple pushes within 60s; old
    samples are excluded after the window slides past them
    (driven by `jest.useFakeTimers()`).
  - `setAccuracy` / `setDistanceFilter` while running call
    `subscription.remove()` and re-invoke `watchPositionAsync` with
    the new args (FR-007).
  - `stop()` calls `subscription.remove()`; `isRunning = false`.
  - A throw from `watchPositionAsync` populates `error` and leaves
    `isRunning === false`.
  - Unmount calls `subscription.remove()` and does not warn about
    `setState` after unmount (mountedRef guard).

- **`useHeading.test.tsx`** — same five behaviors against
  `Location.watchHeadingAsync`. Adds:
  - `isCalibrated` is `false` when the latest sample's `accuracy` is
    `0`, `true` for `1`/`2`/`3`.

- **`useRegionMonitoring.test.tsx`** — same five behaviors against
  `Location.startGeofencingAsync` / `stopGeofencingAsync`. Adds:
  - On non-iOS (`Platform.OS = 'android'` via jest mock), `regions`
    is empty, `events` is empty, and `addRegion` rejects with
    `'Region monitoring is iOS-only'`.
  - `addRegion` appends to `regions` (state `'unknown'`) and calls
    `startGeofencingAsync` with the full list mapped to
    expo-location's shape; quota error rolls the optimistic append
    back and populates `error`.
  - `removeRegion(id)` drops the id and re-invokes
    `startGeofencingAsync`; reaching empty calls
    `stopGeofencingAsync`.
  - When the geofence event store fires
    `{ regionId, type: 'enter' }`, the matching region's `state`
    becomes `'inside'` and an event is appended to `events`.

### Component tests (one file each — 9 total)

- **`PermissionsCard`** — status pill renders the current status
  string for all 4 statuses; Request button calls `onRequest` and is
  disabled when status is `'denied'`; Open Settings link calls
  `Linking.openSettings()` (mocked).
- **`LiveUpdatesCard`** — Start/Stop toggle invokes the hook's
  `start` / `stop`; accuracy selector renders 4 segments, taps call
  `setAccuracy` with the matching preset; distance selector renders
  3 segments, taps call `setDistanceFilter`; readout reflects the
  hook's `latest` and `samplesPerMinute`.
- **`LocationReadout`** — pure render of all six fields; null/none
  values render as the documented placeholder (e.g., `'—'`); given
  a `samplesPerMinute` of N, the row "Samples / min: N" is present.
- **`RegionMonitoringCard`** — radius selector renders 3 segments
  (50 / 100 / 500); Add button is disabled when no fix is provided
  via prop and calls `onAddRegion(radius)` otherwise; renders a
  `RegionRow` per region; renders the events log via `EventLog`.
- **`RegionRow`** — renders id, radius, and a state pill that varies
  by `state`.
- **`HeadingCard`** — renders `CompassNeedle` (mocked at the import
  boundary to a `View testID="compass-needle"` to keep the test
  pure) with the `headingMagneticNorth` prop wired from the hook;
  calibration banner appears when `isCalibrated === false`; absent
  when `true`; "Heading not available" copy renders when
  `error !== null` (edge case).
- **`SignificantChangesCard`** — toggle calls subscribe/unsubscribe;
  events list renders via `EventLog`; explanatory copy is present
  in the DOM regardless of toggle state.
- **`EventLog`** — given `entries`, renders one row per entry with
  the rendered timestamp; given empty `entries`, renders the
  empty-state copy; given >100 entries (defensive), renders the
  most-recent 100.
- **`IOSOnlyBanner`** — renders per-`reason` copy
  (`'region-monitoring'` for this feature); reused on Android and web
  for the Region monitoring slot.

### Screen variants (3 total)

- **`screen.test.tsx`** (iOS) — mounts; all 5 cards are present;
  expanding/collapsing each card preserves state across other
  cards' toggles; `RegionMonitoringCard` renders (not the banner).
- **`screen.android.test.tsx`** — 4 functional cards plus the
  `IOSOnlyBanner` in place of `RegionMonitoringCard`; no
  geofencing API call is made.
- **`screen.web.test.tsx`** — same as Android plus the Significant
  changes toggle is inert (no subscribe call) and shows a "Coarse
  on web" note; no native bridge is invoked.

### Plugin test
- **`with-core-location/index.test.ts`** —
  1. **Adds both keys with documented copy and `'location'` mode
     when absent.**
  2. **Overwrites stale usage-description copy** without throwing.
  3. **Idempotent**: running twice produces the same Info.plist
     (keys still present, `UIBackgroundModes` contains `'location'`
     exactly once).
  4. **Coexists with `with-mapkit`**: folding `withMapKit` then
     `withCoreLocation` over a baseline config produces an
     Info.plist where `NSLocationWhenInUseUsageDescription` ends
     equal to **this feature's** copy (FR: insertion order makes
     core-location the winner) and `UIBackgroundModes` contains
     `'location'` exactly once.
  5. **12-in-tree-plugin coexistence smoke**: read
     `app.json`'s `plugins` array post-implementation; assert the
     count of `./plugins/with-*` entries is 12, that
     `'./plugins/with-core-location'` immediately follows
     `'./plugins/with-mapkit'`, and that the inline `'expo-sensors'`
     entry remains the last array element.
  6. **Mod-chain runs without throwing**: import every plugin
     default export from `plugins/with-*/index.ts` (12 total) and
     fold them over a baseline `ExpoConfig`; assert no throw and
     that both Core Location keys plus the `'location'` background
     mode are set.
  7. **Emits no warnings on a baseline config**: spy on
     `console.warn`; assert call count is 0.

### Mocks

- **Reuses** `test/__mocks__/expo-location.ts` from 024.
  Programmatically extended (no edits — the mock already exposes
  `__setLocationMock`) with new fields:
  `__setWatchPositionMock(callback => Subscription)`,
  `__setWatchHeadingMock(callback => Subscription)`,
  `__setGeofencingMock({ throwOnStart })`. These extensions are
  added to the existing mock file; consumers in 024 are unaffected
  because they continue to set only the fields they previously set.
- **New** `test/__mocks__/expo-task-manager.ts` — exposes
  `defineTask(name, handler)` (records into a module-scoped map),
  `isTaskRegisteredAsync(name)`, `getRegisteredTasksAsync()`, plus
  test-only helpers `__triggerGeofenceEvent(name, { eventType,
  region })` and `__resetTaskManagerMock()`. Wired through
  `test/setup.ts` next to the existing `expo-location` mock entry,
  using the same `jest.mock(..., () => jest.requireActual(...))`
  pattern. **Does not replace `expo-modules-core`** (see
  `test/setup.ts:87-90` comment for the reasoning from 024).

## Constitution Compliance (v1.1.0)

Re-checked post-design — see §"Constitution Check" above.
**Result: PASS, no new violations introduced by the design.**

## Complexity Tracking

> No Constitution Check violations to justify. Section intentionally empty.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| _(none)_  | _(n/a)_    | _(n/a)_                              |
