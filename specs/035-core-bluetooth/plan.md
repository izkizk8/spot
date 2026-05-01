# Implementation Plan: Core Bluetooth (BLE Central) Module

**Branch**: `035-core-bluetooth` | **Date**: 2026-05-07 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/035-core-bluetooth/spec.md`
**Branch parent**: `034-arkit-basics`

## Summary

Add a "Bluetooth (BLE Central)" showcase module that demonstrates
the iOS Core Bluetooth central-role surface (`CBCentralManager`):
managing manager state and Bluetooth permission, scanning for
advertising peripherals with optional service-UUID filters,
connecting, discovering services and characteristics, and
performing GATT read / write / subscribe operations. The module
is fully self-contained inside `src/modules/bluetooth-lab/`,
registers as a single new card (`id: 'bluetooth-lab'`,
`platforms: ['ios','android','web']`, `minIOS: '7.0'`) appended
to `src/modules/registry.ts`. iOS and Android both delegate to
the well-maintained, Expo-compatible upstream library
**`react-native-ble-plx`** (the chosen library — see research §1)
through a thin, library-agnostic JS bridge at
`src/native/ble-central.ts`; the bridge exposes a stable typed
surface (`getState`, `requestPermission`, `startScan`, `stopScan`,
`connect`, `disconnect`, `discoverServices`,
`discoverCharacteristics`, `readCharacteristic`,
`writeCharacteristic`, `subscribeCharacteristic`) plus an event
emitter (`onStateChange`, `onPeripheralDiscovered`,
`onConnectionStateChange`, `onCharacteristicValue`) so the screen
never imports the library directly. Web uses the native
`navigator.bluetooth` Web Bluetooth API behind the same wrapper
when available; otherwise every method throws `BleNotSupported`
and the ScanControls / DiscoveredList are replaced by a "not
supported" notice while the rest of the panel shell remains
visible. A new config plugin `plugins/with-bluetooth/`
**chains** the upstream `react-native-ble-plx` plugin with
project defaults: a `NSBluetoothAlwaysUsageDescription` string
that is preserved when already set, plus the matching Android
runtime permissions (`BLUETOOTH_SCAN`, `BLUETOOTH_CONNECT` on
API 31+; `ACCESS_FINE_LOCATION` on API 30 and below). The
wrapper is idempotent. Integration is purely additive at the
project boundary: registry +1, `app.json` `plugins` +1
(`./plugins/with-bluetooth`), `package.json` +1 runtime
dependency (`react-native-ble-plx`). Documented soft caps:
DiscoveredList renders up to 100 rows; per-characteristic
EventLog retains the last 20 entries; stale rows pruned at
30 s.

## Technical Context

**Language/Version**: TypeScript 5.9 (strict). React 19.2 +
React Native 0.83 + React Compiler enabled. No new Swift sources
authored by this feature (the library ships its own Objective-C /
Swift implementation).
**Primary Dependencies**: Expo SDK 55, expo-router (typed routes),
`@expo/config-plugins` (used by the new `with-bluetooth` wrapper),
`react-native-ble-plx` ≥ 3.5 (the **only** new runtime JS
dependency; ships its own Expo config plugin). Web uses the
browser's `navigator.bluetooth` (no JS dep). **REUSED** (no
version movement): all prior pinned packages.
**Storage**: None. Discovered peripherals, services,
characteristics, and event-log entries are in-memory only and
scoped to the screen's lifetime (spec §"Out of Scope" — no
state restoration, no peripheral identity persistence in v1).
**Testing**: Jest Expo + React Native Testing Library — JS-pure
tests only. Per FR-021, **no** test requires a live iOS / Android
runtime, simulator, or physical BLE peripheral. The
`react-native-ble-plx` package is mocked at the import boundary
(see research §6); Web Bluetooth tests stub `navigator.bluetooth`
with a `BluetoothDevice` / `BluetoothRemoteGATTServer` /
`BluetoothRemoteGATTCharacteristic` test-double set. The bridge
itself is **the only file** that imports `react-native-ble-plx`,
so the mock attaches to a single, stable identity.
**Target Platform**: iOS 7+ (Core Bluetooth central role; the
`NSBluetoothAlwaysUsageDescription` prompt is iOS 13+ only — see
research §3); Android (full functional parity via the same
library; runtime permissions per Android API level — research §4);
Web (Web Bluetooth API where available — Chrome / Edge / Opera on
desktop; otherwise UI shell + "not supported" notice).
`screen.web.tsx` MUST NOT import `src/native/ble-central.ts` at
module-evaluation time on browsers that lack `navigator.bluetooth`
(carryover from 030 / 031 / 032 / 033 / 034 SC-007 discipline);
the platform-split bridge (`ble-central.web.ts`) keeps the
`navigator.bluetooth` reference inside an `isAvailable()` guard.
**Project Type**: Mobile app (Expo) consuming an upstream
react-native library via autolinking, plus a wrapper Expo
prebuild config plugin. Strictly additive (no new extension
target, no entitlement edits, no App Group). One `app.json`
`plugins[]` append; one `plugins/with-bluetooth/` directory; one
`package.json` `dependencies` append.
**Performance Goals**: Screen mount → first meaningful paint
< 250 ms; first DiscoveredList row ≤ 5 s after Scan toggled on
(SC-001); Connect transition `connecting` → `connected` ≤ 10 s
in 95% of attempts on a reachable peripheral (SC-002); Read
returns hex-encoded bytes ≤ 2 s in 95% of attempts (SC-004);
notification event-log render coalescing window 100 ms with
zero dropped bytes (FR-014); DiscoveredList soft cap 100
rendered rows (FR-027); EventLog soft cap 20 entries
(FR-014). Stale-row prune timeout 30 s (FR-009).
**Constraints**: Purely additive at integration level — 1 import +
1 array entry in `src/modules/registry.ts`, +1 entry in `app.json`
`plugins`, +1 runtime JS dependency (`react-native-ble-plx`); no
edits to prior plugin / screen / Swift sources; no
`eslint-disable` directives anywhere in added or modified code
(FR-022, user-stipulated); `StyleSheet.create()` only
(Constitution IV); `.android.ts` / `.web.ts` splits for
non-trivial platform branches (Constitution III); the bridge is
mocked at the import boundary in tests (FR-021); `pnpm format`
is a no-op after the final commit; `with-bluetooth` plugin
**MUST** preserve any existing `NSBluetoothAlwaysUsageDescription`
(idempotency + coexistence — FR-019).
**Scale/Scope**: One module directory
(`src/modules/bluetooth-lab/`), one new plugin
(`plugins/with-bluetooth/`), one new bridge file family
(`src/native/ble-central.ts` + `.android.ts` / `.web.ts` /
`.types.ts` siblings), zero new Swift / Kotlin files (the
upstream library owns the native layer), one hook
(`hooks/useBleCentral.ts`), six UI components, three screen
variants. No bundled assets.
**Test baseline at branch start**: carried forward from feature
034's completion totals (recorded in 034's `plan.md` /
`retrospective.md`). 035's expected delta: **≥ +14 suites**
(see "Test baseline tracking" below).

## Constitution Check

*Constitution version checked*: **1.1.0**
(`.specify/memory/constitution.md`).

| Principle | Compliance |
|-----------|------------|
| I. Cross-Platform Parity | **PASS** — iOS and Android both ship the full module via `react-native-ble-plx`: state, permissions, scan, connect, discover, read / write / subscribe, disconnect. Web ships the same six-panel structure (StateCard / PermissionsCard / ScanControls / DiscoveredList / PeripheralPanel / disconnect-bar) and uses Web Bluetooth where supported; on browsers without `navigator.bluetooth`, the ScanControls and DiscoveredList are replaced by a typed "not supported" notice while the rest of the UI remains legible. The educational UI shape is itself part of the lesson and is preserved cross-platform. |
| II. Token-Based Theming | **PASS** — All chrome uses `ThemedView` / `ThemedText` and the `Spacing` scale from `src/constants/theme.ts`. Reuses existing semantic colour tokens (`textPrimary` / `surfaceElevated` / `accent` / `warning` / `error`); the segmented control + switch + status pill + monospaced hex log shapes match the conventions established by 016 / 029 / 032 / 033 / 034. No new theme entries; no hardcoded hex values. |
| III. Platform File Splitting | **PASS** — `screen.tsx` / `screen.android.tsx` / `screen.web.tsx`. Bridge has matching `ble-central.ts` / `.android.ts` / `.web.ts` / `.types.ts` variants (mirrors 030 / 031 / 032 / 033 / 034 layouts). The web variant guards `navigator.bluetooth` access behind `isAvailable()` so the import is a no-op on browsers that lack the API. `Platform.select` is permitted only for trivial style / copy diffs. |
| IV. StyleSheet Discipline | **PASS** — All styles via `StyleSheet.create()`; `Spacing` from theme tokens; no inline objects, no CSS-in-JS, no utility-class frameworks. Hex-encoded byte rendering uses the existing monospaced font token. |
| V. Test-First for New Features | **PASS** — JS-pure tests are enumerated in the "Phased file inventory" section below and cover: every component (`StateCard`, `PermissionsCard`, `ScanControls`, `DiscoveredList`, `PeripheralPanel`, `DisconnectBar`), the `useBleCentral` hook (state machine, scan event stream, connect → discover → read flow, unsubscribe-on-unmount, error classification), the bridge across all three platforms (iOS / Android delegate to a mocked `react-native-ble-plx` module + event emitter; Web delegates to a stubbed `navigator.bluetooth` and rejects with `BleNotSupported` when absent), the `with-bluetooth` plugin (idempotency + coexistence with any prior `NSBluetoothAlwaysUsageDescription` setter), all three screen variants, and the manifest contract. The native iOS / Android sources belong to the upstream library and are out of scope for this branch's tests; on-device verification is documented in `quickstart.md`. |
| Validate-Before-Spec (workflow) | **PASS / N/A** — This is not a build-pipeline feature. The plugin's behaviour is verified by JS-pure tests against `@expo/config-plugins`'s `withInfoPlist` and `withAndroidManifest` mods (the wrapper inspects the chained library plugin's output rather than re-implementing the merge). A full `expo prebuild` smoke-test is recorded in `quickstart.md` §2 as the on-device gate. The library has been Expo-compatible since SDK 49 and ships its own config plugin; no proof-of-concept build is required to validate spec assumptions. |

**Initial Constitution Check: PASS — no violations, no entries needed
in Complexity Tracking.**

**Re-check after Phase 1 (post-design): PASS** — the Phase 1 artifacts
(data-model, contracts, quickstart) introduce zero new global stores
(no AsyncStorage key, no `UserDefaults` write), zero new theme tokens,
exactly one new runtime JS dependency (`react-native-ble-plx`,
explicitly required by FR-017 and approved in spec §"Assumptions"),
and no inline `Platform.select` beyond trivial style branches. The
bridge's typed surface keeps every library-specific symbol strictly
inside `src/native/ble-central.ts` (and its `.android.ts` / `.web.ts`
siblings); non-iOS / non-Android variants import only the shared
`*.types.ts` and the typed error classes. The bridge module name and
event names do not collide with any prior native module — see
`contracts/ble-central-bridge.md` invariant B1.

## Project Structure

### Documentation (this feature)

```text
specs/035-core-bluetooth/
├── plan.md                     # this file
├── research.md                 # Phase 0 output (R-A through R-G)
├── data-model.md               # Phase 1 output (entities 1–11)
├── quickstart.md               # Phase 1 output
├── contracts/
│   ├── ble-central-bridge.md       # JS bridge typed surface (11 methods +
│   │                               #   4 events) + 4 typed error classes
│   ├── bluetooth-lab-manifest.md   # Registry entry contract
│   │                               #   (id 'bluetooth-lab', label,
│   │                               #    platforms, minIOS '7.0')
│   ├── with-bluetooth-plugin.md    # with-bluetooth modifier shape +
│   │                               #   idempotency / chaining invariants
│   └── useBleCentral-hook.md       # Hook return shape + actions +
│                                   #   lifecycle + error classification
└── tasks.md                    # Phase 2 output (NOT created here)
```

### Source Code (repository root)

```text
# NEW (this feature) — TypeScript module
src/modules/bluetooth-lab/
├── index.tsx                              # ModuleManifest (id 'bluetooth-lab',
│                                          #   minIOS '7.0', platforms ['ios','android','web'])
├── screen.tsx                             # iOS variant (six panels in fixed order:
│                                          #   StateCard → PermissionsCard → ScanControls →
│                                          #   DiscoveredList → PeripheralPanel (conditional)
│                                          #   → DisconnectBar)
├── screen.android.tsx                     # Android: same six panels; PermissionsCard
│                                          #   wires to the runtime-permissions flow
│                                          #   (BLUETOOTH_SCAN / BLUETOOTH_CONNECT or
│                                          #   ACCESS_FINE_LOCATION per API level)
├── screen.web.tsx                         # Web: same six panels; ScanControls +
│                                          #   DiscoveredList replaced by a "not supported"
│                                          #   notice when navigator.bluetooth is absent.
│                                          #   MUST NOT eagerly import the iOS bridge file
│                                          #   at module evaluation time.
├── hooks/
│   └── useBleCentral.ts                   # { central, permission, scan, discovered,
│                                          #   connected, lastError, setScan, setFilter,
│                                          #   setAllowDuplicates, connect, disconnect,
│                                          #   read, write, subscribe, unsubscribe,
│                                          #   requestPermission, refreshState };
│                                          #   reducer-serialised mutations; subscribes to
│                                          #   bridge events; classifies errors per R-D;
│                                          #   on unmount stops scan, unsubscribes all,
│                                          #   disconnects best-effort (FR-024); ONLY public
│                                          #   surface consumed by screen variants (FR-024).
└── components/
    ├── StateCard.tsx                      # central-state status pill
    │                                      #   (poweredOn/poweredOff/unauthorized/
    │                                      #    unsupported/resetting/unknown) + caption +
    │                                      #   Refresh button
    ├── PermissionsCard.tsx                # permission status pill
    │                                      #   (granted/denied/undetermined/restricted/
    │                                      #    notApplicable) + Request button +
    │                                      #   Open Settings affordance on denied
    ├── ScanControls.tsx                   # Scan toggle + service-UUID filter input
    │                                      #   (comma-separated; client-side validated) +
    │                                      #   Allow duplicates switch +
    │                                      #   pill (idle/scanning/paused);
    │                                      #   gated when central state !== 'poweredOn'
    ├── DiscoveredList.tsx                 # FlatList-style ScrollView of DiscoveredPeripheral;
    │                                      #   sort by RSSI desc, ties by lastSeen recency;
    │                                      #   prune rows older than 30 s; soft-cap 100
    │                                      #   rendered rows; Connect button per row
    ├── PeripheralPanel.tsx                # connection-state pill, ServiceRow / CharacteristicRow
    │                                      #   tree; per-characteristic Read / Write /
    │                                      #   Subscribe / Unsubscribe + EventLog (last 20 hex
    │                                      #   entries; 100 ms render coalescing window)
    └── DisconnectBar.tsx                  # fixed-height bottom bar with Disconnect button
                                            #   + duplicate connection-state pill

