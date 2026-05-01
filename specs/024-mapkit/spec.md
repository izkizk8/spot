# Feature Specification: MapKit Lab Module

**Feature Branch**: `024-mapkit`
**Feature Number**: 024
**Created**: 2026-04-29
**Status**: Approved (autonomous, no clarifications needed)
**Input**: iOS-focused module showcasing Apple's **MapKit** framework
through `react-native-maps` (which wraps MapKit on iOS) plus thin Swift
bridges for `MKLocalSearch` and `MKLookAroundSceneRequest /
MKLookAroundViewController`. Android and web receive graceful, partial
fallbacks.

## Overview

The MapKit Lab module ("MapKit Lab") is a feature card in the iOS
Showcase registry (`id: 'mapkit-lab'`, label `"MapKit Lab"`,
`platforms: ['ios','android','web']`, `minIOS: '9.0'`). It demonstrates
MapKit's core surfaces in one screen:

1. A large **map view** (rendered via `react-native-maps`, which on iOS
   uses MapKit's `MKMapView` and on Android falls back to Google Maps).
2. A top **toolbar** with a map-type segmented control
   (Standard / Satellite / Hybrid / MutedStandard), a "Show user
   location" toggle (gated by location permission), and a "Recenter"
   button that returns to the user's current location (or to a sensible
   default region if location is denied/unavailable).
3. A fixed **bottom panel** (no full sheet library — plain pinned
   `View`) with four tabs:
   - **Annotations** — list of 3-4 preset landmarks (Apple Park, Eiffel
     Tower, Tokyo Tower, Sydney Opera House) each with an on/off toggle,
     plus an "Add at center" button that drops a new annotation at the
     map's current center.
   - **Polyline** — a "Draw sample loop" button that draws a small
     closed-loop polyline around the current center, plus a Clear
     button.
   - **Search** — text input + Search button. Uses `MKLocalSearch` via a
     thin Swift bridge (`MapKitSearchBridge`). Results render as a tap-
     to-fly-to list.
   - **LookAround** — "Show LookAround at center" button. iOS 16+ only;
     below iOS 16 the panel shows an "iOS 16+ required" notice. Uses
     `MKLookAroundSceneRequest` + `MKLookAroundViewController` via a
     thin Swift bridge (`LookAroundBridge`).
4. A **permissions card** that displays current location authorization
   status and exposes a button to request when-in-use permission.

The feature is purely additive at the integration boundary:

1. `src/modules/registry.ts` — one new import line + one new array
   entry.
2. `app.json` `plugins` array — one new entry
   (`./plugins/with-mapkit`). Coexists with all 10 → 11 prior plugins
   (010 through 023).
3. `package.json` / `pnpm-lock.yaml` — adds `react-native-maps` and
   `expo-location` (both via `npx expo install`). Native iOS bridges
   ship as a private module under `native/ios/mapkit/`.
4. `plugins/with-mapkit/` — new Expo config plugin that idempotently
   adds `NSLocationWhenInUseUsageDescription` to iOS Info.plist with a
   user-facing string explaining map centering.

No existing module, screen, or plugin is modified.

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Browse the map and switch map types (Priority: P1)

A user taps the "MapKit Lab" card from the module list. A full-screen
map appears with a top toolbar. The user taps each segment of the
map-type control (Standard, Satellite, Hybrid, MutedStandard) and the
visible map style updates. Tapping "Recenter" returns the camera to the
device's current location if permission is granted, or to a sensible
default region (continental US) if not.

**Why P1**: Without a working map and map-type switching, the rest of
the surface area has nothing to render against.

**Independent Test**: Open the screen on iOS — the map renders, the
segmented control is interactive, and changing segments visibly changes
the basemap style. Recenter moves the camera. On web the map area shows
a "Map view not available on web" placeholder while the toolbar still
renders.

### User Story 2 — Toggle preset landmarks and add custom annotations (Priority: P1)

In the Annotations tab, the user sees a list of four preset landmarks
(Apple Park, Eiffel Tower, Tokyo Tower, Sydney Opera House). Each row
has a toggle. Toggling a row on/off adds/removes the corresponding
annotation on the map. A separate "Add at center" button drops a new
annotation pinned to whatever the map's current center is.

**Why P1**: Annotations are the most visible MapKit primitive; this is
the primary interaction.

