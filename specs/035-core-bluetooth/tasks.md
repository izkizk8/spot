---
description: "Task list for feature 035 — Core Bluetooth (BLE Central) Module"
---

# Tasks: Core Bluetooth (BLE Central) Module (035)

**Input**: Design documents from `/specs/035-core-bluetooth/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: REQUIRED. Per plan §"Test-First for New Features" and Constitution V
(v1.1.0), every JS-pure surface ships with tests authored before implementation
(TDD-first). The native iOS / Android sources are owned by the upstream
`react-native-ble-plx` library and are out of scope for this branch's tests;
on-device verification is documented in `quickstart.md`.

**Organization**: Tasks are grouped by **technical layer** in dependency order
(scaffold → setup/dependency → foundational types & error classes → JS bridge
(types-only test, then web, then iOS / Android impl) → utilities (bytes-utils,
well-known-services) → store (peripherals-store) → hook → components →
screens → manifest → registry → config plugin → app.json wiring → final
integration). Each layer follows a strict RED→GREEN cadence: test files are
added first, then the matching implementation.

**Constitution compliance** (encoded in every task):

- NO `eslint-disable` directives anywhere in added or modified code (FR-022).
- The upstream `react-native-ble-plx` library is mocked at the import boundary
  via `jest.mock('react-native-ble-plx')` (FR-021); the bridge is the only file
  that imports the library.
- `with-bluetooth` plugin chains the upstream library plugin **exactly once**
  and is idempotent (SC-008); it preserves any existing
  `NSBluetoothAlwaysUsageDescription` set by another plugin (FR-019).
- `screen.web.tsx` MUST NOT import `src/native/ble-central.ts` at module
  evaluation time (carryover from 030–034 SC-007 discipline).
- `StyleSheet.create()` only (Constitution IV); `ThemedView` / `ThemedText` +
  `Spacing` tokens (Constitution II); `.android.tsx` / `.web.tsx` / `.android.ts`
  / `.web.ts` splits (Constitution III).
- Strictly additive: registry +1, `app.json` `plugins` +1, `package.json`
  `dependencies` +1.
- DiscoveredList soft-cap 100 rows; EventLog soft-cap 20 entries; stale row
  prune at 30 s; notification render coalescing window 100 ms.

## Format: `[ID] [P?] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks).
- All paths are absolute from repository root.
- User-story coverage: T009–T011 (US5 web/Android graceful degradation), T013
  (US1+US5 iOS/Android bridge), T021–T022 (US1 hook state machine), T029–T030
  (US1 StateCard), T031–T032 (US1 PermissionsCard), T033–T034 (US2 ScanControls),
  T035–T036 (US2 DiscoveredList), T037–T040 (US3+US4 PeripheralPanel sub-tree),
  T041–T042 (US4 EventLog), T045–T047 (US1–US5 screen variants),
  T052–T054 (US5 with-bluetooth plugin).

---

## Phase 1: Setup, scaffold & runtime dependency

**Purpose**: Create the directory skeleton, add the runtime dependency
(`react-native-ble-plx`) via `npx expo install`, and stub the empty
`with-bluetooth` plugin directory. No tests in this phase (pure scaffolding;
exercised transitively by every later test).

- [ ] T001 Create directory scaffolding:
  `src/modules/bluetooth-lab/{components,hooks,store,utils}/`,
  `plugins/with-bluetooth/`,
  `test/unit/modules/bluetooth-lab/{components,hooks,store,utils}/`,
  `test/unit/native/`,
  `test/unit/plugins/`.
  - Acceptance: every directory above exists; no source files added yet.
- [ ] T002 Add the runtime dependency: run `npx expo install react-native-ble-plx`
  from the repo root. The command updates `package.json`'s `dependencies` (+1
  entry) and `pnpm-lock.yaml` accordingly. NO devDependency change.
  - Acceptance: `pnpm install` exits 0; `package.json` `dependencies` length
    grows by exactly 1; the new entry is `react-native-ble-plx`; no other
    pinned package changes version.
- [ ] T003 Create `plugins/with-bluetooth/package.json` matching the shape
  used by `plugins/with-arkit/package.json`: `name: 'with-bluetooth'`,
  `version: '1.0.0'`, `main: 'index.ts'`, NO `dependencies` array entry
  (config plugins resolve `@expo/config-plugins` from the host package).
  - Acceptance: file parses as valid JSON;
    `node -e "require('./plugins/with-bluetooth/package.json')"` succeeds.

---

## Phase 2: Foundational types & error classes