# NEW (this feature) — JS bridge (mirrors 030 / 031 / 032 / 033 / 034 layout)
src/native/ble-central.ts                  # iOS impl: thin wrapper over react-native-ble-plx
                                            #   `BleManager`. Imports the library exactly
                                            #   once. Translates library types into the
                                            #   stable BleCentralBridge interface. Mutating
                                            #   methods serialised through a closure-scoped
                                            #   promise chain inherited verbatim from
                                            #   030 / 031 / 032 / 033 / 034 (R-A).
                                            #   Subscribes the library's onStateChange /
                                            #   onDeviceDiscovered / onConnectionStateChange
                                            #   handlers and re-broadcasts them through a
                                            #   typed EventEmitter (R-E).
src/native/ble-central.android.ts          # Same library on Android; differences confined
                                            #   to permission requesting (Android-only
                                            #   PermissionsAndroid integration; the library
                                            #   itself owns the runtime request).
src/native/ble-central.web.ts              # Web Bluetooth path: navigator.bluetooth
                                            #   .requestDevice + GATT primary service +
                                            #   characteristic ops. When navigator.bluetooth
                                            #   is undefined every method throws
                                            #   BleNotSupported (R-F).
src/native/ble-central.types.ts            # BleCentralBridge interface; 4 typed error
                                            #   classes (BleNotSupported,
                                            #   BleNotAuthorized, BleNotPoweredOn,
                                            #   BleOperationFailed); CentralState /
                                            #   PermissionStatus / ScanState /
                                            #   ScanOptions / DiscoveredPeripheral /
                                            #   ConnectionState / DiscoveredService /
                                            #   DiscoveredCharacteristic /
                                            #   CharacteristicProperty /
                                            #   CharacteristicEvent type re-exports.
                                            #   Distinct module name 'BleCentralBridge'
                                            #   (no collision with prior modules).