**Independent Test**: Toggle all four landmarks on — four pins render at
the correct lat/lng. Toggle two off — only two remain. Pan the map to a
new location and tap "Add at center" — a new pin appears at that
location.

### User Story 3 — Draw and clear a polyline (Priority: P2)

In the Polyline tab, the user taps "Draw sample loop". A small
closed-loop polyline (4-8 points around the current map center) renders
on the map. Tapping Clear removes it.

**Why P2**: Demonstrates overlay rendering; not the headline interaction
but a core MapKit primitive.

**Independent Test**: Tap Draw — a polyline overlay appears centered on
the visible region. Tap Clear — it disappears. Re-drawing after panning
re-anchors the loop to the new center.

### User Story 4 — Search nearby places via MKLocalSearch (Priority: P2)

In the Search tab, the user types a query (e.g. "coffee") and taps
Search. The screen calls `MKLocalSearch` (via the Swift bridge), scoped
to the currently visible map region, and renders a result list of name +
address. Tapping a result animates the map camera to that result's
coordinate.

**Why P2**: Showcases a MapKit framework feature beyond
`react-native-maps`'s built-in surface.

**Independent Test**: On iOS, query "coffee" within a populated region —
non-empty results render and tapping one moves the camera. On Android
and web the Search tab is replaced by an iOS-only banner.

### User Story 5 — Present a Look Around scene (iOS 16+) (Priority: P3)

In the LookAround tab, on iOS 16+, the user taps "Show LookAround at
center". The Swift bridge issues an `MKLookAroundSceneRequest` for the
current map center, and on success presents a modal
`MKLookAroundViewController`. On iOS 9-15 (or non-iOS), the tab body is
replaced by an "iOS 16+ required" notice.

**Why P3**: Headline modern-MapKit feature, but version-gated and
optional for a complete demo.

**Independent Test**: On an iOS 16+ device positioned over a
LookAround-covered location, tap the button — the LookAround modal
appears. Below 16, the notice is shown and the button is hidden or
disabled.

### User Story 6 — Request and reflect location permission (Priority: P2)

The permissions card shows the current authorization status (one of
`undetermined`, `denied`, `granted`, `restricted`). When the status is
`undetermined`, a "Request when-in-use permission" button is enabled;
tapping it triggers the OS prompt and updates the card and the toolbar's
"Show user location" toggle availability accordingly.

**Why P2**: Permission affects two other affordances (user-location
toggle + Recenter). Must be visible and recoverable.

**Independent Test**: Fresh install — card shows `undetermined`, button
is enabled. Tap it, accept — card flips to `granted` and the toolbar's
location toggle becomes operable. Tap it, deny — card flips to `denied`
and the toggle is disabled with a hint to enable in Settings.

### Edge Cases

- Location services disabled system-wide → permissions card shows the
  hardware status string and the user-location toggle is disabled.
- Search returns zero results → list shows an empty-state row, no
  crash.
- Search bridge throws (e.g. network offline, MapKit error) → the panel
  surfaces the error message inline; the rest of the screen remains
  interactive.
- LookAround request returns no scene for the requested coordinate
  (unsupported area) → the bridge resolves `{ shown: false }` and the
  panel surfaces "No Look Around imagery here".
- User toggles a landmark on, pans away, toggles it off — annotation is
  removed cleanly (no stale pins).
- "Add at center" tapped repeatedly without moving — multiple pins
  stack at the same coordinate (acceptable, no de-duplication required).
- Map type changed while overlays are present — overlays persist and
  remain visible across all map types.
- On Android, the same screen renders with Google Maps under
  `react-native-maps`; Search and LookAround tabs show the iOS-only
  banner; Annotations and Polyline tabs work normally.
- On web, the map area is replaced by a static placeholder; toolbar
  and panel controls render for educational purposes but are inert
  where they require a map (Recenter, Add at center, Draw loop). Search
  and LookAround show the iOS-only banner.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Module MUST register in `src/modules/registry.ts` with
  `id: 'mapkit-lab'`, label `"MapKit Lab"`,
  `platforms: ['ios','android','web']`, `minIOS: '9.0'`. Registration
  MUST be one new import + one new array entry; no existing entries are
  modified.
- **FR-002**: Tapping the card MUST navigate to the MapKit Lab screen.
- **FR-003**: The screen MUST render a full-bleed map view via
  `react-native-maps` on iOS and Android.