**Purpose**: Establish the typed JS bridge surface (`BleCentralBridge`),
all entity unions (`CentralState` / `PermissionStatus` / `ScanState` /
`ScanOptions` / `DiscoveredPeripheral` / `ConnectionState` /
`DiscoveredService` / `DiscoveredCharacteristic` /
`CharacteristicProperty` / `CharacteristicEvent`), and the four typed
error classes (`BleNotSupported`, `BleNotAuthorized`, `BleNotPoweredOn`,
`BleOperationFailed`) that every later test/impl imports. The error
classes have a single identity exported from this file so `instanceof`
round-trips across the three platform variants.

- [ ] T004 Author `src/native/ble-central.types.ts` per
  `contracts/ble-central-bridge.md`: declares `BleCentralBridge`
  interface (11 methods + 4 events), all entity unions, the 4 typed
  error classes, and exports `NATIVE_MODULE_NAME = 'BleCentralBridge'`
  as `as const`.
  - Acceptance: `pnpm typecheck` passes; every later test/impl imports
    from this file; module-name string is `'BleCentralBridge'`
    (verified to not collide with any prior native module).

---

## Phase 3: JS bridge (cross-platform) — RED → GREEN

**Purpose**: The single typed entry point all UI consumes. The bridge is
the **only file** that imports `react-native-ble-plx` (mocked at the
import boundary in tests — FR-021). Tests come first; then web (so the
non-supported path is locked down), then iOS / Android in parallel.

### Bridge tests (RED)

- [ ] T005 Author `test/unit/native/ble-central.test.ts` covering
  `contracts/ble-central-bridge.md` invariants on **all three platforms**:
  - **iOS**: every method delegates to a mocked
    `react-native-ble-plx` `BleManager`; serialisation invariant (R-A —
    two back-to-back `connect()` calls produce two native invocations
    in submission order, even when the first rejects); event
    re-broadcast (R-E) — `onStateChange`, `onPeripheralDiscovered`,
    `onConnectionStateChange`, `onCharacteristicValue` propagate from
    the library's emitter through the typed wrapper exactly once per
    library event.
  - **Android**: identical contract; permission requesting
    delegates to `PermissionsAndroid` mock; runtime permission set
    varies by Android API level (`BLUETOOTH_SCAN` / `BLUETOOTH_CONNECT`
    on API 31+; `ACCESS_FINE_LOCATION` on API ≤30).
  - **Web**: `navigator.bluetooth` stubbed with a
    `BluetoothDevice` / `BluetoothRemoteGATTServer` /
    `BluetoothRemoteGATTCharacteristic` test-double set; exercises
    `requestDevice` → `gatt.connect` → discover → read / write /
    subscribe; no-filter `startScan` is auto-promoted to
    `acceptAllDevices: true` (FR-026); when `navigator.bluetooth`
    is `undefined` every method rejects with a `BleNotSupported`
    instance.
  - **Cross-platform error identity**: each typed error class
    round-trips `instanceof` across the three platform files
    (single class identity from `ble-central.types.ts`).
  - **Web no-eager-import (SC-007)**: `jest.isolateModules` +
    `jest.doMock('src/native/ble-central.ts', () => { throw … })`
    asserts the web bundle does NOT pull in the iOS bridge at module
    evaluation time.
  - Acceptance: test fails (RED) before T006 / T007 / T008 land; each
    `it` block names the exact bridge entry point under test.

### Bridge implementations (GREEN) — three platforms in parallel

- [ ] T006 [P] Implement `src/native/ble-central.web.ts`: Web
  Bluetooth path; uses `navigator.bluetooth.requestDevice` + GATT
  primary service + characteristic ops; closure-scoped `enqueue`
  promise chain wrapping every mutating method (R-A); when
  `navigator.bluetooth` is `undefined` every method throws
  `BleNotSupported`; no-filter scan auto-promoted to
  `acceptAllDevices: true` (FR-026); MUST NOT import
  `src/native/ble-central.ts`.
  - Acceptance: T005 Web branch passes (GREEN); no `eslint-disable`.
- [ ] T007 [P] Implement `src/native/ble-central.ts` (iOS):
  `requireOptionalNativeModule`-style guard plus
  `Platform.OS === 'ios'`; thin wrapper over `react-native-ble-plx`'s
  `BleManager` (the **only** file in the project that imports the
  library); closure-scoped `enqueue` promise chain (R-A); subscribes
  the library's `onStateChange` / `onDeviceDiscovered` /
  `onConnectionStateChange` handlers and re-broadcasts them through a
  typed `EventEmitter` (R-E); re-exports the four typed error classes
  from `ble-central.types.ts`.
  - Acceptance: T005 iOS branch passes (GREEN); no `eslint-disable`.
- [ ] T008 [P] Implement `src/native/ble-central.android.ts`:
  same library wrapper as iOS; Android-only differences confined to
  permission requesting (`PermissionsAndroid` integration; runtime
  permission set varies by API level per research §4); re-exports the
  four typed error classes from `ble-central.types.ts`.
  - Acceptance: T005 Android branch passes (GREEN).

