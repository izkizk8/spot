# Feature Specification: Core Location Lab Module

**Feature Branch**: `025-core-location`
**Feature Number**: 025
**Created**: 2026-04-29
**Status**: Approved (autonomous, no clarifications needed)
**Input**: iOS-focused module showcasing Apple's **Core Location**
framework via `expo-location` and `expo-task-manager`. Demonstrates
features beyond what 024's MapKit Lab touched — continuous location
updates, region monitoring (geofences), heading, and significant
location changes. Beacon ranging is explicitly out of scope. Android
and web reuse `expo-location` for the cross-platform surfaces and show
graceful "iOS only" banners for the iOS-exclusive surfaces.

## Overview

The Core Location Lab module ("Core Location") is a feature card in the
iOS Showcase registry (`id: 'core-location-lab'`, label
`"Core Location"`, `platforms: ['ios','android','web']`,
`minIOS: '8.0'`). Tapping the card opens a single screen composed of
five collapsible cards, each isolating one Core Location surface:

1. **Permissions** — distinguishes when-in-use vs always authorization.
   Shows a current-status pill, a Request button (when-in-use first,
   then escalate to always on a second tap if iOS allows), and an
   "Open Settings" deep link for users who previously denied.
2. **Live updates** — Start/Stop toggle for continuous location updates
   with two settings: desired accuracy (Best, Best for navigation,
   Hundred meters, Kilometer) and distance filter (5 m, 50 m, 500 m).
   Live readout shows latitude, longitude, altitude, horizontal
   accuracy, speed, and heading; a "samples per minute" stat is
   computed from the rolling window.
3. **Region monitoring** — list of monitored circular regions
   (geofences). "Add at current location" creates a new region centered
   on the most recent fix; a 3-segment radius control picks 50 m / 100 m
   / 500 m. Each row shows id, radius, and current state
   (inside / outside / unknown). An events log records enter/exit
   transitions as they fire. iOS only — Android and web show an
   "iOS only" banner inside the card.
4. **Heading** — magnetic-north compass needle (reusing 011's
   `CompassNeedle` component) driven by `watchHeadingAsync`. A
   calibration banner appears when the platform reports the heading is
   uncalibrated.
5. **Significant location changes** — toggle that subscribes to the
   significant-change service. Card body documents that updates are
   coarse and infrequent (kilometer-scale, on cell-tower changes), and
   an event log records each callback.

The feature is purely additive at the integration boundary:

1. `src/modules/registry.ts` — one new import line + one new array
   entry (registry size +1).
2. `app.json` `plugins` array — one new entry
   (`./plugins/with-core-location`). Coexists with all prior plugins
   including 024's `with-mapkit`.
3. `package.json` / `pnpm-lock.yaml` — adds `expo-task-manager` (via
   `npx expo install expo-task-manager`). `expo-location` is reused
   from feature 024 — no new dependency for it.
4. `plugins/with-core-location/` — new Expo config plugin that
   idempotently sets `NSLocationWhenInUseUsageDescription`,
   `NSLocationAlwaysAndWhenInUseUsageDescription`, and adds
   `"location"` to `UIBackgroundModes` in the iOS Info.plist.

No existing module, screen, plugin, or registry entry is modified.
024's MapKit Lab continues to work unchanged.

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Grant permission and see a live location stream (Priority: P1)

A user taps the "Core Location" card from the module list. The screen
opens with five collapsible cards; the Permissions card is expanded by
default and shows status "Not determined". The user taps Request, the
iOS system prompt appears, and on grant the pill turns green and reads
"When in use". The user expands Live updates, leaves accuracy at
"Best" and distance filter at "5 m", and taps Start. Within 2 seconds
the readout begins updating with latitude, longitude, altitude,
accuracy, speed, and heading values. The "samples per minute" stat
climbs and stabilizes. Tapping Stop halts updates immediately.

**Why P1**: Permission flow plus continuous updates are the foundation
every other card depends on. Without them the rest of the screen is
inert.

**Independent Test**: On iOS, fresh install → tap card → tap Request →
accept system prompt → expand Live updates → tap Start → observe
readout updating and samples/min > 0 → tap Stop → readout freezes.

**Acceptance Scenarios**:

1. **Given** the app has never requested location permission, **When**
   the user taps Request in the Permissions card, **Then** the iOS
   system permission sheet appears and the status pill reflects the
   user's choice immediately on dismissal.
2. **Given** when-in-use authorization has been granted, **When** the
   user taps Start in Live updates, **Then** the readout updates at
   least once within 5 seconds and continues updating until Stop is
   tapped.
