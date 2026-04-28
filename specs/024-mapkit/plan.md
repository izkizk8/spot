# Implementation Plan: MapKit Lab Module

**Branch**: `024-mapkit` | **Date**: 2026-04-29 | **Spec**: [spec.md](./spec.md)

## Summary

Ship `mapkit-lab` (id `mapkit-lab`, label `"MapKit Lab"`,
`platforms: ['ios','android','web']`, `minIOS: '9.0'`) as a single-line
addition to `src/modules/registry.ts` and the `app.json` `plugins` array
(10 → 11 entries). The module showcases Apple's **MapKit** framework
through `react-native-maps` (which wraps `MKMapView` on iOS and Google
Maps on Android) plus two thin in-tree Swift bridges for surfaces
`react-native-maps` does not expose:

1. **`MapKitSearchBridge`** — wraps `MKLocalSearch` for region-scoped
   place lookup (Search tab).
2. **`LookAroundBridge`** — wraps `MKLookAroundSceneRequest` +
   `MKLookAroundViewController` for the LookAround tab (iOS 16+).

Both bridges follow the in-tree native module convention established by
feature 023 (`native/ios/<feature>/<Bridge>.swift` +
`<Bridge>.podspec` + `expo-module.config.json`, autolinked into a custom
dev client). The JS surface follows the per-platform-file pattern used
by `coreml.*` / `speech-recognition.*` in `src/native/`: an `.ios.ts`
real implementation and `.android.ts` / `.web.ts` stubs that throw a
typed `MapKitNotSupportedError` so component code never branches on
`Platform.OS`.

A new Expo config plugin `plugins/with-mapkit/` idempotently adds
`NSLocationWhenInUseUsageDescription` to iOS Info.plist with a
user-facing copy explaining map centering. It coexists with all 10
prior plugins (010 → 023) without modifying them.

Two new pnpm dependencies installed via `npx expo install` (which picks
SDK-55–compatible versions and updates `pnpm-lock.yaml`):

- `react-native-maps`
- `expo-location`

No existing module file, plugin file, screen, or shared component is
modified. The integration surface is exactly:

- `src/modules/registry.ts` — +1 import + 1 array entry
- `app.json` — +1 entry in `plugins`
- `package.json` / `pnpm-lock.yaml` — +2 deps

## Technical Context

- **Language**: TypeScript 5.9 strict; Swift 5.9 for the iOS bridges.
- **Runtime**: React 19.2 (React Compiler enabled), React Native 0.83.6,
  Expo SDK ~55.0.17, expo-router (typed routes),
  `react-native-reanimated` Keyframe API.
- **New dependencies (pinned by `npx expo install` against SDK 55)**:
  - `react-native-maps` — current SDK 55 selection (expected `^1.20.x`;
    actual version is whatever `npx expo install` resolves and writes
    to `package.json` / `pnpm-lock.yaml`; the plan does not pre-pin a
    floating range).
  - `expo-location` — current SDK 55 selection (expected `~19.x.x`;
    same caveat).
  Both are added with `npx expo install react-native-maps expo-location`
  in a single command so the resolver picks one consistent SDK-aligned
  set and lockfile churn is one commit.
- **Native bridges (iOS, in-tree)**:
  - `native/ios/mapkit/MapKitSearchBridge.swift` — Expo native module
    name `SpotMapKitSearch`; wraps `MKLocalSearch`.
  - `native/ios/mapkit/LookAroundBridge.swift` — Expo native module
    name `SpotLookAround`; wraps `MKLookAroundSceneRequest` and
    presents `MKLookAroundViewController` modally on the key window's
    root-view-controller.
  - `native/ios/mapkit/MapKit.podspec` — single podspec covering both
    Swift sources (matches the 023 single-podspec-per-feature
    pattern; Pods consumer is the custom dev client).
  - `native/ios/mapkit/expo-module.config.json` —
    `{ "platforms": ["ios"], "ios": { "modules":
      ["MapKitSearchBridge", "LookAroundBridge"] } }`.
  Both modules use the Expo Modules API (`Module { Function(...) {
  ... } }` style — same as `KeychainBridge`); no Objective-C shim,
  no `RCT_EXTERN_METHOD`, no manual bridging header. `@objc`
  annotations are used only where required by the
  `MKLookAroundSceneRequestDelegate` /
  `MKLookAroundViewControllerDelegate` callbacks.
- **JS bridge layout (universal, per-platform-file)**: see Architecture.
- **State / data shapes**: see `data-model.md`.
- **Test stack**: jest-expo + RNTL, JS-pure. New global mocks under
  `test/__mocks__/` (`react-native-maps.tsx`, `expo-location.ts`,
  `native-mapkit-search.ts`, `native-lookaround.ts`) wired through
  `test/setup.ts` next to the existing `native-keychain` mock.
- **No new managed pnpm dependency beyond the two installed via
  `npx expo install`.** **No `eslint-disable` directives for
  unregistered rules.** `pnpm format` is run before commit.

## Architecture