---

## Phase 4: Utilities (`bytes-utils`, `well-known-services`)

**Purpose**: Pure helpers consumed by the hook, the EventLog component,
and the PeripheralPanel sub-tree. Independent of the bridge → can run in
parallel with Phase 3 once T004 lands.

- [ ] T009 [P] Author `test/unit/modules/bluetooth-lab/utils/bytes-utils.test.ts`:
  hex-encode of `Uint8Array` empty / 1 byte / 16 bytes (lowercase, no
  separators); hex-decode round-trip (rejects odd-length and non-hex
  input by throwing a typed error); pretty-format with grouping every
  2 chars and a single space (`'aa bb cc'`); base64 ↔ bytes round-trip
  matches the encoding `react-native-ble-plx` emits on
  `characteristic.value` (R-E); zero-length input returns `''` for all
  formatters.
  - Acceptance: test fails (RED) before T010 lands.
- [ ] T010 [P] Implement `src/modules/bluetooth-lab/utils/bytes-utils.ts`
  exporting `bytesToHex`, `hexToBytes`, `bytesToPrettyHex`,
  `base64ToBytes`, `bytesToBase64`. Pure functions; no I/O.
  - Acceptance: T009 passes (GREEN); no `eslint-disable`.
- [ ] T011 [P] Author
  `test/unit/modules/bluetooth-lab/utils/well-known-services.test.ts`:
  catalog includes the standard SIG short-form UUIDs (e.g.
  `'180f'` → `'Battery Service'`, `'180a'` → `'Device Information'`,
  `'1800'` → `'Generic Access'`, `'1801'` → `'Generic Attribute'`,
  `'180d'` → `'Heart Rate'`); `lookup(uuid)` is case-insensitive and
  accepts both 4-char and 36-char (full 128-bit) forms; unknown UUID
  returns `undefined`; the catalog is `Object.freeze`d.
  - Acceptance: test fails (RED) before T012 lands.
- [ ] T012 [P] Implement
  `src/modules/bluetooth-lab/utils/well-known-services.ts`: frozen
  record of well-known SIG service / characteristic UUID labels +
  `lookup(uuid)` helper.
  - Acceptance: T011 passes (GREEN).

---

## Phase 5: Peripherals store

**Purpose**: Pure reducer-style store handling discovered-peripherals
list semantics (sort, dedup, RSSI update, 30 s stale prune) decoupled
from React. Consumed by the hook.

- [ ] T013 Author
  `test/unit/modules/bluetooth-lab/store/peripherals-store.test.ts`:
  - empty state; `add()` of a `DiscoveredPeripheral` appends; second
    `add()` for the same `id` updates RSSI + `lastSeen` (no
    duplicate); soft-cap 100 rows enforced at the boundary (FR-027 —
    oldest-by-`lastSeen` evicted when 101st row arrives).
  - sort: by RSSI desc, ties by `lastSeen` recency.
  - `prune(now)` removes rows with `lastSeen < now - 30_000`
    (FR-009).
  - `clear()` empties the list.
  - reducer is referentially stable: a no-op `add` (same `id`,
    identical RSSI, identical `lastSeen` ms) returns the same
    array reference (cheap React `memo` integration).
  - Acceptance: test fails (RED) before T014 lands.
- [ ] T014 Implement
  `src/modules/bluetooth-lab/store/peripherals-store.ts` exporting
  the reducer + helpers (`add`, `update`, `prune`, `clear`,
  `selectSorted`, soft-cap constant `DISCOVERED_LIST_CAP = 100`,
  stale window constant `STALE_WINDOW_MS = 30_000`).
  - Acceptance: T013 passes (GREEN); pure functional.

---

## Phase 6: `useBleCentral` hook

**Purpose**: The single state surface the screens consume (FR-024).
Reducer-serialised mutations; subscribes to bridge events on mount;
classifies bridge errors per R-D; on unmount stops scan, unsubscribes
all, disconnects best-effort, detaches all listeners (SC-010).