# NEW (this feature) — Expo config plugin
plugins/with-bluetooth/
├── index.ts                                # ConfigPlugin: chains the upstream
│                                            #   `react-native-ble-plx`'s plugin (R-G) and
│                                            #   then runs an idempotent withInfoPlist mod
│                                            #   that sets a default
│                                            #   NSBluetoothAlwaysUsageDescription ONLY when
│                                            #   absent (preserves any value set by another
│                                            #   plugin or operator). The library plugin
│                                            #   already declares the Android permissions;
│                                            #   the wrapper's job is to enforce the iOS
│                                            #   plist string and to be safe to add to
│                                            #   app.json without losing the operator's
│                                            #   override.
└── package.json                            # Same shape as plugins/with-arkit/package.json:
                                            #   name, version, main 'index.ts'. NO
                                            #   dependencies (config plugins resolve
                                            #   @expo/config-plugins from the host
                                            #   package; react-native-ble-plx is a
                                            #   runtime + autolinked dep, declared at the
                                            #   project root, NOT here).

# MODIFIED (additive only)
src/modules/registry.ts                    # +1 import line, +1 array entry (bluetoothLab)
                                            #   — registry size +1
app.json                                   # +1 string entry in expo.plugins:
                                            #   "./plugins/with-bluetooth". No other change.