3. **Given** location updates are running, **When** the user changes
   desired accuracy or distance filter, **Then** the running
   subscription is restarted with the new settings without requiring a
   manual Stop/Start.
4. **Given** the user previously denied permission, **When** they tap
   the "Open Settings" link in the Permissions card, **Then** the iOS
   Settings app opens to this app's settings page.

---

### User Story 2 — Add and observe a geofence (Priority: P2)

With when-in-use (or always) authorization granted and a recent fix
available, the user expands the Region monitoring card on iOS, picks a
100 m radius from the 3-segment selector, and taps "Add at current
location". A row appears in the list with a generated id, the chosen
radius, and an initial state of "unknown" or "inside" depending on
the platform callback. As the user (or the simulator's location
simulation) moves outside the radius, an "exit" event is appended to
the events log and the row state updates to "outside". Re-entering
appends an "enter" event.

**Why P2**: Region monitoring is the headline iOS-only surface that
distinguishes this module from the cross-platform 024 demo. It depends
on US1 (permissions + a fix) but is independently demonstrable.

**Independent Test**: On iOS with permission granted and at least one
location fix received, tap "Add at current location" → row appears →
simulate location change in the simulator's Debug menu → enter/exit
events appear in the log within ~30 s.

**Acceptance Scenarios**:

1. **Given** at least one location fix is known and authorization is
   granted, **When** the user taps "Add at current location", **Then**
   a new row is appended to the regions list with the chosen radius
   and a non-empty id.
2. **Given** a region is being monitored, **When** the device crosses
   its boundary, **Then** an event with type `enter` or `exit`,
   timestamp, and region id is appended to the events log within 60
   seconds of the crossing.
3. **Given** the user is on Android or web, **When** they expand the
   Region monitoring card, **Then** an "iOS only" banner is shown in
   place of the controls and no monitoring APIs are invoked.
4. **Given** authorization is when-in-use only, **When** the user adds
   a region, **Then** the row is created and the card shows an
   informational note that background delivery requires "Always"
   authorization.

---

### User Story 3 — Read the compass and watch significant changes (Priority: P3)

The user expands the Heading card. A compass needle (reusing 011's
`CompassNeedle`) rotates as the device is rotated, driven by
`watchHeadingAsync` and bound to `headingMagneticNorth`. If the
platform reports the magnetometer is uncalibrated, a calibration
banner appears above the needle. Separately, the user expands the
Significant location changes card, reads the explanatory copy noting
that callbacks are coarse and infrequent, and toggles the service on.
The events log records each callback as it arrives.

**Why P3**: Heading and significant changes round out the Core Location
surface area but are not on the critical path for demoing the module.

**Independent Test**: On iOS, expand Heading → physically rotate device
→ needle rotates. Toggle Significant changes on → app reports
"subscribed" → log records at least one event during a long enough
session or after a simulated location change.

**Acceptance Scenarios**:

1. **Given** heading authorization is implicitly available with
   when-in-use location, **When** the device is rotated, **Then** the
   needle rotates such that 0° points to magnetic north.
2. **Given** the platform reports the heading is uncalibrated, **When**
   the Heading card is visible, **Then** a calibration banner is shown
   instructing the user to figure-8 the device.
3. **Given** Significant location changes is toggled on, **When** a
   significant change callback fires, **Then** an event with timestamp
   and coordinate is appended to the events log.
4. **Given** Significant location changes is toggled off, **When** new
   callbacks would otherwise fire, **Then** the subscription is torn
   down and no further events are logged.

---

### Edge Cases

- **Permission denied at the OS level** — the Request button changes
  to disabled and the "Open Settings" link is the only path forward;
  Live updates Start, Add region, Heading, and Significant changes
  toggles are all gated and show inline "Permission required" notes.
- **Authorization downgraded to "Never" while the app is open** —
  active subscriptions are torn down on the next foreground; status
  pill reflects the new state on the next focus event.
- **Location services disabled device-wide** — every card other than
  Permissions shows an inline "Location services are off" note and
  no APIs are called.
- **No GPS fix yet** — "Add at current location" is disabled until
  the first fix arrives; tooltip explains why.
- **Region monitoring quota exceeded** — iOS limits monitored regions
  per app to 20; on the 21st add, the UI surfaces the platform error
  and refuses to append the row.
- **Heading unavailable** (e.g., simulator without magnetometer
  emulation) — the Heading card shows "Heading not available on this
  device" instead of the needle.