- [ ] T015 Author
  `test/unit/modules/bluetooth-lab/hooks/useBleCentral.test.tsx`:
  - default mounted state matches the documented shape
    (`central.state === 'unknown'`, `permission === 'undetermined'`,
    `scan.state === 'idle'`, `discovered === []`, `connected ===
    null`, `lastError === null`).
  - `refreshState()` calls the mocked bridge `getState()` and
    propagates `central.state`.
  - `requestPermission()` flips `permission` according to bridge
    return value; on iOS<13 short-circuits to `'granted'` without
    invoking the bridge.
  - `setFilter()` validates UUIDs (4-char or 36-char); invalid input
    surfaces a validation `lastError` and does NOT enter `scan.state
    === 'scanning'`.
  - `setScan(true)` while `central.state !== 'poweredOn'` is a no-op
    + sets a caption on `lastError` (`BleNotPoweredOn`-classified).
  - `onPeripheralDiscovered` events from the bridge build the
    `discovered` list via the peripherals-store (sort/dedup/RSSI
    update); 30 s stale prune fires under `jest.useFakeTimers()`.
  - `connect()` → `discoverServices()` → `discoverCharacteristics()`
    flow populates `connected.services` tree.
  - `read()` / `write()` / `subscribe()` / `unsubscribe()` append the
    right `CharacteristicEvent` rows; `subscribe()` survives a 100 ms
    coalescing window without dropped bytes (FR-014).
  - **Unmount safety (FR-024, SC-010)**: `unmount()` triggers
    `stopScan()`, `unsubscribe()` for every active subscription,
    `disconnect()` best-effort (rejection swallowed), and detaches
    every event listener; advancing 5 s of fake timers post-unmount
    triggers ZERO additional bridge calls.
  - **Error classification (R-D)**: `BleNotSupported` /
    `BleNotAuthorized` / `BleNotPoweredOn` / `BleOperationFailed`
    each map to the correct `lastError` caption.
  - All action functions have stable identities across renders
    (referenced by `useEffect` dependency arrays without re-firing).
  - Acceptance: test fails (RED) before T016 lands; uses
    `jest.mock('src/native/ble-central')` at the import boundary
    (FR-021).
- [ ] T016 Implement
  `src/modules/bluetooth-lab/hooks/useBleCentral.ts`:
  reducer-serialised state per data-model §"State machine";
  `mounted` ref guarding every async resolution; subscribes to the
  bridge's four events on mount; consumes the peripherals-store
  reducer + `STALE_WINDOW_MS` interval (`setInterval(STALE_WINDOW_MS
  / 6)` ≈ 5 s prune cadence — exact cadence aligned with R-D);
  cleanup stops scan, unsubscribes all, disconnects best-effort
  (`.catch(() => undefined)`), and detaches every listener; classifies
  bridge errors per R-D; imports the bridge from `src/native/ble-central`
  only via the platform-resolved entry.
  - Acceptance: T015 passes (GREEN); no `eslint-disable`.

---

## Phase 7: Components — RED (test files first, all parallelisable)

**Purpose**: Pure presentational + light-state components consumed by the
three screen variants. `IOSOnlyBanner` is **REUSED** from prior modules
(017 / 029 / 030 / 031 / 032 / 033 / 034) — NOT redefined here; its usage
in this module is exercised via the screen tests and a usage smoke test.

- [ ] T017 [P] Author
  `test/unit/modules/bluetooth-lab/components/StateCard.test.tsx`:
  6 status pill values (`'poweredOn'` / `'poweredOff'` /
  `'unauthorized'` / `'unsupported'` / `'resetting'` / `'unknown'`);
  Refresh button calls `onRefresh`; caption matches state.
- [ ] T018 [P] Author
  `test/unit/modules/bluetooth-lab/components/PermissionsCard.test.tsx`:
  5 status pill values (`'granted'` / `'denied'` / `'undetermined'` /
  `'restricted'` / `'notApplicable'`); Request button calls
  `onRequest`; Open Settings affordance only on
  `'denied'` / `'restricted'`; iOS<13 short-circuits to `'granted'`
  without invoking `onRequest`.
- [ ] T019 [P] Author
  `test/unit/modules/bluetooth-lab/components/ScanControls.test.tsx`:
  Scan toggle disabled when `central.state !== 'poweredOn'` and an
  inline caption explains why; service-UUID filter input validates
  comma-separated 4-char or 36-char UUIDs (rejects others); Allow
  duplicates switch toggles `onAllowDuplicatesChange`; pill renders
  one of `'idle'` / `'scanning'` / `'paused'`.
- [ ] T020 [P] Author
  `test/unit/modules/bluetooth-lab/components/DiscoveredList.test.tsx`:
  0 / 1 / 100 entries; sort by RSSI desc, ties by `lastSeen` recency;
  row format (name, short id 8 chars, RSSI dBm, service UUIDs short
  form, relative last-seen timestamp); soft cap 100 rendered rows
  with caption when capped; passes `onConnect(row)` to the row
  component.
- [ ] T021 [P] Author
  `test/unit/modules/bluetooth-lab/components/PeripheralRow.test.tsx`:
  one row renders all four data slots (name fallback `'(no name)'`
  when null; id truncated to 8 chars; RSSI dBm + signal-strength
  pill; relative timestamp `'Xs ago'`); Connect button disabled when
  `connectInFlight === true`; tap calls `onConnect`.