- **FR-004**: The toolbar MUST expose a 4-segment map-type control
  (Standard / Satellite / Hybrid / MutedStandard) and changing the
  segment MUST update the visible basemap.
- **FR-005**: The toolbar MUST expose a "Show user location" toggle.
  When location permission is not `granted`, the toggle MUST be disabled
  with a hint.
- **FR-006**: The toolbar MUST expose a "Recenter" button which
  animates the camera to the device's current location when permission
  is granted, or to a documented default region otherwise.
- **FR-007**: The bottom panel MUST be a fixed pinned view with four
  tabs (Annotations / Polyline / Search / LookAround). No third-party
  bottom-sheet library is introduced.
- **FR-008**: The Annotations tab MUST list 4 preset landmarks (Apple
  Park, Eiffel Tower, Tokyo Tower, Sydney Opera House) each with a
  toggle that adds/removes the corresponding `Marker` on the map.
- **FR-009**: The Annotations tab MUST expose an "Add at center" button
  that appends a new annotation at the map's current center to the
  user-added annotations list.
- **FR-010**: The Polyline tab MUST expose "Draw sample loop" and
  "Clear" buttons. Drawing MUST render a small closed-loop polyline
  around the current map center; Clear MUST remove it.
- **FR-011**: The Search tab MUST expose a text input and Search button.
  Submitting MUST call `MapKitSearchBridge.search(query, region)` and
  render the resulting `[{ name, address, lat, lng }]` array as a list;
  tapping a result MUST animate the camera to that coordinate.
- **FR-012**: On Android and web, the Search tab body MUST be replaced
  by an `IOSOnlyBanner`.
- **FR-013**: The LookAround tab MUST expose a "Show LookAround at
  center" button that calls
  `LookAroundBridge.presentLookAround(lat, lng)`. On iOS < 16 and on
  non-iOS platforms, the body MUST be replaced by an "iOS 16+ required"
  notice.
- **FR-014**: The permissions card MUST display the current
  `expo-location` authorization status and expose a button to request
  when-in-use permission when the status is `undetermined`. The card
  MUST update reactively when status changes.
- **FR-015**: A new Expo config plugin `plugins/with-mapkit/` MUST
  idempotently add `NSLocationWhenInUseUsageDescription` to iOS
  Info.plist. The plugin MUST coexist with all prior plugins (010
  through 023) without modifying them and MUST be safe to apply more
  than once.
- **FR-016**: Native iOS sources MUST live under
  `native/ios/mapkit/MapKitSearchBridge.swift` and
  `native/ios/mapkit/LookAroundBridge.swift`.
  - `MapKitSearchBridge`: method `search(query: String, region:
    {lat, lng, latDelta, lngDelta}) -> [{name, address, lat, lng}]`
    using `MKLocalSearch.Request`.
  - `LookAroundBridge`: method `presentLookAround(lat: Double, lng:
    Double) -> Promise<{shown: Bool}>` using `MKLookAroundSceneRequest`
    + `MKLookAroundViewController`.
- **FR-017**: JS bridge surfaces `src/native/mapkit-search.ts` and
  `src/native/lookaround.ts` MUST exist with `.android.ts` and `.web.ts`
  sibling stubs that throw a typed `MapKitNotSupported` error or return
  a documented default. Per the per-platform-file pattern from feature
  023, no runtime `Platform.OS` branching is used inside these modules.
- **FR-018**: The web `screen.web.tsx` MUST render a static placeholder
  ("Map view not available on web") in place of the map while keeping
  the toolbar and panel controls visible (educational purpose).
- **FR-019**: `app.json` MUST gain exactly one new entry in `plugins`
  (`./plugins/with-mapkit`); no other entries are modified or
  reordered.
- **FR-020**: `package.json` MUST gain `react-native-maps` and
  `expo-location` dependencies installed via `npx expo install` (which
  selects Expo SDK-compatible versions and updates `pnpm-lock.yaml`).

### Non-Functional Requirements

- **NFR-001 (Conventions)**: All new screens and components MUST follow
  the project conventions in `.github/copilot-instructions.md`:
  `ThemedText` / `ThemedView` for text and surfaces, the `Spacing`
  scale for paddings/margins, `StyleSheet.create` exclusively (no
  inline style objects), and shared theme tokens for color.
- **NFR-002 (Additive only)**: Registry change MUST be exactly +1
  import + 1 array entry; `app.json` change MUST be exactly +1 plugin
  entry; `package.json` MUST only add the two new dependencies. No
  existing module file is modified.