package.json                               # +1 entry in dependencies:
                                            #   "react-native-ble-plx" pinned to a single
                                            #   semver (the chosen version is recorded in
                                            #   research §1). No devDependency change.
                                            #   pnpm-lock.yaml updates accordingly.

# NOT MODIFIED — verified non-regression in tests
plugins/with-{live-activity,app-intents,home-widgets,screentime,coreml,vision,
              speech-recognition,audio-recording,sign-in-with-apple,local-auth,
              keychain-services,mapkit,core-location,rich-notifications,
              lock-widgets,standby-widget,focus-filters,background-tasks,
              spotlight,documents,arkit}/**     # All 21 prior plugins byte-identical.
native/ios/**                              # NO new Swift sources; prior native sources
                                            # byte-identical (the upstream library ships
                                            # its own native layer via autolinking).
src/native/{app-intents,widget-center,focus-filters,background-tasks,spotlight,
              quicklook,share-sheet,arkit}.*  # All prior bridges byte-identical.
src/modules/{intents-lab,widgets-lab,lock-widgets-lab,standby-lab,
              focus-filters-lab,background-tasks-lab,spotlight-lab,
              documents-lab,share-sheet-lab,arkit-lab,...}/**
                                            # All prior modules byte-identical.
ios-widget/**                              # 014/027/028-owned widget extension; NOT touched.

# Tests (NEW)
test/unit/modules/bluetooth-lab/
├── manifest.test.ts                        # id 'bluetooth-lab', label 'Bluetooth (BLE Central)',
│                                            #   platforms ['ios','android','web'],
│                                            #   minIOS '7.0'
├── screen.test.tsx                         # iOS flow: six panels in fixed order
│                                            #   (StateCard → PermissionsCard → ScanControls →
│                                            #   DiscoveredList → PeripheralPanel (conditional)
│                                            #   → DisconnectBar). Asserts PeripheralPanel
│                                            #   only renders when connected; disconnect bar
│                                            #   button is disabled while not connected.
├── screen.android.test.tsx                 # Android: same six panels; permission flow
│                                            #   wires to PermissionsAndroid mock; runtime
│                                            #   permission set varies by Android API mock
├── screen.web.test.tsx                     # Web: when navigator.bluetooth is absent,
│                                            #   ScanControls + DiscoveredList replaced by
│                                            #   "not supported" notice; assert
│                                            #   src/native/ble-central.ts is NOT in the
│                                            #   web bundle's import closure
├── hooks/
│   └── useBleCentral.test.tsx              # mount default state; refreshState();
│                                            #   requestPermission(); setFilter() with
│                                            #   invalid UUID surfaces validation error;
│                                            #   setScan(true) with central state !==
│                                            #   'poweredOn' is a no-op + caption;
│                                            #   onPeripheralDiscovered events build the
│                                            #   discovered list (sort/dedup/RSSI update);
│                                            #   30 s stale prune (jest fake timers);
│                                            #   connect → discoverServices →
│                                            #   discoverCharacteristics flow populates
│                                            #   the connected.services tree; read /
│                                            #   write / subscribe / unsubscribe append
│                                            #   the right CharacteristicEvent rows;
│                                            #   subscribe survives 100ms coalescing
│                                            #   without dropped bytes; unmount stops
│                                            #   scan, unsubscribes all, disconnects
│                                            #   best-effort, detaches all listeners
│                                            #   (zero post-unmount calls — SC-010);
│                                            #   each typed error classified to the
│                                            #   right lastError caption (R-D).
└── components/
    ├── StateCard.test.tsx                  # 6 status pill values; Refresh button calls
    │                                        #   onRefresh; caption matches state
    ├── PermissionsCard.test.tsx            # 5 status pill values; Request button calls
    │                                        #   onRequest; Open Settings affordance only
    │                                        #   on denied/restricted; iOS<13 short-circuits
    │                                        #   to 'granted' without invoking onRequest
    ├── ScanControls.test.tsx               # Scan toggle gated on central state;
    │                                        #   filter validation (4-char or 36-char UUID);
    │                                        #   Allow duplicates switch; pill
    │                                        #   (idle/scanning/paused); inline caption
    │                                        #   visible when state blocks scan
    ├── DiscoveredList.test.tsx             # 0/1/100 entries; sort by RSSI desc,
    │                                        #   ties by lastSeen recency; row format
    │                                        #   (name, short id 8 chars, RSSI dBm,
    │                                        #   service UUIDs short form, relative
    │                                        #   last-seen timestamp); Connect button
    │                                        #   disabled while another connect is
    │                                        #   in-flight; soft cap 100 rendered rows
    ├── PeripheralPanel.test.tsx            # connection-state pill (4 values); service
    │                                        #   tree; characteristic property pills;
    │                                        #   Read / Write / Subscribe / Unsubscribe
    │                                        #   buttons disabled when matching property
    │                                        #   absent; EventLog 20-row cap with hex
    │                                        #   formatting + timestamps; subscribed
    │                                        #   indicator on row
    └── DisconnectBar.test.tsx              # Disconnect button enabled iff connected;
                                              #   duplicate connection-state pill mirrors
                                              #   PeripheralPanel pill
test/unit/native/
└── ble-central.test.ts                     # iOS path delegates to mocked
                                              #   react-native-ble-plx BleManager;
                                              #   serialisation invariant (R-A); event
                                              #   re-broadcast (R-E) — onStateChange,
                                              #   onPeripheralDiscovered,
                                              #   onConnectionStateChange,
                                              #   onCharacteristicValue;
                                              #   Android path identical except permission
                                              #   request goes through PermissionsAndroid
                                              #   mock; Web path: navigator.bluetooth
                                              #   stubbed — startScan promotes no-filter
                                              #   to acceptAllDevices: true (FR-026);
                                              #   when navigator.bluetooth is absent,
                                              #   every method throws BleNotSupported.
                                              #   Each typed error class round-trips
                                              #   instanceof across the three platform
                                              #   files (single class identity from
                                              #   ble-central.types.ts).
test/unit/plugins/
└── with-bluetooth.test.ts                  # withInfoPlist mod is idempotent (running it
                                              #   twice on the same Expo config produces
                                              #   a deep-equal config — SC-008);
                                              #   preserves an upstream
                                              #   NSBluetoothAlwaysUsageDescription set
                                              #   by another plugin (FR-019); chains the
                                              #   upstream react-native-ble-plx plugin
                                              #   exactly once (no double-application —
                                              #   asserted by mocking the upstream
                                              #   plugin and counting invocations).
```

**Structure Decision**: Mirrors **034's** `Expo + iOS-main-app-target`
shape, with **two structural differences** versus 034:

1. **No new Swift sources** — `react-native-ble-plx` already
   provides the iOS / Android native layer via autolinking; the
   feature owns only the JS bridge wrapper, the JS module, and a
   thin Expo config plugin chain. 034 had two new Swift files and
   a bundled texture; 035 has zero new native files.
2. **One new runtime JS dependency** — `react-native-ble-plx`. 034
   added zero. The dependency is necessary because Core Bluetooth
   has no first-party Expo wrapper and the spec explicitly chose
   the library (§"Assumptions"). The bridge is the single seam so
   that swapping libraries later does not ripple into the screen.

Other carryovers from 034 are preserved:

- Platform-split bridge file family (`.ts` / `.android.ts` /
  `.web.ts` / `.types.ts`) and platform-split screen files.
- Closure-scoped promise chain `enqueue()` for mutating async
  bridge methods (R-A inherited verbatim).
- Hook-as-only-public-surface invariant for components.
- All-typed-errors-from-types-file invariant for cross-platform
  `instanceof` correctness.
- Module-name distinctness (`'BleCentralBridge'` does not collide
  with `'ARKitBridge'` or any prior module).
- Plugin idempotency proof via JS-pure tests against
  `@expo/config-plugins` mods.

## Resolved decisions

The spec was approved without clarifications. The following are the
plan-level technical decisions made autonomously, recorded in
`research.md` with full Decision / Rationale / Alternatives:

| # | Decision | Spec ref / location |
|---|----------|---------------------|
| R-A | Bridge serialisation via closure-scoped promise chain (inherited verbatim from 030 / 031 / 032 / 033 / 034). Two back-to-back mutating calls (e.g., two rapid `connect()` taps) produce two native invocations in submission order. Applied on all three platforms (Web rejects in submission order). `getState()`, `isAvailable()` (event-emitter listeners) are NOT serialised. | research §1 |
| R-B | **Library choice: `react-native-ble-plx`** over a custom Swift `CBCentralManager` bridge or alternative libraries (`react-native-ble-manager`, `react-native-bluetooth-classic`). Rationale: most popular (60k+ weekly downloads), active maintenance, ships its own Expo config plugin, MIT-licensed, full Android parity, mature JS API including `monitorCharacteristicForDevice` (notifications), `discoverAllServicesAndCharacteristicsForDevice` (single-call discovery), and `BleErrorCode` taxonomy that maps cleanly to our typed error classes. A custom Swift bridge is rejected because (a) the library already does it well, (b) it would not give us Android parity, and (c) it would multiply test surface and on-device verification cost. | research §2 / spec §"Assumptions" |
| R-C | **iOS permission model**: on iOS 13+ the bridge calls the library's permission API (`requestPermission()` is implicit when the manager initialises and the OS prompts on first use); the wrapper tracks permission via the `state` callback (`unauthorized` ↔ `denied`). On iOS < 13, the bridge synchronously returns `'granted'` without invoking the library (FR-005). The `NSBluetoothAlwaysUsageDescription` plist key is set by `with-bluetooth` only when absent. | research §3 |
| R-D | **Hook error classification**: every mutating bridge call is caught at the hook boundary and dispatched as one of `'unsupported'` (`BleNotSupported`), `'unauthorized'` (`BleNotAuthorized` / library `BleErrorCode.BluetoothUnauthorized`), `'powered-off'` (`BleNotPoweredOn` / `BleErrorCode.BluetoothPoweredOff`), `'operation-not-supported'` (`BleOperationFailed` with code `'operation-not-supported'`), or `'failed'` (any other Error). The `lastError` field on the hook state carries a human-readable string for inline caption rendering. The hook NEVER allows a bridge call to surface as an unhandled rejection (FR-023). | research §4 |
| R-E | **Event-emitter design**: the bridge exposes a typed `BleCentralEmitter` with `on(event, handler) → unsubscribe` for the four event types. iOS / Android subscribe to `react-native-ble-plx`'s `onStateChange`, `startDeviceScan` callback, `onDeviceDisconnected`, and `monitorCharacteristicForDevice` callbacks and re-broadcast through the same emitter. Web translates `navigator.bluetooth.addEventListener('availabilitychanged', …)` and the GATT `characteristicvaluechanged` event into the same shape. Listeners attached via `on(...)` MUST be torn down through their returned unsubscribe; the hook owns one per-event subscription and releases all on unmount. | research §5 |
| R-F | **Web Bluetooth fallback model**: scan → `navigator.bluetooth.requestDevice({ filters | acceptAllDevices: true })`; the picked device becomes a single discovered "row" (Web Bluetooth has no continuous scanning). A no-filter scan auto-promotes to `acceptAllDevices: true` (Web Bluetooth requirement — FR-026). Connect → `device.gatt.connect()`. discoverServices → `getPrimaryServices()`. discoverCharacteristics → `service.getCharacteristics()`. Read / Write / Subscribe map to the GATT characteristic methods. When `navigator.bluetooth` is undefined every bridge method throws `BleNotSupported` and the screen replaces ScanControls + DiscoveredList with the "not supported" notice. | research §6 |
| R-G | **Plugin chaining**: `with-bluetooth` is a `ConfigPlugin` that first calls the upstream `react-native-ble-plx`'s plugin (which already declares the iOS plist key and Android manifest permissions when invoked with options), then runs a `withInfoPlist` mod that sets a default `NSBluetoothAlwaysUsageDescription` ONLY when absent. This guarantees: (i) the operator can configure the string by passing options to either plugin and the wrapper preserves their value; (ii) running the wrapper twice produces a deep-equal config (idempotency — FR-019, SC-008); (iii) Android runtime permissions (`BLUETOOTH_SCAN`, `BLUETOOTH_CONNECT`, `ACCESS_FINE_LOCATION`) come from the upstream plugin and are not re-declared. | research §7 |

## Phase 0 — Research

`research.md` resolves R-A through R-G with code-level detail.

- §1 R-A: Bridge serialisation (inherited from 030 / 031 / 032 /
  033 / 034)
- §2 R-B: Library choice — `react-native-ble-plx` vs custom Swift
  vs alternatives (decision matrix + rejection rationale)
- §3 R-C: iOS permission model (iOS 7–12 vs 13+) and Android
  runtime permission matrix by API level
- §4 R-D: Hook error classification table (5 categories) +
  unhandled-rejection prevention
- §5 R-E: Event-emitter design (single typed emitter; per-event
  unsubscribe; ownership at the hook boundary)
- §6 R-F: Web Bluetooth fallback model + per-pick semantics +
  auto-promotion of no-filter scans
- §7 R-G: `with-bluetooth` plugin chaining + idempotency proof +
  coexistence with operator overrides
- §8 (Soft caps and pruning): DiscoveredList soft cap (100 rows),
  EventLog soft cap (20 entries), stale-row prune at 30 s
  (FR-009 / FR-014 / FR-027). Performance verified informally via
  the existing `ScrollView` 60-fps target.

## Phase 1 — Design & Contracts

**Prerequisites**: research.md complete (R-A through R-G resolved).

1. **`data-model.md`** — entities 1–11:
   - `CentralState`
     (`'poweredOn' | 'poweredOff' | 'unauthorized' | 'unsupported' | 'resetting' | 'unknown'`)
   - `PermissionStatus`
     (`'granted' | 'denied' | 'undetermined' | 'restricted' | 'notApplicable'`)
   - `ScanState` (`'idle' | 'scanning' | 'paused'`)
   - `ScanOptions`
     (`{ serviceUUIDs?: string[], allowDuplicates: boolean }`)
   - `DiscoveredPeripheral`
     (`{ id, name, rssi, serviceUUIDs, lastSeen, manufacturerData? }`)
   - `ConnectionState`
     (`'connecting' | 'connected' | 'disconnecting' | 'disconnected'`)
   - `DiscoveredService`
     (`{ id, uuid, isWellKnown, characteristics }`)
   - `DiscoveredCharacteristic`
     (`{ id, uuid, serviceId, properties, isSubscribed }`)
   - `CharacteristicProperty`
     (`'read' | 'write' | 'writeWithoutResponse' | 'notify' | 'indicate'`)
   - `CharacteristicEvent`
     (`{ kind, bytesHex, byteLength, at, message? }`)
   - `BluetoothLabState` (hook state composing all of the above
     + actions)
2. **`contracts/`** (markdown contract docs, not `.contract.ts`
   files — chosen to mirror the user's task wording and to keep
   the contract surface readable for a wider reviewer set):
   - `ble-central-bridge.md` — JS bridge typed surface
     (11 methods + 4 events) + 4 typed error classes
   - `bluetooth-lab-manifest.md` — registry entry shape +
     invariants
   - `with-bluetooth-plugin.md` — `with-bluetooth` modifier shape,
     idempotency, chaining-with-upstream invariants
   - `useBleCentral-hook.md` — hook return shape + actions +
     lifecycle + error classification
3. **`quickstart.md`** — JS-pure verification (Windows / CI) +
   on-device verification (iOS 13+ device with Bluetooth
   permission, an Android device with API 31+ runtime
   permissions, a Chrome / Edge desktop browser with Web
   Bluetooth, and a non-Web-Bluetooth browser like Safari /
   Firefox to exercise the fallback). Adds an `expo prebuild`
   smoke-test step that asserts `ios/<app>/Info.plist` contains a
   non-empty `NSBluetoothAlwaysUsageDescription` and that
   `android/app/src/main/AndroidManifest.xml` contains the
   `BLUETOOTH_SCAN`, `BLUETOOTH_CONNECT`, and (for compileSdk ≤ 30
   targets) `ACCESS_FINE_LOCATION` permissions exactly once.
4. **Agent context update**: the workspace's
   `.github/copilot-instructions.md` does not currently contain
   `<!-- SPECKIT START -->` / `<!-- SPECKIT END -->` markers
   (verified in 034's plan; unchanged here). The plan reference
   is recorded in this file; if/when those markers are introduced
   project-wide, `tasks.md` will substitute the path
   `specs/035-core-bluetooth/plan.md` between them.

## Phased file inventory

NEW (TypeScript module):

- `src/modules/bluetooth-lab/index.tsx`
- `src/modules/bluetooth-lab/screen.tsx`
- `src/modules/bluetooth-lab/screen.android.tsx`
- `src/modules/bluetooth-lab/screen.web.tsx`
- `src/modules/bluetooth-lab/hooks/useBleCentral.ts`
- `src/modules/bluetooth-lab/components/{StateCard,
  PermissionsCard, ScanControls, DiscoveredList,
  PeripheralPanel, DisconnectBar}.tsx`

NEW (JS bridge):

- `src/native/ble-central.ts`
- `src/native/ble-central.android.ts`
- `src/native/ble-central.web.ts`
- `src/native/ble-central.types.ts`

NEW (tests):

- `test/unit/modules/bluetooth-lab/manifest.test.ts`
- `test/unit/modules/bluetooth-lab/screen.test.tsx`
- `test/unit/modules/bluetooth-lab/screen.android.test.tsx`
- `test/unit/modules/bluetooth-lab/screen.web.test.tsx`
- `test/unit/modules/bluetooth-lab/hooks/useBleCentral.test.tsx`
- `test/unit/modules/bluetooth-lab/components/{StateCard,
  PermissionsCard, ScanControls, DiscoveredList,
  PeripheralPanel, DisconnectBar}.test.tsx`
- `test/unit/native/ble-central.test.ts`
- `test/unit/plugins/with-bluetooth.test.ts`

NEW (Expo config plugin):

- `plugins/with-bluetooth/index.ts`
- `plugins/with-bluetooth/package.json`

MODIFIED (additive only):

- `src/modules/registry.ts` (+1 import, +1 array entry
  `bluetoothLab`)
- `app.json` (+1 string entry `'./plugins/with-bluetooth'` in
  `expo.plugins`)
- `package.json` (+1 entry in `dependencies`:
  `react-native-ble-plx`)
- `pnpm-lock.yaml` (regenerated; non-additive but mechanical)

NOT MODIFIED:

- All prior plugins / Swift sources / bridges / modules —
  byte-identical
- No new native sources; no entitlement edits

## Task seeds for tasks.md

These are sketches for the `/speckit.tasks` step, ordered by
dependency. The full enumeration belongs in `tasks.md`; these are
intentionally coarse so `/speckit.tasks` can split each into
RED → GREEN → REFACTOR sub-tasks.

1. **T001 — Bridge types + non-iOS variants (RED-first)**:
   `src/native/ble-central.types.ts` declares the bridge interface
   + 4 typed error classes + all entity unions. Tests cover the
   class identities (`instanceof` round-trip across files).
2. **T002 — Web bridge**: `src/native/ble-central.web.ts`
   implements the Web Bluetooth path with the typed surface; when
   `navigator.bluetooth` is undefined every method throws
   `BleNotSupported`. No-filter scan auto-promoted to
   `acceptAllDevices: true` (FR-026). Tests stub
   `navigator.bluetooth` and exercise the `requestDevice` →
   `gatt.connect` → discover → read / write / subscribe flow.
3. **T003 — iOS / Android bridges**: `src/native/ble-central.ts`
   and `.android.ts` wrap `react-native-ble-plx`'s `BleManager`
   with the closure-scoped serialisation chain (R-A) and the
   event re-broadcast emitter (R-E). Permission requesting on
   Android delegates to PermissionsAndroid. Tests mock
   `react-native-ble-plx` at the import boundary.
4. **T004 — `with-bluetooth` plugin (RED-first)**:
   `plugins/with-bluetooth/index.ts` + `package.json`. JS-pure
   tests exercise idempotency (SC-008), chaining the upstream
   library plugin exactly once (R-G), and preservation of an
   existing `NSBluetoothAlwaysUsageDescription`.
5. **T005 — Manifest**:
   `src/modules/bluetooth-lab/index.tsx` + `manifest.test.ts`
   (asserts id `'bluetooth-lab'`, label
   `'Bluetooth (BLE Central)'`, platforms
   `['ios','android','web']`, `minIOS: '7.0'`).
6. **T006 — Hook**:
   `src/modules/bluetooth-lab/hooks/useBleCentral.ts` returning
   the documented state object; reducer-serialised mutations;
   subscribes to bridge events on mount; classifies bridge errors
   (R-D); on unmount stops scan, unsubscribes all, disconnects
   best-effort, detaches all listeners (FR-024, SC-010).
7. **T007 — Components, top-down RED**: write component tests
   first (`StateCard`, `PermissionsCard`, `ScanControls`,
   `DiscoveredList`, `PeripheralPanel`, `DisconnectBar`); then
   implement against them.
8. **T008 — Screens**: implement `screen.tsx`,
   `screen.android.tsx`, `screen.web.tsx` with the fixed panel
   ordering per FR-003. Tests assert layout order, conditional
   PeripheralPanel visibility, the Web fallback notice when
   `navigator.bluetooth` is absent, and that `screen.web.tsx`
   does NOT pull `src/native/ble-central.ts` into the bundle.
9. **T009 — Add `react-native-ble-plx` dependency**: update
   `package.json` + `pnpm-lock.yaml`. Verify `pnpm install` is
   green and the autolinking metadata picks up the library on
   iOS / Android.
10. **T010 — Registry hook-up**: append `bluetoothLab` import +
    array entry to `src/modules/registry.ts`. Update
    `test/unit/modules/registry.test.ts` if it asserts a fixed
    length.
11. **T011 — `app.json` plugin entry**: append
    `"./plugins/with-bluetooth"` to the `expo.plugins` array.
    Verify via a JS-pure parse + assertion test if the project
    keeps one; otherwise the plugin test (T004) plus the on-device
    prebuild step (quickstart §2) closes SC-007 / SC-008.
12. **T012 — `pnpm check` gate**: lint + typecheck + tests must be
    green; no `eslint-disable` directives anywhere; `pnpm format`
    is a no-op after the final commit. Report delta from 034's
    closing baseline.
13. **T013 — On-device verification**: execute `quickstart.md`
    checklist on a real iOS 13+ device, an Android device with
    API 31+, and a Chrome desktop browser; confirm the Safari /
    Firefox fallback notice. Verify `expo prebuild` produces a
    plist with non-empty `NSBluetoothAlwaysUsageDescription` and
    a manifest with the expected runtime permissions.

## Risks

| # | Risk | Likelihood | Impact | Mitigation |
|---|------|------------|--------|------------|
| R1 | **`react-native-ble-plx` upstream plugin drift** — the chained library plugin changes its modifier name or option shape between releases, breaking our wrapper. | Low | High | Pin `react-native-ble-plx` to a single semver in `package.json` (research §1). The wrapper's tests assert it invokes the upstream plugin's exported function; if the upstream signature changes the test fails before merge. Quickstart §2 includes a `pnpm prebuild` smoke-test gate. |
| R2 | **iOS plist clobber** — wrapper overwrites an operator's `NSBluetoothAlwaysUsageDescription`. | Medium | High | R-G + FR-019: the wrapper sets the key only when ABSENT. Idempotency test asserts that running the wrapper twice on a config with a pre-existing string produces a deep-equal config (SC-008). |
| R3 | **Android runtime permission mismatch by API level** — calling `BLUETOOTH_SCAN` on API 30 or `ACCESS_FINE_LOCATION` on API 31+ as the only permission. | Medium | Medium | The library handles the API matrix internally; the wrapper does not re-declare permissions (R-G). Tests mock `Platform.constants.Version` and assert the right permission set is requested per API level. Quickstart §2 verifies the AndroidManifest contents. |
| R4 | **Web Bluetooth UX divergence** — users expect continuous scanning on Web but Web Bluetooth provides per-pick semantics only. | High | Low | FR-026: a no-filter scan auto-promotes to `acceptAllDevices: true`; the UI surfaces a one-time caption explaining the per-pick model on first activation. Documented in spec §"Edge Cases" and quickstart §2.5. |
| R5 | **Bridge concurrency anomaly** — two rapid `connect()` taps stack two native connection attempts; the second succeeds and disconnects the first mid-discovery. | Medium | Medium | Per R-A, mutating bridge methods serialise through a closure-scoped promise chain; the second call waits for the first. The DiscoveredList Connect button is disabled while another connect is in-flight. Spec edge case "tap-to-connect during in-progress connection" rejects the second attempt at the screen layer. |
| R6 | **Subscription leak on unmount** — `react-native-ble-plx`'s `monitorCharacteristicForDevice` returns a subscription handle; failing to call `.remove()` leaks native callbacks. | Medium | High | FR-024 + R-E: the hook owns every subscription and stores its handle in a ref; cleanup runs on unmount and calls `.remove()` for each. Test asserts zero post-unmount calls to any bridge listener (SC-010). |
| R7 | **Disconnect during active subscription** — characteristic-value events arrive after `disconnect()` resolves but before subscriptions are torn down. | Medium | Low | The hook tears down all subscriptions BEFORE issuing `disconnect()`. If the library emits a value event during the disconnect window, the reducer's `mounted` ref guards the dispatch (no-op when false). Test exercises the race with fake timers. |
| R8 | **`screen.web.tsx` accidentally pulls `src/native/ble-central.ts` into the web bundle** via a transitive import. | Low | Medium | Tests for `screen.web.tsx` assert at module-graph level that `ble-central.ts` is not in the import closure (mirrors 030 / 031 / 032 / 033 / 034 carryover). Bridge keeps platform-specific imports inside the `.ts` / `.android.ts` / `.web.ts` siblings only; types come from `ble-central.types.ts`. |
| R9 | **Notification burst overwhelms EventLog** — high-frequency notify characteristic produces > 100 events / s. | Low | Low | FR-014: 100 ms render coalescing window in `PeripheralPanel`; the underlying `bytesHex` payload is preserved (no dropped bytes), only the render is debounced. The 20-entry cap drops oldest first. Test asserts hex-equality of the captured payload sequence. |
| R10 | **Bridge module-name collision** — `'BleCentralBridge'` collides with a future Apple-shipped wrapper or third-party library. | Very Low | Low | Distinct module name. No conflict with `'AppIntents'` / `'WidgetCenter'` / `'FocusFilters'` / `'BackgroundTasks'` / `'Spotlight'` / `'QuickLook'` / `'ShareSheet'` / `'ARKitBridge'`. The library itself registers as `'BleClientManager'`; we never expose that name to JS. Test asserts the wrapper export shape. |
| R11 | **Stale-row prune fires mid-render** — peripherals whose `lastSeen` is just past the 30 s threshold disappear during a render commit, surfacing as flicker. | Low | Low | Prune runs in a `setInterval` tick separate from the render loop; the dispatch is batched with React 19's automatic batching. Test verifies the row removal is single-frame and stable. |
| R12 | **Permission denied silently after first denial** — iOS suppresses repeated `NSBluetoothAlwaysUsageDescription` prompts. | Low | Low | PermissionsCard surfaces an "Open Settings" affordance on `denied` / `restricted`; the bridge does not retry the prompt. Spec §"Edge Cases" + R-D classify the surfaced error as `BleNotAuthorized`. |
| R13 | **Library version vendored in the lockfile is incompatible with the latest Expo SDK 55 patch** — autolinking fails on prebuild. | Low | Medium | Choose the latest stable `react-native-ble-plx` minor at branch start that lists Expo SDK 55 in its peer-deps matrix. Quickstart §2 includes a `pnpm prebuild` smoke test that surfaces autolinking errors before merge. |

## Test baseline tracking

- **Branch start**: carried forward from feature 034's completion
  totals (recorded in 034's `plan.md` / `retrospective.md`).
- **Expected delta** (sketch, finalised in `tasks.md`):
  - +1 `manifest.test.ts` suite
  - +3 `screen.{ios,android,web}.test.tsx` suites
  - +1 `useBleCentral.test.tsx` suite
  - +6 component test suites (`StateCard`, `PermissionsCard`,
    `ScanControls`, `DiscoveredList`, `PeripheralPanel`,
    `DisconnectBar`)
  - +1 `ble-central.test.ts` (bridge, all three platforms) suite
  - +1 `with-bluetooth.test.ts` (plugin) suite
  - +1 (optional) `app.json` plugin-entry assertion if the project
    keeps one
  - **Total target**: **≥ +14 suites at completion**.
- Final deltas reported in
  `specs/035-core-bluetooth/retrospective.md`.

## Progress Tracking

- [x] Spec authored and approved (`specs/035-core-bluetooth/spec.md`, 2026-05-07)
- [x] Plan authored — this file (Phase 0 + Phase 1 outline complete)
- [ ] Phase 0 — `research.md` written (resolves R-A through R-G)
- [ ] Phase 1 — `data-model.md`, `contracts/*.md`, `quickstart.md` written
- [ ] `/speckit.tasks` run; `tasks.md` written from the T001-T013 seeds above
- [ ] T001-T011 implemented; `pnpm check` green; baseline delta substituted into "Test baseline tracking"
- [ ] T012 (`pnpm check` gate) signed off
- [ ] T013 (on-device quickstart) signed off on a real iOS 13+ device + Android API 31+ + Chrome + Safari/Firefox fallback
- [ ] `retrospective.md` written; final test totals substituted; merged to main

## Complexity Tracking

> No constitution violations. Section intentionally empty.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|--------------------------------------|
| _(none)_  | _(n/a)_    | _(n/a)_                              |