- [ ] T022 [P] Author
  `test/unit/modules/bluetooth-lab/components/PeripheralPanel.test.tsx`:
  connection-state pill (4 values: `'connecting'` / `'connected'` /
  `'disconnecting'` / `'disconnected'`); renders a `ServiceRow` per
  service in `connected.services`; Disconnect affordance enabled iff
  `connected !== null`; gracefully renders empty service tree before
  discovery completes.
- [ ] T023 [P] Author
  `test/unit/modules/bluetooth-lab/components/ServiceRow.test.tsx`:
  renders SIG-known service label when matched (via
  `well-known-services.lookup`) else a "Custom service" caption +
  raw UUID; expand/collapse toggles
  `accessibilityState.expanded`; renders one `CharacteristicRow` per
  child characteristic when expanded.
- [ ] T024 [P] Author
  `test/unit/modules/bluetooth-lab/components/CharacteristicRow.test.tsx`:
  property pills (`'read'` / `'write'` / `'writeWithoutResponse'` /
  `'notify'` / `'indicate'`); Read / Write / Subscribe / Unsubscribe
  buttons disabled when matching property absent; subscribed
  indicator visible iff currently subscribed; Read button calls
  `onRead(uuid)`; Write button surfaces a hex-input form and calls
  `onWrite(uuid, bytes)` after validating hex via `bytes-utils`.
- [ ] T025 [P] Author
  `test/unit/modules/bluetooth-lab/components/EventLog.test.tsx`:
  0 / 1 / 20 entries; soft cap 20 (FR-014) — 21st entry evicts the
  oldest; rows render hex-encoded value via `bytesToPrettyHex` +
  ISO-style timestamp; 100 ms render coalescing window enforced
  (under `jest.useFakeTimers()`, 5 events within 100 ms produce one
  render flush; advancing 100 ms produces a second flush);
  `Clear` button calls `onClear`.
- [ ] T026 [P] Author
  `test/unit/modules/bluetooth-lab/components/IOSOnlyBanner.usage.test.tsx`:
  imports the **existing** `IOSOnlyBanner` (no new file under
  `bluetooth-lab/components/`) and asserts it renders with the
  Bluetooth-specific copy passed via props in the screen variants
  (no implementation task — usage smoke test only).

---

## Phase 8: Components — GREEN (implementations, all parallelisable)

- [ ] T027 [P] Implement
  `src/modules/bluetooth-lab/components/StateCard.tsx`. Acceptance: T017 passes.
- [ ] T028 [P] Implement
  `src/modules/bluetooth-lab/components/PermissionsCard.tsx`. Acceptance: T018 passes.
- [ ] T029 [P] Implement
  `src/modules/bluetooth-lab/components/ScanControls.tsx`. Acceptance: T019 passes.
- [ ] T030 [P] Implement
  `src/modules/bluetooth-lab/components/DiscoveredList.tsx`. Slices to 100
  rendered rows at the render boundary (no virtualization). Acceptance: T020 passes.
- [ ] T031 [P] Implement
  `src/modules/bluetooth-lab/components/PeripheralRow.tsx`. Acceptance: T021 passes.
- [ ] T032 [P] Implement
  `src/modules/bluetooth-lab/components/PeripheralPanel.tsx`. Composes
  `ServiceRow` per service entry. Acceptance: T022 passes.
- [ ] T033 [P] Implement
  `src/modules/bluetooth-lab/components/ServiceRow.tsx`. Consumes
  `well-known-services.lookup`. Acceptance: T023 passes.
- [ ] T034 [P] Implement
  `src/modules/bluetooth-lab/components/CharacteristicRow.tsx`. Consumes
  `bytes-utils` for hex validation in the Write form. Acceptance: T024 passes.
- [ ] T035 [P] Implement
  `src/modules/bluetooth-lab/components/EventLog.tsx`. 100 ms render
  coalescing window via `requestAnimationFrame`-style debounced
  `setState`. Acceptance: T025 passes.

---

## Phase 9: Screens (3 platform variants) — RED → GREEN

**Purpose**: Compose the panels in the fixed order from spec §"Overview"
(StateCard → PermissionsCard → ScanControls → DiscoveredList →
PeripheralPanel (conditional) → DisconnectBar / DisconnectAffordance);
enforce that `screen.web.tsx` NEVER imports `src/native/ble-central.ts`
at module evaluation time (SC-007).

### Screen tests (RED)

- [ ] T036 [P] Author
  `test/unit/modules/bluetooth-lab/screen.test.tsx` (iOS): six panels
  render in fixed order; PeripheralPanel only renders when
  `connected !== null`; disconnect affordance disabled while not
  connected; tap on a `PeripheralRow` Connect button calls
  `connect()` via the hook (mocked); end-to-end happy path
  (state → request permission → start scan → connect → discover →
  read) renders the expected accessibility labels at each step.