```
src/modules/mapkit-lab/
  index.tsx                   ModuleManifest (id 'mapkit-lab',
                              icon 'map.fill')
  screen.tsx                  iOS screen — composes Map + MapToolbar +
                              BottomTabs + PermissionsCard
  screen.android.tsx          Android — same shell; SearchPanel and
                              LookAroundPanel slots replaced by
                              <IOSOnlyBanner reason="search" /> and
                              <IOSOnlyBanner reason="lookaround" />
  screen.web.tsx              Web — map area replaced by
                              MapPlaceholder; toolbar + bottom panel
                              still render (educational); Search and
                              LookAround tabs render IOSOnlyBanner;
                              map-mutating actions are inert
  landmarks.ts                Four preset Landmark constants
                              (Apple Park, Eiffel Tower, Tokyo Tower,
                              Sydney Opera House) +
                              DEFAULT_FALLBACK_REGION (continental US)
  hooks/
    useMapState.ts            All in-screen state + actions
                              (see Hook Contract)
  components/
    MapToolbar.tsx            Map-type segmented control +
                              user-location toggle + Recenter button
    BottomTabs.tsx            4-tab strip (Annotations / Polyline /
                              Search / LookAround); owns active tab
                              state; renders the active panel
    AnnotationsPanel.tsx      List of preset toggles + "Add at center"
    PolylinePanel.tsx         "Draw sample loop" + "Clear"
    SearchPanel.tsx           Text input + Search button + result list
    LookAroundPanel.tsx       "Show LookAround at center" button +
                              iOS-version notice
    PermissionsCard.tsx       Status row + "Request when-in-use" button
    IOSOnlyBanner.tsx         Banner shown on Android/Web for the
                              iOS-only Search and LookAround tabs
                              (and reused as the version-gate notice
                              when iOS < 16 — see prop `reason`)
    MapPlaceholder.tsx        Web-only placeholder rendered in place
                              of <MapView /> ("Map view not available
                              on web")

src/native/
  mapkit-search.ios.ts        Real iOS impl — resolves
                              `SpotMapKitSearch` via
                              requireOptionalNativeModule; throws
                              MapKitNotSupportedError if absent
  mapkit-search.android.ts    Stub: throws MapKitNotSupportedError
  mapkit-search.web.ts        Stub: throws MapKitNotSupportedError
  mapkit-search.types.ts      Shared SearchResult + bridge interface
                              + MapKitNotSupportedError class
  lookaround.ios.ts           Real iOS impl — resolves
                              `SpotLookAround` via
                              requireOptionalNativeModule; throws
                              MapKitNotSupportedError if absent
  lookaround.android.ts       Stub: throws MapKitNotSupportedError
  lookaround.web.ts           Stub: throws MapKitNotSupportedError
  lookaround.types.ts         Shared LookAroundResult + bridge
                              interface

native/ios/mapkit/
  MapKitSearchBridge.swift    Expo module wrapping MKLocalSearch
  LookAroundBridge.swift      Expo module wrapping
                              MKLookAroundSceneRequest +
                              MKLookAroundViewController
  MapKit.podspec              Single podspec for both Swift sources
  expo-module.config.json     { platforms: ['ios'],
                                ios.modules: [
                                  'MapKitSearchBridge',
                                  'LookAroundBridge' ] }

plugins/with-mapkit/
  index.ts                    withInfoPlist; idempotent;
                              adds NSLocationWhenInUseUsageDescription
  index.test.ts               idempotency + coexistence (see Tests)
  package.json                { name, version, main, types }

test/__mocks__/
  react-native-maps.tsx       (new) MapView/Marker/Polyline render as
                              testID-tagged Views; preserves children;
                              exposes a recorder (regions animated to,
                              region change calls, mapType prop)
  expo-location.ts            (new) requestForegroundPermissionsAsync,
                              getForegroundPermissionsAsync,
                              getCurrentPositionAsync — all
                              programmable per test
  native-mapkit-search.ts     (new) injectable search() returning
                              SearchResult[] or throwing
  native-lookaround.ts        (new) injectable presentLookAround()
                              returning { shown: boolean } or throwing

test/unit/modules/mapkit-lab/
  manifest.test.ts
  landmarks.test.ts
  hooks/useMapState.test.tsx
  components/MapToolbar.test.tsx
  components/BottomTabs.test.tsx
  components/AnnotationsPanel.test.tsx
  components/PolylinePanel.test.tsx
  components/SearchPanel.test.tsx
  components/LookAroundPanel.test.tsx
  components/PermissionsCard.test.tsx
  components/IOSOnlyBanner.test.tsx
  components/MapPlaceholder.test.tsx
  screen.test.tsx
  screen.android.test.tsx
  screen.web.test.tsx

test/unit/native/
  mapkit-search.ios.test.ts
  mapkit-search.android.test.ts
  mapkit-search.web.test.ts
  lookaround.ios.test.ts
  lookaround.android.test.ts
  lookaround.web.test.ts

test/unit/plugins/with-mapkit/
  index.test.ts               idempotency + 11-plugin coexistence
```

## Native Bridges — Public Method Signatures

Both bridges use the Expo Modules API (`Module { ... Function(...) { ... } }`)
exactly like `KeychainBridge` (023). They are autolinked into the custom
dev client via `expo-module.config.json` and `MapKit.podspec`. No
Objective-C shim, no `RCT_EXTERN_METHOD`, no manual bridging header is
introduced — Swift types crossing the bridge are plain `Codable`
structs (`SearchRegionInput`, `SearchResult`, `LookAroundResult`).

### `MapKitSearchBridge` → JS module name `SpotMapKitSearch`

Swift definition:

```swift
public class MapKitSearchBridge: Module {
  public func definition() -> ModuleDefinition {
    Name("SpotMapKitSearch")

    AsyncFunction("search") {
      (query: String, region: SearchRegionInput) -> [SearchResult] in
      try await self.search(query: query, region: region)
    }
  }
}

struct SearchRegionInput: Record {
  @Field var lat: Double
  @Field var lng: Double
  @Field var latDelta: Double
  @Field var lngDelta: Double
}

struct SearchResult: Record {
  @Field var name: String
  @Field var address: String
  @Field var lat: Double
  @Field var lng: Double
}
```

Implementation: builds an `MKLocalSearch.Request` with
`naturalLanguageQuery = query` and `region = MKCoordinateRegion(
center: CLLocationCoordinate2D(lat, lng), span: MKCoordinateSpan(
latitudeDelta, longitudeDelta))`. Awaits `MKLocalSearch.start()`.
Maps `response.mapItems` to `[SearchResult]` (`name = item.name ?? ""`;
`address` joined from `item.placemark.thoroughfare`, `locality`,
`administrativeArea`, `country`, dropping nils; `lat`/`lng` from
`item.placemark.coordinate`). Empty results return `[]`. MKErrors are
thrown across the bridge and surface as a JS `Error`.

### `LookAroundBridge` → JS module name `SpotLookAround`

Swift definition:

```swift
public class LookAroundBridge: Module {
  public func definition() -> ModuleDefinition {
    Name("SpotLookAround")

    AsyncFunction("presentLookAround") {
      (lat: Double, lng: Double) -> LookAroundResult in
      try await self.presentLookAround(lat: lat, lng: lng)
    }
  }
}

struct LookAroundResult: Record {
  @Field var shown: Bool
}
```

Implementation (iOS 16+ runtime check via `if #available(iOS 16.0, *)`;
on older OS the function returns `LookAroundResult(shown: false)` so
callers see the same negative shape they get for unsupported
coordinates):

1. Build `MKLookAroundSceneRequest(coordinate: CLLocationCoordinate2D(
   latitude: lat, longitude: lng))`.
2. `let scene = try await request.scene` — `nil` ⇒ resolve
   `LookAroundResult(shown: false)`.
3. Otherwise instantiate `MKLookAroundViewController(scene: scene)`,
   present modally on `UIApplication.shared.connectedScenes` →
   first foreground active `UIWindowScene` →
   `keyWindow?.rootViewController?.topMostPresented` (helper) using
   `present(_:animated:completion:)`. Resolve
   `LookAroundResult(shown: true)` after `present`'s completion fires.
4. Throws are propagated to JS as `Error`.

The view-controller presentation runs on the main actor
(`await MainActor.run { ... }`).

## JS Bridge Contract — `src/native/mapkit-search.*` and `src/native/lookaround.*`

### Shared types (`mapkit-search.types.ts` / `lookaround.types.ts`)

```ts
// mapkit-search.types.ts
export interface SearchResult {
  name: string;
  address: string;
  lat: number;
  lng: number;
}

export interface SearchRegion {
  lat: number;
  lng: number;
  latDelta: number;
  lngDelta: number;
}

export interface MapKitSearchBridge {
  searchLocations(query: string, region: SearchRegion):
    Promise<SearchResult[]>;
}

export class MapKitNotSupportedError extends Error {
  constructor(api: string) {
    super(`${api} is not supported on this platform`);
    this.name = 'MapKitNotSupportedError';
  }
}

// lookaround.types.ts
export interface LookAroundResult {
  shown: boolean;
}

export interface LookAroundBridge {
  presentLookAround(lat: number, lng: number):
    Promise<LookAroundResult>;
}
```

### Per-platform files