- **NFR-003 (Constitution v1.1.0)**: Feature MUST comply with project
  Constitution v1.1.0 in spec, plan, and implementation phases.
- **NFR-004 (Quality gate)**: `pnpm check` MUST remain green after
  implementation (typecheck, lint, format-check, tests).
- **NFR-005 (Lint hygiene)**: No `eslint-disable` directives for rules
  that are not registered in the lint configuration. Real disables, if
  needed at all, MUST cite a registered rule.
- **NFR-006 (Format)**: `pnpm format` MUST be run before the final
  commit so the working tree is formatter-clean.
- **NFR-007 (Test coverage)**: JS-pure unit tests using Jest + RNTL
  MUST cover:
  - `landmarks.ts` (data shape + uniqueness).
  - `hooks/useMapState.ts` (map type, visible annotations toggling,
    add-at-center, polyline points, region updates, permission state
    transitions).
  - Every component (`MapToolbar`, `BottomTabs`, `AnnotationsPanel`,
    `PolylinePanel`, `SearchPanel`, `LookAroundPanel`, `PermissionsCard`,
    `IOSOnlyBanner`) with `react-native-maps` mocked.
  - Each screen variant (`screen.tsx`, `screen.android.tsx`,
    `screen.web.tsx`).
  - Native bridges per the per-platform-file pattern from feature 023:
    `mapkit-search.ios.test.ts`, `mapkit-search.android.test.ts`,
    `mapkit-search.web.test.ts`, `lookaround.ios.test.ts`,
    `lookaround.android.test.ts`, `lookaround.web.test.ts`.
  - The `with-mapkit` plugin: idempotency (running twice yields the
    same Info.plist) and coexistence with all prior plugins (010-023)
    without conflicts.
  - The module manifest (id, label, platforms, minIOS, screen
    reference).
- **NFR-008 (Platform isolation)**: Platform-conditional native bridge
  tests MUST NOT mock `Platform.OS` inline; instead they MUST use the
  per-platform-file pattern established in feature 023 (`*.ios.test.ts`
  / `*.android.test.ts` / `*.web.test.ts`).
- **NFR-009 (No regressions)**: All existing module tests, plugin
  tests, and registry tests MUST continue to pass.

### Key Entities *(data shapes only — no implementation)*

- **Landmark**: `{ id: string; name: string; lat: number; lng: number;
  description: string }`. Four preset constants live in
  `landmarks.ts`.
- **Annotation (visible)**: union of `Landmark` (preset, toggleable) and
  `{ id: string; lat: number; lng: number; source: 'user-added' }`.
- **Region**: `{ lat: number; lng: number; latDelta: number;
  lngDelta: number }` (mirrors `react-native-maps`).
- **MapType**: `'standard' | 'satellite' | 'hybrid' | 'mutedStandard'`.
- **PermissionStatus**: `'undetermined' | 'denied' | 'granted' |
  'restricted'`.
- **SearchResult**: `{ name: string; address: string; lat: number;
  lng: number }`.
- **LookAroundResult**: `{ shown: boolean }`.

## Acceptance Criteria *(mandatory)*

A reviewer can verify the feature is complete when **all** of the
following hold:

1. **Registry**: `src/modules/registry.ts` contains exactly one new
   import for `mapkit-lab` and one new array entry; the diff against
   `main` shows no other changes to that file.
2. **Manifest**: The new module manifest has `id: 'mapkit-lab'`, label
   `"MapKit Lab"`, `platforms: ['ios','android','web']`, and
   `minIOS: '9.0'`.
3. **Navigation**: Tapping the "MapKit Lab" card on the modules list
   navigates to the MapKit Lab screen on iOS, Android, and web.
4. **iOS screen**: Renders the map (via `react-native-maps`), the
   toolbar (with all three controls operable), the bottom panel (four
   tabs), and the permissions card. Map-type switching, recenter,
   toggling preset landmarks, "Add at center", drawing/clearing the
   polyline, searching, and (on iOS 16+) presenting LookAround all
   work end-to-end against a real device or simulator.
5. **Android screen**: Renders the map (Google Maps via
   `react-native-maps`), the toolbar, the bottom panel with
   Annotations + Polyline functional and Search + LookAround replaced
   by an `IOSOnlyBanner`. Permissions card and user-location toggle
   work.