- **App backgrounded during Live updates** — when-in-use authorization
  pauses updates; always authorization continues delivering, with the
  background-mode entry the plugin added.
- **Android / web in iOS-only cards** — Region monitoring shows the
  "iOS only" banner; all other cards function via the cross-platform
  `expo-location` surfaces.
- **Plugin re-run idempotency** — running `expo prebuild` twice does
  not duplicate Info.plist keys or `UIBackgroundModes` entries.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Registry MUST gain exactly one new entry with
  `id: 'core-location-lab'`, label `"Core Location"`,
  `platforms: ['ios','android','web']`, and `minIOS: '8.0'`. No
  existing registry entry may be modified.
- **FR-002**: `app.json` `plugins` array MUST gain exactly one new
  entry, `./plugins/with-core-location`, appended after existing
  entries. No existing plugin entry may be modified or removed.
- **FR-003**: A new Expo config plugin under
  `plugins/with-core-location/` MUST idempotently set
  `NSLocationWhenInUseUsageDescription`,
  `NSLocationAlwaysAndWhenInUseUsageDescription`, and append
  `"location"` to `UIBackgroundModes` in the iOS Info.plist. Re-runs
  MUST NOT duplicate keys or array entries.
- **FR-004**: The module MUST live under
  `src/modules/core-location-lab/` and contain `index.tsx`
  (manifest), `screen.tsx`, `screen.android.tsx`, `screen.web.tsx`,
  a `components/` directory (PermissionsCard, LiveUpdatesCard,
  LocationReadout, RegionMonitoringCard, RegionRow, HeadingCard,
  SignificantChangesCard, EventLog, IOSOnlyBanner), a `hooks/`
  directory (useLocationUpdates, useHeading, useRegionMonitoring),
  `geofence-task.ts`, `accuracy-presets.ts`, and
  `distance-filters.ts`.
- **FR-005**: The Permissions card MUST display the current
  authorization status as a pill, expose a Request button, and expose
  an "Open Settings" deep link that opens the iOS Settings app at the
  app's page when tapped on iOS.
- **FR-006**: The Live updates card MUST provide a Start/Stop toggle,
  a 4-option desired-accuracy selector (Best, Best for navigation,
  Hundred meters, Kilometer), a 3-option distance-filter selector
  (5 m, 50 m, 500 m), a live readout of latitude, longitude,
  altitude, horizontal accuracy, speed, and heading, and a
  "samples per minute" stat computed over the trailing 60 seconds.
- **FR-007**: Changing accuracy or distance filter while updates are
  running MUST restart the subscription with the new settings; the
  user MUST NOT be required to tap Stop and Start.
- **FR-008**: The Region monitoring card MUST list monitored regions
  with id, radius, and state (inside / outside / unknown); MUST
  expose an "Add at current location" button gated on having at
  least one fix; MUST provide a 3-segment radius selector (50 m /
  100 m / 500 m); and MUST append enter/exit transitions to a
  visible events log.
- **FR-009**: Region monitoring MUST be implemented via
  `expo-location`'s `startGeofencingAsync` plus an
  `expo-task-manager` task defined in `geofence-task.ts`;
  `expo-task-manager` MUST be added via
  `npx expo install expo-task-manager` (no other location dependency
  is added — `expo-location` is reused from 024).
- **FR-010**: The Heading card MUST render the existing
  `CompassNeedle` component from feature 011 driven by
  `watchHeadingAsync`, bound to `headingMagneticNorth`, and MUST
  display a calibration banner when the platform reports
  uncalibrated heading.
- **FR-011**: The Significant location changes card MUST provide a
  toggle that subscribes/unsubscribes the significant-change service
  and append each callback to a visible events log; the card body
  MUST include explanatory copy noting that callbacks are coarse and
  infrequent.
- **FR-012**: On Android and web, the Region monitoring card MUST
  render the `IOSOnlyBanner` component in place of its controls and
  MUST NOT call any region-monitoring APIs. All other cards MUST
  function via the cross-platform `expo-location` surfaces.
- **FR-013**: Beacon ranging is explicitly out of scope for this
  feature and MUST NOT be implemented; no `CLBeacon`-related APIs,
  bridges, or UI may be introduced.
- **FR-014**: All five cards MUST be collapsible and MUST preserve
  collapse state for the lifetime of the screen (no persistence
  across navigations is required).
- **FR-015**: When location services are device-disabled or
  authorization is denied, every card other than Permissions MUST
  surface an inline disabled-state note and MUST NOT invoke
  Core Location APIs.