- `mapkit-search.ios.ts` — resolves the native module via
  `requireOptionalNativeModule<{ search: (...) => Promise<SearchResult[]> }>('SpotMapKitSearch')`.
  Exports `searchLocations(query, region) =>
  module.search(query, region)`. If `module` is `null`
  (Expo Go, or app built without the bridge),
  every call throws `new MapKitNotSupportedError('searchLocations')`
  — matching the negative test the components rely on. The component
  catches and surfaces the error message inline (FR-edge "Search bridge
  throws").
- `mapkit-search.android.ts` and `mapkit-search.web.ts` — pure stubs:
  ```ts
  import { MapKitNotSupportedError, type MapKitSearchBridge } from './mapkit-search.types';
  const bridge: MapKitSearchBridge = {
    searchLocations: async () => {
      throw new MapKitNotSupportedError('searchLocations');
    },
  };
  export default bridge;
  ```
- `lookaround.ios.ts` — same shape; resolves `SpotLookAround` and
  exposes `presentLookAround(lat, lng) =>
  module.presentLookAround(lat, lng)`.
- `lookaround.android.ts` / `lookaround.web.ts` — stubs throwing
  `MapKitNotSupportedError('presentLookAround')`.

The bundler picks the right file per platform (Constitution III). No
`Platform.OS` branch lives inside any of these files.

## Data — `landmarks.ts`

```ts
export interface Landmark {
  id: string;            // kebab-case, unique within the array
  name: string;
  lat: number;
  lng: number;
  description: string;
}

export const LANDMARKS: readonly Landmark[] = [
  {
    id: 'apple-park',
    name: 'Apple Park',
    lat: 37.334606,
    lng: -122.009102,
    description:
      "Apple's circular Cupertino headquarters, opened in 2017.",
  },
  {
    id: 'eiffel-tower',
    name: 'Eiffel Tower',
    lat: 48.858370,
    lng: 2.294481,
    description:
      'Wrought-iron lattice tower on the Champ de Mars in Paris.',
  },
  {
    id: 'tokyo-tower',
    name: 'Tokyo Tower',
    lat: 35.658581,
    lng: 139.745433,
    description:
      'Communications and observation tower in Minato, Tokyo.',
  },
  {
    id: 'sydney-opera-house',
    name: 'Sydney Opera House',
    lat: -33.856784,
    lng: 151.215297,
    description:
      'Multi-venue performing arts centre on Sydney Harbour.',
  },
];

// Default region used by Recenter when location permission is not
// granted (Continental US bounding box, roughly centered on Kansas).
export const DEFAULT_FALLBACK_REGION = {
  lat: 39.5,
  lng: -98.35,
  latDelta: 35,
  lngDelta: 50,
};
```

`landmarks.test.ts` asserts: 4 entries; `id` matches
`/^[a-z][a-z0-9-]*$/`; ids are unique; lats in `[-90, 90]`; lngs in
`[-180, 180]`; `description` non-empty.

## Hook Contract — `useMapState`

```ts
export type MapType =
  | 'standard' | 'satellite' | 'hybrid' | 'mutedStandard';

export type PermissionStatus =
  | 'undetermined' | 'denied' | 'granted' | 'restricted';

export interface LatLng { lat: number; lng: number; }

export interface Region extends LatLng {
  latDelta: number;
  lngDelta: number;
}

export type Annotation =
  | { kind: 'preset'; landmarkId: string }
  | { kind: 'user-added'; id: string; lat: number; lng: number };

export interface UseMapState {
  // state
  mapType: MapType;
  visibleAnnotationIds: ReadonlySet<string>;       // landmark ids
  customAnnotations: ReadonlyArray<Annotation & { kind: 'user-added' }>;
  polylinePoints: ReadonlyArray<LatLng>;
  region: Region;
  permissionStatus: PermissionStatus;
  userLocationEnabled: boolean;

  // actions
  toggleAnnotation(landmarkId: string): void;
  addAnnotationAtCenter(): void;
  drawSampleLoop(): void;
  clearPolyline(): void;
  setMapType(type: MapType): void;
  setRegion(region: Region): void;
  setPermissionStatus(status: PermissionStatus): void;
  toggleUserLocation(): void;
  recenter(): Promise<void>;     // uses expo-location if granted,
                                 // otherwise DEFAULT_FALLBACK_REGION
}
```

Lifecycle / behavior:

1. **Mount** — calls
   `Location.getForegroundPermissionsAsync()` once via the mocked
   `expo-location` module to seed `permissionStatus`. `mountedRef`
   guards `setState` after unmount (021/022/023 pattern).
2. **`toggleAnnotation(id)`** — flips the id's membership in
   `visibleAnnotationIds`. `id` MUST refer to an entry in `LANDMARKS`;
   unknown ids are ignored (no throw — defensive).
3. **`addAnnotationAtCenter()`** — appends
   `{ kind: 'user-added', id: <unique>, lat: region.lat,
   lng: region.lng }` to `customAnnotations`. `id` is generated as
   `\`user-${Date.now()}-${counter}\`` where `counter` is a hook-local
   monotonically increasing ref (deterministic in tests via
   `jest.useFakeTimers()`).
4. **`drawSampleLoop()`** — replaces `polylinePoints` with a closed
   8-point loop computed as
   `region.center ± (latDelta/4, lngDelta/4)` rotated through
   `[0, π/4, π/2, ...]`; final point repeats the first. Existing loop
   is overwritten (no append).
5. **`clearPolyline()`** — sets `polylinePoints` to `[]`.
6. **`setMapType` / `setRegion`** — straight setters.
7. **`setPermissionStatus(status)`** — straight setter; if status
   transitions away from `'granted'`, also forces
   `userLocationEnabled = false`.
8. **`toggleUserLocation()`** — no-op when `permissionStatus !==
   'granted'`; otherwise flips `userLocationEnabled`.
9. **`recenter()`** — when `permissionStatus === 'granted'`, calls
   `Location.getCurrentPositionAsync()` and does
   `setRegion({ lat, lng, latDelta: 0.01, lngDelta: 0.01 })`. On
   throw, falls back to `DEFAULT_FALLBACK_REGION` and calls
   `console.warn` once. When permission is not granted, sets
   `DEFAULT_FALLBACK_REGION` directly.

`useMapState.test.tsx` covers every action's state transition and the
permission-gated branches (no native runtime; everything routes through
the global `expo-location` mock).

## Component Contracts (props in / out)

All components use `ThemedText` / `ThemedView` from
`src/components/themed-*` and the `Spacing` scale and `useTheme()` for
colors (Constitution II). Styles are exclusively
`StyleSheet.create()` (Constitution IV). No inline color literals.

- **`MapToolbar`** —
  Props: `{ mapType: MapType; onMapTypeChange(t): void;
  userLocationEnabled: boolean; onUserLocationToggle(): void;
  onRecenter(): void; permissionStatus: PermissionStatus }`.
  Renders 4-segment control (`@expo/ui` `SegmentedControl` or a
  pure-RN segmented row built from `Pressable` — implementation
  picks the latter to avoid coupling to `@expo/ui` quirks),
  a `Switch` (or `Pressable` substitute), and a Recenter `Pressable`.
  The Switch is `disabled` when `permissionStatus !== 'granted'`
  and renders a hint subtitle in that state.

- **`BottomTabs`** —
  Props: `{ children?: never; …state and dispatch from useMapState }`
  (concretely takes the full `UseMapState` minus `mapType` /
  `setMapType` plus the bridges). Owns `activeTab: 'annotations' |
  'polyline' | 'search' | 'lookaround'` local state. Renders a 4-cell
  tab strip plus the active panel.
  Out: nothing — invokes prop callbacks.

- **`AnnotationsPanel`** —
  Props: `{ visibleAnnotationIds: ReadonlySet<string>;
  customAnnotations: ReadonlyArray<...>;
  onToggleAnnotation(id): void;
  onAddAtCenter(): void }`.
  Renders a list of 4 toggleable rows from `LANDMARKS`, an "Add at
  center" `Pressable`, and a "Custom pins: N" footer.

- **`PolylinePanel`** —
  Props: `{ hasPolyline: boolean; onDraw(): void; onClear(): void }`.
  Renders two `Pressable`s; Clear is `disabled` when `!hasPolyline`.

- **`SearchPanel`** —
  Props: `{ region: Region;
  onResultPress(r: SearchResult): void;
  bridge: MapKitSearchBridge }`.
  Owns local `query`, `loading`, `error`, `results` state. Calls
  `bridge.searchLocations(query, region)` on Submit; renders results
  as a list; renders `error.message` inline; renders empty-state
  copy when `results.length === 0` after a non-loading search.

- **`LookAroundPanel`** —
  Props: `{ region: Region;
  bridge: LookAroundBridge;
  iosVersionAtLeast16: boolean }`.
  When `iosVersionAtLeast16 === false`, renders an `IOSOnlyBanner`
  with `reason="ios-version"`. Otherwise renders one `Pressable`
  ("Show LookAround at center"); on press calls
  `bridge.presentLookAround(region.lat, region.lng)`; surfaces
  `{ shown: false }` as "No Look Around imagery here"; surfaces
  bridge throws as inline error copy.

- **`PermissionsCard`** —
  Props: `{ status: PermissionStatus;
  onRequest(): Promise<void> }`.
  Renders the status string and a "Request when-in-use permission"
  `Pressable`; the button is `disabled` unless `status ===
  'undetermined'`.

- **`IOSOnlyBanner`** —
  Props: `{ reason: 'search' | 'lookaround' | 'ios-version' }`.
  Renders a single `ThemedView` with the per-reason copy. Reused on
  Android, Web, and the iOS-version-gated LookAround tab.

- **`MapPlaceholder`** (web only) —
  Props: `{}`. Renders a centered `ThemedText` "Map view not
  available on web".

## Plugin — `with-mapkit`

```ts
import type { ConfigPlugin } from '@expo/config-plugins';
import { withInfoPlist } from '@expo/config-plugins';

const KEY = 'NSLocationWhenInUseUsageDescription';
const COPY =
  'Spot uses your location to center the MapKit Lab map on you ' +
  'and to drop pins at your current position.';

const withMapKit: ConfigPlugin = (config) => {
  return withInfoPlist(config, (mod) => {
    if (mod.modResults[KEY] !== COPY) {
      mod.modResults[KEY] = COPY;
    }
    return mod;
  });
};

export default withMapKit;
```

Properties (FR-015 / FR-019):

- Touches **only** `NSLocationWhenInUseUsageDescription`. Never
  reads or writes any other Info.plist key, no entitlements, no
  capabilities, no build settings.
- Idempotent: re-running on a config that already contains the
  identical copy is a literal no-op (the inequality guard prevents
  even an unnecessary write); re-running on a config with a
  different prior value overwrites it once and is then idempotent.
- Coexists with all 10 prior plugins; the `app.json` `plugins`
  array grows from 10 entries (after the bare strings, configured
  arrays, and inline `expo-sensors` config) by exactly one
  string entry: `"./plugins/with-mapkit"`.

### Coexistence verification (`index.test.ts`)

Single Jest file that runs in `node` env (matches 023's
`with-keychain-services/index.test.ts`):

1. **`adds the key with documented copy when absent`** — call
   `withMapKit(baseConfig)`; assert the resulting config object is
   defined and not equal-by-reference to the input (smoke check).
2. **`overwrites a stale value`** — pass a config whose
   `ios.infoPlist[KEY]` is `'old copy'`; assert no throw.
3. **`is idempotent (running twice produces a single entry)`** —
   `let c = withMapKit(base); c = withMapKit(c);` — assert no throw.
4. **`emits no warnings on a baseline config`** — spy on
   `console.warn`; assert call count is 0.
5. **`only edits NSLocationWhenInUseUsageDescription`** — assert
   `result.name`, `result.slug`, `result.ios?.bundleIdentifier`
   are all preserved.
6. **`coexistence smoke test: 11 plugin entries load`** —
   `const appJson = require('../../../../app.json');` — read the
   `plugins` array post-implementation; assert
   `appJson.expo.plugins.length === 11` (the new total) and that
   `'./plugins/with-mapkit'` is the last entry. Assert the order
   of all 10 prior entries is preserved by deep-equality against
   `appJson.expo.plugins.slice(0, 10)`. (This is the exact test
   that fails RED if anyone reorders or drops a prior plugin.)
7. **`mod-chain runs without throwing`** — import every plugin
   default export from `plugins/with-*/index.ts` (11 total: the
   10 prior + `with-mapkit`); fold them over a baseline
   `ExpoConfig`; assert no throw and that
   `NSLocationWhenInUseUsageDescription` ends up set to the
   documented copy.

## Registry Update — Exact Location

Adding `mapkit-lab` to `src/modules/registry.ts` is two lines:

- **Import** — append after line 19 (`import keychainLab from
  './keychain-lab';`):
  ```ts
  import mapkitLab from './mapkit-lab';
  ```
- **Array entry** — append inside `MODULES` after line 58
  (`  keychainLab,`) and before the trailing comment, so the new
  list is:
  ```ts
  export const MODULES: readonly ModuleManifest[] = [
    // ... 18 prior entries ...
    keychainLab,
    mapkitLab,
    // ↑ Append new manifests here in the order they should appear.
  ];
  ```

No other line in `registry.ts` is edited. The diff against `main` is
exactly +2 lines. `test/unit/modules/registry.test.ts` already enforces
"unique kebab-case ids", so no test changes are required there;
`mapkit-lab/manifest.test.ts` covers the manifest shape.

## `app.json` Update — Exact Change

Append `"./plugins/with-mapkit"` to the `plugins` array. Insertion
position: after `"./plugins/with-keychain-services"` (current line 53)
and before the inline `expo-sensors` entry (currently lines 54–58),
so the segmented controls and the `expo-sensors` configured-array
entry remain the very last element of the array:

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
  ["expo-sensors", { "motionPermission": "..." }]
]
```

The total count after the change is **15** array entries (3 baseline
Expo plugins + 11 in-tree `./plugins/*` + 1 inline-configured
`expo-sensors` array). The "11 plugins" wording in the spec refers to
the count of in-tree custom plugins (`./plugins/with-*`); after this
feature it is 11 (`with-live-activity, with-app-intents,
with-home-widgets, with-screentime, with-coreml, with-vision,
with-speech-recognition, with-audio-recording,
with-sign-in-with-apple, with-local-auth, with-keychain-services,
with-mapkit` minus `with-local-auth` already counted = 11). The plugin
test in `with-mapkit/index.test.ts` asserts on the in-tree custom
count to avoid coupling to bare-string Expo plugins.

> **Decision**: insert position chosen so that the only inline
> configured array (`expo-sensors`) remains the last element, matching
> the existing convention that configured arrays sit at the array tail
> (current `expo-splash-screen` is the only exception and predates the
> convention).

## Test Strategy

All tests are JS-pure (jest-expo + RNTL). No native runtime is
exercised. Every native bridge contract is covered through the
per-platform-file pattern (`.ios.test.ts` / `.android.test.ts` /
`.web.test.ts`) — Constitution III + spec NFR-008.

### `landmarks.test.ts`
- 4 entries; ids are kebab-case and unique; coordinates in valid
  bounds; descriptions non-empty.
- `DEFAULT_FALLBACK_REGION` lat in [25, 50], lng in [-130, -65]
  (continental-US sanity check).

### `useMapState.test.tsx`
- Initial state matches contract defaults (`mapType: 'standard'`,
  `visibleAnnotationIds: empty Set`, `customAnnotations: []`,
  `polylinePoints: []`, `permissionStatus` from mocked
  `getForegroundPermissionsAsync`, `userLocationEnabled: false`,
  `region: DEFAULT_FALLBACK_REGION`).
- `toggleAnnotation` adds then removes an id; unknown id is no-op.
- `addAnnotationAtCenter` appends a user-added entry at current region
  center; ids are unique across N calls (via `Date.now()` advance).
- `drawSampleLoop` produces ≥4 points whose first === last
  (closed loop) and all within the current region span.
- `clearPolyline` empties the array.
- `setMapType` round-trips all 4 values.
- `setRegion` updates state.
- `setPermissionStatus('denied')` while `userLocationEnabled === true`
  forces `userLocationEnabled` back to false.
- `toggleUserLocation` is a no-op when permission is not granted;
  flips otherwise.
- `recenter` with `granted` calls `getCurrentPositionAsync` and
  updates region; throw routes to `DEFAULT_FALLBACK_REGION` + one
  `console.warn`; without granted permission jumps straight to
  `DEFAULT_FALLBACK_REGION`.

### Component tests (one file each, with `react-native-maps` mocked)
- **`MapToolbar`** — segments toggle through `setMapType`; Switch
  disabled and renders hint subtitle when permission ≠ granted;
  Recenter calls `onRecenter`.
- **`BottomTabs`** — initial active tab is `'annotations'`; tapping
  each tab swaps the rendered panel (queryByTestId on the panel root).
- **`AnnotationsPanel`** — 4 toggle rows render landmark names;
  toggling calls `onToggleAnnotation` with the right id; "Add at
  center" calls `onAddAtCenter`; footer count reflects
  `customAnnotations.length`.
- **`PolylinePanel`** — Draw calls `onDraw`; Clear is disabled when
  `hasPolyline === false`.
- **`SearchPanel`** — Submit with empty query is a no-op; non-empty
  query calls `bridge.searchLocations` with the active region; results
  render rows; tapping a row calls `onResultPress`; bridge throw
  surfaces the message inline; empty results render the empty-state
  copy.
- **`LookAroundPanel`** — `iosVersionAtLeast16=false` renders the
  `IOSOnlyBanner reason="ios-version"`; `=true` renders the button;
  press calls the bridge; `{ shown: false }` renders the
  no-imagery copy; throw renders the error message.
- **`PermissionsCard`** — status text rendered for all 4 status
  values; button enabled only on `'undetermined'`; press awaits
  `onRequest`.
- **`IOSOnlyBanner`** — copy varies per `reason` prop; renders without
  any side effect.
- **`MapPlaceholder`** — renders the documented copy.

### Screen variants
- **`screen.test.tsx`** (iOS) — mounts; `MapView`, `MapToolbar`,
  `BottomTabs`, and `PermissionsCard` are present; the four panels
  are reachable through `BottomTabs`.
- **`screen.android.test.tsx`** — `MapView` present; Search and
  LookAround tabs render `IOSOnlyBanner`; Annotations and Polyline
  tabs work via the same `useMapState` hook.
- **`screen.web.test.tsx`** — `MapPlaceholder` renders in place of
  `MapView`; toolbar + bottom panel still mount; Recenter, "Add at
  center", "Draw sample loop" buttons are present but invoking them
  does not throw and does not call any native bridge.

### Native bridge tests (per-platform-file pattern, NFR-008)
- **`mapkit-search.ios.test.ts`** — when the global mock
  `native-mapkit-search` resolves to a value, `searchLocations(q, r)`
  forwards `(q, r)` and returns the array; when the mock resolves to
  `null` (native module absent), every call throws
  `MapKitNotSupportedError`.
- **`mapkit-search.android.test.ts`** — `searchLocations` always
  throws `MapKitNotSupportedError`.
- **`mapkit-search.web.test.ts`** — same as Android.
- **`lookaround.ios.test.ts`** — when the mock resolves, forwards
  `(lat, lng)` and returns the result; when absent, throws
  `MapKitNotSupportedError`.
- **`lookaround.android.test.ts`** / **`lookaround.web.test.ts`** —
  always throw `MapKitNotSupportedError`.

### Manifest test
- **`manifest.test.ts`** — `id === 'mapkit-lab'` (kebab-case, unique
  within `MODULES`); `title === 'MapKit Lab'`;
  `platforms === ['ios','android','web']`; `minIOS === '9.0'`;
  `render` is a function.

### Plugin test
- **`with-mapkit/index.test.ts`** — see Plugin section above.

### Mocks (`test/__mocks__/*`, wired via `test/setup.ts`)
- **`react-native-maps.tsx`** — `MapView` returns a `View`
  testID `map-view` and renders `props.children`; `Marker` and
  `Polyline` render as `View`s with testIDs `map-marker` /
  `map-polyline` so RNTL queries can count them. `mapType`,
  `region`, and `showsUserLocation` props are forwarded to
  `accessibilityState` so they are observable in tests. Imperative
  `animateToRegion` is captured on a recorder.
- **`expo-location.ts`** — exposes
  `requestForegroundPermissionsAsync`,
  `getForegroundPermissionsAsync`,
  `getCurrentPositionAsync`. All three are programmable per test
  with `__setLocationMock({ status, coords, throwOnGet })`.
- **`native-mapkit-search.ts`** / **`native-lookaround.ts`** —
  mirror the `native-keychain` global-mock pattern: an injectable
  resolver consumed by `requireOptionalNativeModule` plus per-call
  result/throw injection.

## Constitution Compliance (v1.1.0)

Walked principle-by-principle:

- **I. Cross-Platform Parity** ✅ — Three screen variants
  (`screen.tsx` / `screen.android.tsx` / `screen.web.tsx`). Core
  "browse a map and toggle pins" journey works on iOS and Android
  (the spec calls out that the iOS-only Search and LookAround
  surfaces are platform-improvement carve-outs explicitly permitted
  by Principle I). Web is intentionally degraded with a placeholder
  for educational purposes — the toolbar and bottom panel still
  render.
- **II. Token-Based Theming** ✅ — All new components use
  `ThemedText` / `ThemedView` and the `Spacing` scale; colors
  resolve via `useTheme()`. No hex literals. Verified by the
  component tests (no test asserts a hex value; any hex literal
  is grep-checked during cleanup).
- **III. Platform File Splitting** ✅ — `screen.tsx` /
  `screen.android.tsx` / `screen.web.tsx`; `mapkit-search.ios.ts` /
  `.android.ts` / `.web.ts`; `lookaround.ios.ts` / `.android.ts` /
  `.web.ts`. No inline `Platform.select()` or `Platform.OS` branch
  inside any component or bridge. The single legitimate
  `Platform.OS` use is reading `Platform.OS === 'ios' &&
  Number(Platform.Version) >= 16` for the `iosVersionAtLeast16`
  prop in `screen.tsx` (single-value derivation, allowed by
  Principle III).
- **IV. StyleSheet Discipline** ✅ — Every component file declares a
  `const styles = StyleSheet.create({ ... })` block; spacing values
  come from `Spacing`. No inline style objects, no CSS-in-JS, no
  utility classes. `src/global.css` is not touched.
- **V. Test-First** ✅ — Every new module export and screen variant
  has a paired test file listed above. The native Swift sources
  are exempt from JS-pure tests but their JS bridge surface is
  covered per-platform-file (NFR-007 / NFR-008). Plugin and
  manifest are tested.
- **Validate-Before-Spec (1.1.0)** ✅ — applies to "build pipelines,
  infrastructure, or external service integrations". This feature
  introduces a custom dev-client native module pair (same pattern
  as 023, which has already validated the autolinking + podspec
  path) and one Info.plist entitlement-style key — no new build
  pipeline. The two new pnpm dependencies are managed by `npx expo
  install` against the SDK 55 resolver, which is the project's
  established integration validation mechanism. **Validation step
  for Phase 0**: run `npx expo install react-native-maps
  expo-location` against the SDK 55 lockfile and observe a clean
  `pnpm install`; then run `pnpm typecheck` to confirm the new
  packages' types satisfy `tsc --noEmit` against `strict: true`.
  These steps are documented in `quickstart.md` and in
  `research.md` §Build Validation.
- **Spec back-patching** ✅ — none expected; the spec is fully
  resolved (no NEEDS CLARIFICATION) and the assumptions in
  §Assumptions are validated in `research.md`.

> **No deviations.** No `Complexity Tracking` rows.

## Risks & Decisions

- **D-01** Two Swift bridges (vs. one merged bridge) chosen because
  `MKLocalSearch` and `MKLookAroundSceneRequest` have unrelated
  lifecycles (search is a single-shot async query; LookAround
  presents a UI controller and depends on iOS 16+ availability).
  Splitting keeps the iOS-version gate isolated to one file and
  matches the spec's tab-aligned mental model.
- **D-02** `MKLookAroundViewController` is presented modally on
  the topmost presented view controller of the key window scene.
  Spot does not currently use multi-scene; this is the same
  presentation pattern previously used by features that need to
  surface a system controller (camera, share sheet) in this
  codebase.
- **D-03** `MapKitNotSupportedError` is a thrown error rather than
  a `kind: 'unsupported'` discriminated result (which 023 used).
  Reasoning: search and LookAround on Android/Web are
  user-visible iOS-only features and the panel already renders
  an `IOSOnlyBanner` which means the bridge is never *called* on
  those platforms in the happy path. The throw exists only as a
  programmer-error backstop for accidental misuse and matches
  the existing per-platform-stub pattern in `coreml.android.ts` /
  `speech-recognition.android.ts`.
- **D-04** `react-native-maps` is mocked in tests (it pulls in
  native modules even on web for some named exports). The mock
  preserves children so component snapshots stay meaningful.
- **D-05** The Continental-US fallback region is in `landmarks.ts`
  rather than a separate `constants.ts` to keep the new module's
  data surface to one file (the spec explicitly allows this).
- **D-06** `useMapState` owns the ref to `Date.now()`-based id
  generation rather than `crypto.randomUUID()` to avoid pulling
  in a polyfill on the React Native runtime. Determinism in tests
  is achieved by `jest.useFakeTimers()` plus the monotonic ref.
- **R-01** The custom Swift bridges require a custom dev client.
  In Expo Go (no native modules linked) the iOS bridge resolution
  returns `null` and `searchLocations` / `presentLookAround`
  throw `MapKitNotSupportedError`. The Search and LookAround
  panels surface the error inline; the rest of the screen
  (map + toolbar + Annotations + Polyline + Permissions) keeps
  working. This degraded-but-functional Expo Go path mirrors 023.
- **R-02** `react-native-maps` versions can change which props are
  required by `MapView`; the mock makes the test suite tolerant
  of prop additions but a major-version bump would still need a
  manual review. Acceptable risk; the SDK-55-pinned resolver
  isolates us from drift.
- **R-03** `MKLookAroundSceneRequest` is iOS 16+. The bridge
  resolves `{ shown: false }` on older iOS rather than throwing,
  so the JS contract is one-shape. The screen also gates the
  button visually via `iosVersionAtLeast16`.

## Project Structure

```text
specs/024-mapkit/
├── plan.md               # this file
├── spec.md               # already authored
├── research.md           # Phase 0 — dependency-pinning validation,
│                         # MapKit API decisions, mock strategy
├── data-model.md         # Phase 1 — entities + state shapes
├── contracts/
│   ├── mapkit-search-bridge.md   # Swift + JS bridge contract
│   ├── lookaround-bridge.md      # Swift + JS bridge contract
│   └── with-mapkit-plugin.md     # config plugin contract
├── quickstart.md         # Phase 1 — manual verification steps
└── tasks.md              # Phase 2 — NOT created by /speckit.plan
```

**Structure Decision**: Mobile + native bridge. Module code under
`src/modules/mapkit-lab/`; per-platform JS bridges under
`src/native/` (`.ios.ts` / `.android.ts` / `.web.ts`); two Swift
bridges sharing one `MapKit.podspec` under `native/ios/mapkit/`
(autolinked by the custom dev client); Expo config plugin under
`plugins/with-mapkit/`; all tests under `test/unit/`. Mirrors the
layout established by 023 with the per-platform-file native bridge
pattern from `coreml.*` / `speech-recognition.*`.

## Complexity Tracking

> **No constitution violations.** Two Swift bridges (vs. one) is a
> design decision (D-01), not a complexity violation; it does not
> add a new module, language, or pattern beyond what 023 already
> introduced.