- [ ] T037 [P] Author
  `test/unit/modules/bluetooth-lab/screen.android.test.tsx`: same six
  panels render; PermissionsCard wires to a `PermissionsAndroid` mock;
  runtime permission set varies by Android API mock (`BLUETOOTH_SCAN`
  / `BLUETOOTH_CONNECT` on API 31+; `ACCESS_FINE_LOCATION` on API
  ≤30); bridge is never called at module evaluation time.
- [ ] T038 [P] Author
  `test/unit/modules/bluetooth-lab/screen.web.test.tsx`: when
  `navigator.bluetooth` is `undefined`, `ScanControls` and
  `DiscoveredList` are replaced by a typed "not supported" notice;
  the `IOSOnlyBanner` is NOT rendered (web path is its own
  branch); statically asserts via `jest.isolateModules` +
  `jest.doMock('src/native/ble-central.ts', () => { throw … })`
  that the web bundle does NOT pull in the iOS bridge at evaluation
  time (SC-007).

### Screen implementations (GREEN)

- [ ] T039 Implement `src/modules/bluetooth-lab/screen.tsx` (iOS
  variant; consumes `useBleCentral`). Acceptance: T036 passes.
- [ ] T040 Implement `src/modules/bluetooth-lab/screen.android.tsx`.
  Acceptance: T037 passes.
- [ ] T041 Implement `src/modules/bluetooth-lab/screen.web.tsx` (must
  not import `src/native/ble-central.ts`). Acceptance: T038 passes —
  including the static-import assertion.

---

## Phase 10: Manifest

- [ ] T042 Author `test/unit/modules/bluetooth-lab/manifest.test.ts`
  per `contracts/bluetooth-lab-manifest.md`: `id ===
  'bluetooth-lab'`; `label === 'Bluetooth (BLE Central)'`;
  `platforms` deep-equals `['ios','android','web']`; `minIOS ===
  '7.0'`. Acceptance: test fails (RED) before T043.
- [ ] T043 Implement `src/modules/bluetooth-lab/index.tsx` exporting
  the `ModuleManifest` (matches manifest test). Acceptance: T042 passes.

---

## Phase 11: Registry integration

- [ ] T044 Modify `src/modules/registry.ts`: +1 import line for
  `bluetoothLab` from `./bluetooth-lab`; +1 array entry appended
  after the 034 (`arkitLab`) entry; no other edits. Re-run existing
  `test/unit/modules/registry.test.ts` (no new test needed — T042
  manifest test covers shape).
  - Acceptance: registry size grows by exactly 1; existing registry
    test passes; ordering preserved.

---

## Phase 12: Expo config plugin (`with-bluetooth`) — RED → GREEN

**Purpose**: `withInfoPlist` mod that sets a default
`NSBluetoothAlwaysUsageDescription` only when absent (preserves any
upstream value) AND chains the upstream `react-native-ble-plx` plugin
exactly once. JS-pure tests against `@expo/config-plugins` (FR-022 /
R-G).

- [ ] T045 Author `test/unit/plugins/with-bluetooth.test.ts` per
  `contracts/with-bluetooth-plugin.md`:
  - **Idempotency (SC-008)**: invoking the plugin twice on the same
    Expo config produces a deep-equal config; no array growth on the
    second pass; `NSBluetoothAlwaysUsageDescription` not duplicated.
  - **Coexistence / preservation (FR-019)**: when an upstream
    `NSBluetoothAlwaysUsageDescription` is already set (simulating
    another plugin running first), `with-bluetooth` preserves the
    value verbatim. When absent, sets the default
    `'Used to demonstrate Core Bluetooth central-role discovery.'`
    (or whichever default is recorded in
    `contracts/with-bluetooth-plugin.md`).
  - **Chain upstream library plugin exactly once (R-G)**: a mocked
    upstream `react-native-ble-plx` plugin is invoked exactly once
    when `with-bluetooth` runs; running `with-bluetooth` twice does
    NOT invoke the upstream plugin twice (chaining is idempotent).
  - **Composes correctly with prior plugins**: when `with-arkit`,
    `with-vision`, `with-camera`, `with-location` (etc.) have already
    populated their respective Info.plist strings, `with-bluetooth`
    leaves all unrelated keys byte-identical (asserts deep-equal of
    the pre-existing keys after the plugin runs).
  - Acceptance: test fails (RED) before T046 lands.
- [ ] T046 Implement `plugins/with-bluetooth/index.ts`: default-export
  `ConfigPlugin` that (1) calls the upstream
  `react-native-ble-plx` plugin via `withPlugins` exactly once, then
  (2) runs an idempotent `withInfoPlist` mod that sets
  `NSBluetoothAlwaysUsageDescription` only when absent. Pure-functional
  (no I/O); resolves `@expo/config-plugins` from the host package.
  - Acceptance: T045 passes (GREEN); no `eslint-disable`.