- **FR-016**: The full `pnpm check` suite MUST pass (lint, typecheck,
  tests) after the feature lands. No existing test may regress.

### Key Entities

- **RegistryEntry** — the new
  `{ id: 'core-location-lab', label, platforms, minIOS, screen }`
  record appended to `src/modules/registry.ts`.
- **MonitoredRegion** — `{ id: string, latitude: number,
  longitude: number, radius: 50 | 100 | 500, state: 'inside' |
  'outside' | 'unknown' }`. In-memory only; not persisted across
  launches.
- **RegionEvent** — `{ id: string, regionId: string, type: 'enter' |
  'exit', timestamp: Date }`. Stored in the in-memory events log
  for the Region monitoring card.
- **LocationSample** — `{ latitude, longitude, altitude, accuracy,
  speed, heading, timestamp }`. The most recent sample drives the
  readout; the trailing 60 s window drives "samples per minute".
- **HeadingSample** — `{ headingMagneticNorth: number,
  accuracy: number, timestamp: Date }`. Drives the compass needle
  and calibration banner.
- **SignificantChangeEvent** — `{ id: string, latitude, longitude,
  timestamp: Date }`. Stored in the in-memory events log for the
  Significant changes card.
- **AccuracyPreset** — one of `Best`, `BestForNavigation`,
  `Hundred meters`, `Kilometer`, defined as a constant table in
  `accuracy-presets.ts` mapping labels to `expo-location` accuracy
  enum values.
- **DistanceFilter** — one of `5`, `50`, `500` (meters), defined as
  a constant table in `distance-filters.ts`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A first-time user can grant when-in-use permission and
  see a live location readout updating in under 30 seconds from
  tapping the card.
- **SC-002**: After tapping Start in Live updates with accuracy
  "Best" on a device with a fix, the readout updates at least once
  within 5 seconds.
- **SC-003**: Adding a 100 m geofence at the current location and
  then crossing its boundary produces a logged enter/exit event
  within 60 seconds of the crossing on iOS.
- **SC-004**: The compass needle reflects device rotation within
  500 ms of the rotation completing on a device with a working
  magnetometer.
- **SC-005**: Running `npx expo prebuild` twice in succession
  produces an Info.plist with each Core Location key and the
  `"location"` background mode entry appearing exactly once.
- **SC-006**: The full `pnpm check` suite (lint, typecheck, tests)
  passes with zero new failures after the feature lands.
- **SC-007**: Adding the module increases `src/modules/registry.ts`
  by exactly one entry and `app.json` `plugins` by exactly one
  entry; no other top-level files are modified.
- **SC-008**: On Android and web, opening the screen renders all
  cards without crashes and the Region monitoring card shows the
  "iOS only" banner instead of attempting to call iOS-only APIs.

## Assumptions

- `expo-location` is already installed (added by feature 024) and
  its iOS bridge is working; no version bump is required for this
  feature.
- The user has a device or simulator capable of producing location
  fixes (real device for production-quality testing; simulator with
  the Debug → Location menu for region/significant-change demos).
- `expo-task-manager` is the appropriate dependency for region
  monitoring callbacks under `expo-location`'s
  `startGeofencingAsync` API; it is added via `npx expo install` so
  the SDK-aligned version is selected.
- Beacon ranging (`CLBeaconRegion`, `startRangingBeacons`) is
  deferred to a separate spec; this module makes no provisions for
  it and adds no Bluetooth permissions or plugin entries.
- "Always" authorization escalation follows iOS's required two-step
  flow: request when-in-use first, then upgrade to always on a
  separate user-initiated tap. The app does not attempt to bypass
  this.
- Background location delivery requires "Always" authorization plus
  the `UIBackgroundModes` "location" entry the plugin adds; the app
  does not implement background-fetch or push-driven location.
- Region monitoring is iOS-only in this module; expo-location
  exposes geofencing on Android too, but Android delivery semantics
  differ enough that demonstrating them is out of scope for this
  spec — the card shows the "iOS only" banner there.
- The `CompassNeedle` component from feature 011 is importable
  as-is and accepts a heading-degrees prop; no changes to feature
  011 are required.
- All in-memory logs (region events, significant-change events) are
  capped at a reasonable size (e.g., 100 entries) with FIFO
  eviction to bound memory; no persistence across navigations is
  required.
- Constitution v1.1.0 governs this feature: additive integration
  only, no edits to unrelated modules, all changes pass
  `pnpm check`.