6. **Web screen**: Renders the placeholder in place of the map and the
   full toolbar + panel UI for educational purposes; Search and
   LookAround show the iOS-only banner.
7. **Plugin idempotency**: Applying `with-mapkit` twice yields the same
   Info.plist (single `NSLocationWhenInUseUsageDescription` key with
   the documented string). Verified by a unit test.
8. **Plugin coexistence**: `app.json` lists `./plugins/with-mapkit`
   alongside all 010-023 plugins; running the full prebuild plugin
   chain in test produces no errors. Verified by a unit test.
9. **Conventions**: All new files use `ThemedText` / `ThemedView`,
   `Spacing` scale, and `StyleSheet.create`. No inline color literals
   that bypass the theme; no inline style objects.
10. **Tests**: All test files listed in NFR-007 exist and pass. Native
    bridge tests follow the per-platform-file pattern (no inline
    `Platform.OS` mocking) per NFR-008.
11. **Quality gate**: `pnpm check` is green from a clean working tree.
12. **Format**: `pnpm format` produces no diff.
13. **No regressions**: All previously passing tests still pass; no
    file outside the additive surface (registry +1 line, app.json +1
    line, package.json +deps, new feature files) is modified.

## Out of Scope

- **Custom tile overlays / `MKTileOverlay`**: not demonstrated.
- **Directions (`MKDirections`)**: not included; Search demonstrates
  the local-search surface only.
- **Clustering**: pins render individually; no clustering algorithm.
- **3D / camera pitch + heading controls**: only 2D map types are
  exposed via the toolbar.
- **Apple-Maps-only styling APIs (point-of-interest filters, elevation
  styles)**: out of scope; standard four map types only.
- **Custom annotation views / image markers**: default markers only.
- **Persistence**: user-added annotations and drawn polylines are
  in-memory for the lifetime of the screen; nothing is written to
  storage.
- **Background location**: only when-in-use permission; no "always" or
  background modes.
- **Bottom sheet library**: a fixed pinned panel is used; no
  `@gorhom/bottom-sheet` or similar dependency.
- **Web map rendering**: not attempted; placeholder only.
- **Android equivalents for Search and LookAround**: shown as
  iOS-only.

## Assumptions

- `react-native-maps` and `expo-location` are installable via
  `npx expo install` against the project's pinned Expo SDK and ship
  with TypeScript types compatible with the rest of the codebase.
- `react-native-maps` exposes `Marker`, `Polyline`, region tracking
  (`onRegionChangeComplete`), `mapType`, `showsUserLocation`, and an
  imperative `animateToRegion` (or equivalent) on the iOS and Android
  platforms; no fork or patch is required.
- The existing module list screen renders cards from
  `src/modules/registry.ts` without per-module wiring (additive single
  array entry is sufficient to surface the card).
- The Spotlight project's iOS deployment target is ≥ 13.0 in practice
  (consistent with prior features), so a `minIOS: '9.0'` declaration
  on the card is informational; the LookAround tab gates itself
  separately at iOS 16+ at runtime via the bridge.
- Default fallback region for Recenter (when location unavailable) is
  the continental US bounding box; exact coordinates are an
  implementation detail captured in `landmarks.ts` or a sibling
  constants file.
- On Android, `react-native-maps` is configured to use Google Maps in
  the project's existing prebuild config; this feature does not change
  that.
- The Swift bridges are compiled into the iOS target via the existing
  `native/ios/` autolinking convention used by feature 023; no new
  podspec or Swift package manifest is introduced beyond what feature
  023 already established.
- Plugin count after this feature is 11 (10 prior plugins from
  010-023 plus `with-mapkit`).

## References

- **Feature 006** — Module registry / list screen contract this card
  registers against.
- **Feature 021** — Sign in with Apple: prior pattern for an
  iOS-focused module with Android/web fallbacks.
- **Feature 022** — Local Authentication: prior pattern for
  permission-gated UI and a permissions card.
- **Feature 023** — Keychain Services: source of the per-platform-file
  test pattern (`*.ios.test.ts` / `*.android.test.ts` /
  `*.web.test.ts`) used here for the native bridges, and the
  `native/ios/<feature>/` source layout for private Swift bridges.
- `.github/copilot-instructions.md` — project conventions
  (ThemedText/ThemedView, Spacing, StyleSheet.create).
- Project Constitution v1.1.0.