---

## Phase 13: `app.json` plugin entry

- [ ] T047 Modify `app.json`: append the string
  `"./plugins/with-bluetooth"` to `expo.plugins`; no other edits.
  Order: appended last (after 034's `"./plugins/with-arkit"`).
  - Acceptance: `app.json` parses as valid JSON; `expo.plugins`
    length grows by exactly 1; the new entry is the literal string
    `"./plugins/with-bluetooth"`.
- [ ] T048 [P] (Optional) Extend `test/unit/app-json.test.ts` (or
  create it if absent): assert `expo.plugins` contains
  `'./plugins/with-bluetooth'` exactly once.
  - Acceptance: test passes; if a prior `app-json.test.ts` already
    enforces the list, extend it with the new entry rather than
    duplicating.

---

## Phase 14: Final integration & verification

- [ ] T049 Run `pnpm format` from the repo root.
  - Acceptance: exits 0; no diff produced (no-op final commit per
    plan §"Constraints").
- [ ] T050 Run `pnpm lint` (or `pnpm oxlint` — match the project's
  existing script name).
  - Acceptance: exits 0; ZERO `eslint-disable` directives anywhere
    in the diff (`git diff main -- src plugins | rg 'eslint-disable'`
    returns no matches).
- [ ] T051 Run `pnpm typecheck`.
  - Acceptance: exits 0; no type errors introduced.
- [ ] T052 Run `pnpm test` (Jest Expo).
  - Acceptance: exits 0; suite delta ≥ +14 vs the 034 closing
    baseline (manifest +1, screens +3, hook +1, components +9,
    bytes-utils +1, well-known-services +1, peripherals-store +1,
    bridge +1, plugin +1, optional app.json +1).
- [ ] T053 Run `pnpm check` (composite: format + lint + typecheck +
  test).
  - Acceptance: exits 0.
- [ ] T054 Run on-device quickstart per `quickstart.md` (manual;
  documented, not gated in CI). Verify on a real iOS 13+ device,
  an Android device with API 31+, a Chrome desktop browser, and a
  Safari/Firefox fallback. Run `expo prebuild` and inspect the
  generated `ios/<app>/Info.plist` for a non-empty
  `NSBluetoothAlwaysUsageDescription`; inspect
  `android/app/src/main/AndroidManifest.xml` for the expected
  runtime permissions (`BLUETOOTH_SCAN` / `BLUETOOTH_CONNECT` /
  `ACCESS_FINE_LOCATION` per API level).

---

## Dependencies & ordering

- **T001** (scaffold) blocks every later task (directories must exist).
- **T002** (`react-native-ble-plx` install) blocks T007 / T008
  (iOS / Android bridge impls import the library) and T053 (full
  `pnpm check`).
- **T003** (plugin `package.json`) blocks T046 (plugin impl).
- **T004** (types) blocks T005–T046 (every later test/impl imports
  the shared types and module-name constant).
- **Bridge tests (T005)** precede bridge impls (T006–T008) — TDD
  RED→GREEN.
- **Bridge impls (T006–T008)** block T015 / T016 (hook imports
  bridge) and T036–T041 (screens, indirectly via the hook).
- **Utility tests (T009 / T011)** precede utility impls (T010 / T012);
  utilities block T015 / T016 (hook consumes `bytes-utils`) and
  T024 / T025 (CharacteristicRow / EventLog consume them).
- **Store test (T013)** precedes store impl (T014); store blocks
  T015 / T016 (hook consumes the store).
- **Hook test (T015)** precedes T016; T016 blocks T036–T041.
- **Component tests (T017–T026)** precede component impls
  (T027–T035); no inter-component dependencies (each pair is
  independent).
- **Component impls (T027–T035)** block screen tests (T036–T038)
  only insofar as the screen tests render real components — if
  components are mocked in screen tests this is a soft dependency.
- **Screen tests (T036–T038)** precede screen impls (T039–T041).
- **Manifest (T042 / T043)** is independent of components; can run
  in parallel with Phase 7 / 8 once T004 is done.
- **Registry (T044)** requires T043 (manifest export must exist).
- **Plugin test (T045)** precedes plugin impl (T046).
- **`app.json` (T047)** requires the plugin path to exist on disk
  (T046); T048 (optional test) can run in parallel with T047 once
  T046 is done.
- **T049–T053** are gates that depend on every prior task being
  complete.
- **T054** requires the full pipeline + `expo prebuild` succeeding
  on a Mac with a real iOS 13+ device.

## Parallel execution opportunities

- All `[P]` tasks within a single layer can run concurrently.
- The largest fan-outs:
  - **3 bridge impls in parallel** (T006 / T007 / T008).
  - **2 utility test/impl pairs in parallel** (T009/T010,
    T011/T012).
  - **10 component tests in parallel** (T017–T026).
  - **9 component impls in parallel** (T027–T035).
  - **3 screen tests in parallel** (T036 / T037 / T038).

## Total task count

**54 tasks** (T001–T054). Test files added: 14
(`ble-central.test.ts`, `bytes-utils.test.ts`,
`well-known-services.test.ts`, `peripherals-store.test.ts`,
`useBleCentral.test.tsx`, 9 component tests
[T017–T025; T026 is a usage smoke test — not counted as a new
suite], `screen.test.tsx`, `screen.android.test.tsx`,
`screen.web.test.tsx`, `manifest.test.ts`, `with-bluetooth.test.ts`,
optional `app-json.test.ts` extension). Suite delta target:
**≥ +14 suites** vs the 034 closing baseline.

## User-story coverage matrix

| User story (spec.md) | Priority | Covered by |
|----------------------|----------|------------|
| US1 — Observe central state + permission and scan for advertising peripherals | P1 | T004, T005–T008, T013/T014, T015/T016, T017/T027 (StateCard), T018/T028 (PermissionsCard), T019/T029 (ScanControls), T020/T030 (DiscoveredList), T021/T031 (PeripheralRow), T036/T039, T042/T043, T044 |
| US2 — Connect to a peripheral and discover services / characteristics | P1 | T005 (connect, discover), T015/T016 (hook), T022/T032 (PeripheralPanel), T023/T033 (ServiceRow), T036/T039 |
| US3 — Read / write / subscribe to GATT characteristics | P2 | T005 (read/write/subscribe), T009/T010 (bytes-utils), T011/T012 (well-known-services), T015/T016 (hook), T024/T034 (CharacteristicRow), T025/T035 (EventLog) |
| US4 — Live notification stream rendered without dropped bytes | P2 | T015/T016 (subscribe + 100 ms coalescing window), T025/T035 (EventLog 20-row cap + 100 ms render coalescing) |
| US5 — Cross-platform graceful degradation + plugin-driven prebuild | P3 | T006 (web bridge), T038/T041 (web screen + IOSOnlyBanner usage), T037/T040 (Android), T026 (IOSOnlyBanner usage smoke test), T045/T046 (with-bluetooth plugin), T054 (prebuild verification) |

## MVP scope

User Stories 1 & 2 (both P1) ship the central-state + scan + connect
+ discover flow end-to-end. Minimum task subset for an MVP demoable
build:

**T001 → T002 → T003 → T004 → T005 / T006 / T007 / T008 →
T009/T010 → T013/T014 → T015/T016 → T017/T027 (StateCard) →
T018/T028 (PermissionsCard) → T019/T029 (ScanControls) →
T020/T030 (DiscoveredList) → T021/T031 (PeripheralRow) →
T022/T032 (PeripheralPanel) → T023/T033 (ServiceRow) →
T036/T039 (iOS screen) → T042/T043 → T044 → T045/T046 → T047 →
T049–T053.**

Stories US3–US5 are layered on top without touching MVP files.

## Risks (carried forward from plan §Risks)

- **R1** (plugin clobbers an upstream `NSBluetoothAlwaysUsageDescription`):
  mitigated by T045's coexistence test; plugin only sets the default
  when **absent**.
- **R2** (`with-bluetooth` invokes the upstream library plugin twice):
  mitigated by T045's chain-exactly-once test (mocked upstream plugin
  invocation count asserted).
- **R3** (bridge concurrency anomaly): mitigated by T005's
  serialisation invariant (R-A).
- **R4** (browsers without `navigator.bluetooth` crash on import):
  mitigated by T006's `BleNotSupported` rejection path and T038's
  static-import assertion (SC-007).
- **R5** (post-unmount bridge calls leak listeners or pending
  promises): mitigated by T015's unmount-safety test (zero
  post-unmount calls — SC-010) and T016's cleanup path (FR-024).
- **R6** (peripheral-list memory growth): mitigated by T013's
  soft-cap-100 + 30 s prune tests (FR-009 / FR-027).
- **R7** (notification stream drops bytes under fast emit cadence):
  mitigated by T025's 100 ms render coalescing test (FR-014).
- **R8** (bridge module-name collision with prior modules): mitigated
  by T004's distinct `NATIVE_MODULE_NAME = 'BleCentralBridge'`
  constant.

Constitution v1.1.0 is **strictly additive** for this feature: registry
+1, `app.json` `plugins` +1, `package.json` `dependencies` +1, no theme
tokens, no `eslint-disable` directives, no Swift / Kotlin sources.
