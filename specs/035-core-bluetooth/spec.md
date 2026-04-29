# Feature Specification: Core Bluetooth (BLE Central) Module

**Feature Branch**: `035-core-bluetooth`
**Feature Number**: 035
**Created**: 2026-05-07
**Status**: Approved (autonomous, no clarifications needed)
**Input**: iOS 7+ educational module showcasing Core Bluetooth as a
`CBCentralManager`: scanning for peripherals, connecting,
discovering services and characteristics, and reading / writing /
subscribing to characteristics. Adds a "Bluetooth (BLE Central)"
card to the 006 iOS Showcase registry (`id: 'bluetooth-lab'`,
`platforms: ['ios','android','web']`, `minIOS: '7.0'`). Native
side reuses the well-maintained `react-native-ble-plx` library
(Expo-compatible via its config plugin); no custom Swift is
required. JS bridge `src/native/ble-central.ts` exposes a stable
typed surface (`getState`, `requestPermission`, `startScan`,
`stopScan`, `connect`, `disconnect`, `discoverServices`,
`discoverCharacteristics`, `readCharacteristic`,
`writeCharacteristic`, `subscribeCharacteristic`) so the screen
is independent of the underlying library. Android delegates to
the same library; Web uses the Web Bluetooth API when available
and otherwise renders a "not supported" notice. A new config
plugin `plugins/with-bluetooth/` composes the upstream
`react-native-ble-plx` plugin with project defaults (the
`NSBluetoothAlwaysUsageDescription` string and Android runtime
permissions); the wrapper is idempotent. Branch parent is
`034-arkit-basics`. Additive only: registry +1, `app.json`
`plugins` +1.

## Overview

The Bluetooth Lab module ("Bluetooth (BLE Central)") is a feature
card in the 006 iOS Showcase registry (`id: 'bluetooth-lab'`,
label `"Bluetooth (BLE Central)"`,
`platforms: ['ios','android','web']`, `minIOS: '7.0'`). Tapping
the card opens a single screen with six panels arranged in a
fixed top-to-bottom order:

1. **StateCard** — read-only summary of the central manager
   state. A status pill shows one of **poweredOn**,
   **poweredOff**, **unauthorized**, **unsupported**,
   **resetting**, or **unknown**, with a **Refresh** button that
   re-reads the state from the bridge. A short caption explains
   the current state in plain language (e.g.,
   "Bluetooth is off — enable it in Settings to scan").
2. **PermissionsCard** — the current Bluetooth permission status
   pill (**granted** / **denied** / **undetermined** /
   **restricted**) and a **Request** button. On iOS 13+ this
   triggers the `NSBluetoothAlwaysUsageDescription` prompt; on
   iOS < 13 the system has no separate Bluetooth permission and
   the card reports **granted** by definition. On Android the
   button requests the runtime permissions installed by the
   plugin (`BLUETOOTH_SCAN`, `BLUETOOTH_CONNECT` on API 31+;
   `ACCESS_FINE_LOCATION` on API 30 and below). On Web the card
   reports **not applicable** because Web Bluetooth permissions
   are origin-scoped and granted per-device-pick at scan time.
3. **ScanControls** — a single **Scan** toggle (off / on), an
   optional service-UUID filter input (a comma-separated list of
   UUID strings, validated client-side), and an
   **Allow duplicates** switch. A status pill shows
   **idle** / **scanning** / **paused**. Toggling Scan on with
   the manager not in `poweredOn` state shows an inline
   explanation and does not invoke the bridge.
4. **DiscoveredList** — a live-updating list of advertising
   peripherals seen during the current scan. Each row shows the
   peripheral's `name` (or "(no name)"), the short identifier
   (first 8 chars of the UUID), the latest **RSSI** in dBm,
   advertised service UUIDs (short form), a relative
   **last-seen** timestamp (e.g., "just now", "3 s ago"), and a
   **Connect** button. The list auto-sorts by RSSI descending
   (strongest signal first); ties are broken by last-seen
   recency. A row is removed if it has not been seen in the last
   30 seconds (configurable; default documented).
5. **PeripheralPanel** — visible only when a peripheral is
   connected. Shows the peripheral's identifier, name, current
   **connection state** pill (**connecting** / **connected** /
   **disconnecting** / **disconnected**), and a tree of
   discovered services. Each ServiceRow shows the service UUID
   (short form when well-known, otherwise full UUID) and an
   expandable list of characteristics. Each CharacteristicRow
   shows the characteristic UUID, its declared properties
   (`read`, `write`, `writeWithoutResponse`, `notify`,
   `indicate`), and four actions: **Read**, **Write** (sends a
   one-byte test payload `0x01` by default; payload is
   configurable in a small inline input), **Subscribe**, and
   **Unsubscribe**. A per-characteristic **EventLog** records
   the last 20 read results and notification payloads as
   timestamped rows showing the bytes in hex.
6. **Disconnect bar** — a fixed-height row at the bottom
   containing a **Disconnect** primary button (enabled only when
   a peripheral is connected) and a duplicate connection-state
   pill for at-a-glance visibility while scrolling the
   PeripheralPanel.

The module is fully self-contained inside
`src/modules/bluetooth-lab/`. iOS and Android both delegate to
`react-native-ble-plx` through a thin JS wrapper at
`src/native/ble-central.ts` so the screen never imports the
library directly. Web uses the browser's Web Bluetooth API
behind the same wrapper when available; if not, an
`IOSOnlyBanner`-style "not supported" notice replaces the
ScanControls and DiscoveredList while the rest of the UI shell
remains visible (educational content stays legible).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Inspect central manager state and permissions (Priority: P1)

A user opens the Bluetooth (BLE Central) card on an iOS device,
sees the current central manager state and Bluetooth permission
status, and (on iOS 13+) taps **Request** to grant Bluetooth
permission for the first time.

**Why this priority**: Core Bluetooth requires the central
manager to be `poweredOn` and (on iOS 13+) the Bluetooth
permission to be authorised before any other API call has a
defined behaviour. Surfacing this state is the foundational
teaching point of the module.

**Independent Test**: Open the module on an iOS 13+ device that
has not granted Bluetooth permission and verify the
PermissionsCard shows **undetermined** and the StateCard shows
**unknown** (or **unauthorized**). Tap **Request**, accept the
system prompt, and verify both pills update within 2 seconds.

**Acceptance Scenarios**:

1. **Given** an iOS 13+ device on which Bluetooth permission is
   undetermined, **When** the screen mounts, **Then** the
   PermissionsCard pill shows **undetermined** and the **Request**
   button is enabled.
2. **Given** the user taps **Request** and accepts the system
   prompt, **When** the bridge resolves, **Then** the pill
   transitions to **granted** and the StateCard re-reads its
   state (typically **poweredOn** if Bluetooth is on).
3. **Given** the device's Bluetooth radio is off, **When** the
   screen mounts (regardless of permission), **Then** the
   StateCard pill shows **poweredOff** and a caption explains
   how to enable Bluetooth in Settings.

---

### User Story 2 - Scan for peripherals and observe live results (Priority: P1)

A user with Bluetooth permission granted and the radio
**poweredOn** toggles **Scan** on, optionally enters a service
UUID filter, and watches the DiscoveredList populate with
nearby peripherals sorted by RSSI.

**Why this priority**: Scanning is the second core capability
and the most visually demonstrable; it exercises the bridge
event stream end-to-end and is required before any connect
flow.

**Independent Test**: With the manager in **poweredOn** and at
least one advertising BLE peripheral nearby (e.g., a phone in
peripheral mode or a BLE beacon), toggle **Scan** on and verify
at least one row appears in the DiscoveredList within 5 seconds,
that the row updates its RSSI as new advertisements arrive, and
that toggling **Scan** off freezes the list.

**Acceptance Scenarios**:

1. **Given** the manager is **poweredOn** and permission is
   **granted**, **When** the user toggles **Scan** on with no
   filter, **Then** the bridge receives `startScan({})`, the
   ScanControls pill shows **scanning**, and discovered
   peripherals appear in the DiscoveredList sorted by RSSI
   descending within 5 seconds.
2. **Given** an active scan, **When** the user toggles **Scan**
   off, **Then** the bridge receives `stopScan()`, the pill
   shows **idle**, and existing rows remain in the list (frozen)
   until the user re-toggles scan or unmounts the screen.
3. **Given** an active scan and an entered service-UUID filter,
   **When** the bridge accepts the filter, **Then** subsequently
   discovered peripherals are restricted to those advertising at
   least one of the filtered UUIDs.
4. **Given** **Allow duplicates** is **on**, **When** the same
   peripheral re-advertises, **Then** the row's RSSI and
   last-seen timestamp update on every advertisement; with the
   toggle **off**, updates are coalesced (RSSI updated, no
   duplicate row).
5. **Given** the manager is not **poweredOn**, **When** the user
   toggles **Scan** on, **Then** the bridge is NOT invoked, an
   inline caption explains the requirement, and the pill stays
   **idle**.

---

### User Story 3 - Connect to a peripheral and discover services (Priority: P1)

A user picks a row in the DiscoveredList, taps **Connect**, and
sees the PeripheralPanel populate with the peripheral's
services and characteristics after the connection completes and
discovery runs.

**Why this priority**: Connect + discover is the gateway to all
GATT operations (read / write / subscribe); without it the
remaining stories cannot run. It exercises the full bridge
round-trip on connection callbacks and is the typical first
"useful" thing a developer wants to see.

**Independent Test**: With at least one row in the
DiscoveredList, tap **Connect**, verify the connection-state
pill transitions **connecting** → **connected** within 10
seconds, and the PeripheralPanel shows at least one ServiceRow
with at least one CharacteristicRow.

**Acceptance Scenarios**:

1. **Given** a row in the DiscoveredList, **When** the user taps
   **Connect**, **Then** the bridge receives
   `connect(peripheralId)`, the connection-state pill shows
   **connecting**, and on success transitions to **connected**.
2. **Given** a connected peripheral, **When**
   `discoverServices` and `discoverCharacteristics` resolve,
   **Then** the PeripheralPanel renders one ServiceRow per
   service and one CharacteristicRow per characteristic with
   declared properties visible.
3. **Given** a connection attempt fails (timeout, out of range,
   peripheral refused), **When** the bridge rejects, **Then**
   the connection-state pill shows **disconnected**, an inline
   error caption shows the failure reason, and no
   PeripheralPanel is rendered.

---

### User Story 4 - Read, write, and subscribe to a characteristic (Priority: P2)

With a connected peripheral, the user picks a characteristic,
taps **Read** to read its current value, taps **Write** to send
a one-byte test payload, taps **Subscribe** to start receiving
notifications, and observes incoming bytes in the
per-characteristic EventLog.

**Why this priority**: Read / write / subscribe is the third
core teaching point. It validates that the bridge correctly
maps GATT operations and that notifications stream into the JS
side without dropping events.

**Independent Test**: Pick a characteristic that declares
`read`, tap **Read**, verify a hex-encoded byte string appears
in the EventLog within 2 seconds. Pick a characteristic that
declares `notify`, tap **Subscribe**, and verify subsequent
notifications append to the EventLog at their arrival time.

**Acceptance Scenarios**:

1. **Given** a CharacteristicRow that declares `read`, **When**
   the user taps **Read**, **Then** the bridge receives
   `readCharacteristic(charId)`, the resolved bytes are appended
   to the EventLog as a hex string with a timestamp, and the
   EventLog retains the last 20 entries (older entries dropped).
2. **Given** a CharacteristicRow that declares `write` or
   `writeWithoutResponse`, **When** the user taps **Write**,
   **Then** the bridge receives
   `writeCharacteristic(charId, bytes, withoutResponse)` with
   the configured payload (default `0x01`) and the appropriate
   `withoutResponse` flag based on the characteristic's
   declared property; success appends a "wrote N bytes" entry
   to the EventLog.
3. **Given** a CharacteristicRow that declares `notify`,
   **When** the user taps **Subscribe**, **Then** the bridge
   receives `subscribeCharacteristic(charId)`, an active
   subscription indicator appears on the row, and each
   notification appends a hex-encoded entry to the EventLog.
4. **Given** an active subscription, **When** the user taps
   **Unsubscribe**, **Then** the bridge tears down the
   subscription, the indicator clears, and no further
   notification entries are appended.
5. **Given** a characteristic that does not declare a property,
   **When** the screen renders, **Then** the corresponding
   action button is visibly disabled (e.g., **Read** disabled
   for write-only characteristics).

---

### User Story 5 - Disconnect and clean up (Priority: P2)

A user taps **Disconnect** on the bottom bar, observes the
connection-state transition, sees the PeripheralPanel
disappear, and confirms that no further notifications arrive in
the EventLog.

**Why this priority**: Disconnect correctness is required to
avoid leaking native subscriptions and to coexist with screen
navigation (no leaked listeners on unmount). It is the
counterpart to Story 3 and is required by the constitution's
"no leaked native resources" rule.

**Independent Test**: With a connected peripheral and at least
one active subscription, tap **Disconnect**; verify the pill
shows **disconnecting** then **disconnected** within 5 seconds,
the PeripheralPanel disappears, and no further notification
entries are appended for at least 5 seconds.

**Acceptance Scenarios**:

1. **Given** a connected peripheral, **When** the user taps
   **Disconnect**, **Then** the bridge receives
   `disconnect(peripheralId)`, the pill shows **disconnecting**
   then **disconnected**, and the PeripheralPanel is removed
   from the layout.
2. **Given** active subscriptions at disconnect time, **When**
   the disconnect completes, **Then** all subscriptions are
   torn down by the bridge and no further notification entries
   are appended to any EventLog.
3. **Given** the user navigates away from the screen while
   connected, **When** the screen unmounts, **Then** the hook
   calls `disconnect` (best-effort) and detaches all event
   listeners; no callback fires after unmount.

---

### User Story 6 - Cross-platform fallback on Android and Web (Priority: P3)

A user runs the same module on Android (full functional parity
via `react-native-ble-plx`) and on Web (Web Bluetooth API where
available; otherwise a "not supported" notice).

**Why this priority**: Constitution v1.1.0 requires graceful
non-iOS fallbacks; the user description explicitly enumerates
Android (full parity through the same library) and Web
(progressive enhancement via Web Bluetooth API). The educational
UI shape is itself part of the lesson and must remain visible
on every platform.

**Independent Test**: On Android, run the same scan / connect /
read flow and verify parity with iOS. On a Web browser without
Web Bluetooth support (e.g., Safari, Firefox), verify the
ScanControls and DiscoveredList are replaced by a
"not supported" notice while StateCard, PermissionsCard, and
the disconnect bar still render.

**Acceptance Scenarios**:

1. **Given** the platform is Android, **When** the screen
   mounts and runtime permissions are granted, **Then** scan,
   connect, discover, read, write, and subscribe behave
   identically to iOS within the limits of `react-native-ble-plx`'s
   Android backend.
2. **Given** the platform is Web and the browser exposes
   `navigator.bluetooth`, **When** the user toggles **Scan**,
   **Then** the wrapper invokes `requestDevice` with the
   service-UUID filter and treats the chosen device as a single
   discovered row (Web Bluetooth does not expose continuous
   advertising scans); connect / discover / read / write / notify
   then proceed via the standard Web Bluetooth API.
3. **Given** the platform is Web and `navigator.bluetooth` is
   absent, **When** the screen mounts, **Then** the
   ScanControls and DiscoveredList areas are replaced by a
   "Web Bluetooth not supported in this browser" notice, all
   bridge calls throw `BleNotSupported`, and no error is
   surfaced as an unhandled rejection.
4. **Given** any non-iOS / non-Android / non-Web platform
   (theoretical), **When** any bridge method is invoked,
   **Then** it throws a typed `BleNotSupported` error.

### Edge Cases

- Bluetooth radio is **poweredOff** when the screen mounts →
  StateCard pill shows **poweredOff**, ScanControls disabled
  with caption, no bridge calls invoked.
- Bluetooth permission **denied** on iOS 13+ → PermissionsCard
  shows **denied** with an "Open Settings" affordance; bridge
  calls that require the manager all reject with a typed
  `BlePermissionDenied` error.
- Manager state transitions to **resetting** mid-scan → the
  scan pill flips to **paused**, existing DiscoveredList rows
  are kept, and a caption explains the transient state; the
  scan auto-resumes when the manager returns to **poweredOn**
  (only if the user did not toggle Scan off in the interim).
- Service UUID filter input contains an invalid UUID → input
  shows an inline validation error, **Scan** stays disabled
  until the input is corrected or cleared.
- A peripheral row is tapped to connect while a previous
  connection is still in progress → the new connect attempt is
  rejected with a "connection in progress" error and an inline
  caption suggests **Disconnect** first.
- Read / write on a characteristic without the matching
  declared property → action button is disabled at the UI
  layer; if invoked programmatically, the bridge rejects with
  a typed `BleOperationNotSupported` error.
- A subscribed characteristic disconnects unexpectedly (e.g.,
  out of range) → the connection-state pill shows
  **disconnected**, the EventLog appends a "disconnected" row,
  and active subscription indicators clear.
- Notifications arrive faster than the EventLog can render →
  the EventLog applies a 100ms render coalescing window and
  drops nothing; bytes are preserved in their arrival order.
- Per-characteristic EventLog is capped at 20 entries (oldest
  dropped). DiscoveredList has a soft cap of 100 rendered
  rows; rows past the cap are still tracked internally for
  sort but not rendered.
- Scan started on Web with no service-UUID filter → Web
  Bluetooth requires either filters or `acceptAllDevices`; the
  wrapper auto-promotes a no-filter scan to
  `acceptAllDevices: true` and surfaces a one-time caption
  explaining the difference.
- Plugin runs alongside any prior plugin that already declares
  `NSBluetoothAlwaysUsageDescription` → the with-bluetooth
  plugin is idempotent and MUST NOT clobber an existing
  non-empty value (last-wins semantics with deterministic
  ordering is acceptable provided both strings are non-empty).
- App backgrounded mid-scan → the bridge surfaces the
  underlying library's behaviour (state-restoration is out of
  scope for v1); on resume, the StateCard re-reads state and
  the user must re-toggle scan if it was stopped by the OS.
- Module unmount while connected and subscribed → the hook
  unsubscribes, disconnects (best-effort), and detaches all
  listeners; no callback fires after unmount.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST register a **Bluetooth (BLE
  Central)** card in the 006 iOS Showcase registry with
  `id: 'bluetooth-lab'`, `platforms: ['ios','android','web']`,
  and `minIOS: '7.0'`.
- **FR-002**: Tapping the registry card MUST navigate to the
  Bluetooth Lab module screen.
- **FR-003**: The screen MUST render six panels in a fixed
  top-to-bottom order: StateCard, PermissionsCard, ScanControls,
  DiscoveredList, PeripheralPanel (visible only when connected),
  and the disconnect bar.
- **FR-004**: StateCard MUST display a status pill with values
  **poweredOn**, **poweredOff**, **unauthorized**,
  **unsupported**, **resetting**, or **unknown**, and a
  **Refresh** button that re-reads the manager state via
  `bleCentral.getState()`.
- **FR-005**: PermissionsCard MUST display the Bluetooth
  permission status (**granted** / **denied** /
  **undetermined** / **restricted** / **not applicable**) and a
  **Request** button that calls `bleCentral.requestPermission()`.
  On iOS < 13, the card MUST report **granted** without
  invoking the bridge.
- **FR-006**: ScanControls MUST expose a Scan toggle, a
  service-UUID filter input (comma-separated UUID strings,
  validated client-side), an **Allow duplicates** toggle, and a
  status pill (**idle** / **scanning** / **paused**).
  Toggling Scan on while the manager is not **poweredOn** MUST
  NOT invoke the bridge and MUST show an explanatory caption.
- **FR-007**: When **Scan** is toggled on, the system MUST call
  `bleCentral.startScan({ serviceUUIDs?, allowDuplicates })`
  and update the DiscoveredList from the resulting event
  stream; toggling off MUST call `bleCentral.stopScan()`.
- **FR-008**: DiscoveredList MUST render one row per
  advertising peripheral showing name (or "(no name)"), short
  identifier (first 8 chars of the UUID), latest RSSI in dBm,
  advertised service UUIDs (short form when well-known), a
  relative last-seen timestamp, and a **Connect** button.
  Rows MUST auto-sort by RSSI descending; ties broken by
  last-seen recency.
- **FR-009**: A row MUST be removed from the DiscoveredList if
  it has not been seen in the last 30 seconds (configurable;
  default documented).
- **FR-010**: Tapping **Connect** on a row MUST call
  `bleCentral.connect(peripheralId)`; on success the screen
  MUST automatically run `discoverServices(peripheralId)`
  followed by `discoverCharacteristics(serviceId)` for each
  service.
- **FR-011**: PeripheralPanel MUST render only when a
  peripheral is connected and MUST show identifier, name,
  connection-state pill, and a tree of services and
  characteristics. Each CharacteristicRow MUST surface the
  declared properties (`read`, `write`, `writeWithoutResponse`,
  `notify`, `indicate`).
- **FR-012**: Each CharacteristicRow MUST expose **Read**,
  **Write**, **Subscribe**, and **Unsubscribe** actions.
  Buttons MUST be visibly disabled when the corresponding
  declared property is absent.
- **FR-013**: **Read** MUST call
  `bleCentral.readCharacteristic(charId)` and append the
  result to the per-characteristic EventLog as a timestamped
  hex string. **Write** MUST call
  `bleCentral.writeCharacteristic(charId, bytes, withoutResponse)`
  with the configured payload (default `0x01`) and the
  appropriate `withoutResponse` flag; success appends a
  "wrote N bytes" entry. **Subscribe** MUST call
  `bleCentral.subscribeCharacteristic(charId)`; each
  notification MUST append a hex-encoded entry to the
  EventLog. **Unsubscribe** MUST tear down the subscription.
- **FR-014**: Each per-characteristic EventLog MUST retain the
  last 20 entries (oldest dropped) and MUST coalesce bursts
  through a 100ms render window without dropping bytes.
- **FR-015**: The disconnect bar MUST render a **Disconnect**
  button (enabled only when a peripheral is connected) and a
  duplicate connection-state pill. Tapping it MUST call
  `bleCentral.disconnect(peripheralId)`; on completion the
  PeripheralPanel MUST be removed and all subscriptions torn
  down.
- **FR-016**: The JS bridge `src/native/ble-central.ts` MUST
  expose the following stable typed surface independent of the
  underlying library: `getState()`, `requestPermission()`,
  `startScan(opts)`, `stopScan()`, `connect(id)`,
  `disconnect(id)`, `discoverServices(id)`,
  `discoverCharacteristics(serviceId)`,
  `readCharacteristic(charId)`,
  `writeCharacteristic(charId, bytes, withoutResponse)`, and
  `subscribeCharacteristic(charId)`.
- **FR-017**: On iOS and Android the bridge MUST delegate to
  `react-native-ble-plx`. On Web the bridge MUST delegate to
  the Web Bluetooth API (`navigator.bluetooth`) when available.
  On any other platform, or on Web without `navigator.bluetooth`,
  every bridge method MUST throw a typed `BleNotSupported`
  error.
- **FR-018**: A new config plugin `plugins/with-bluetooth/`
  MUST compose `react-native-ble-plx`'s upstream plugin with
  project defaults: `NSBluetoothAlwaysUsageDescription` on
  iOS and the matching Android runtime permissions
  (`BLUETOOTH_SCAN`, `BLUETOOTH_CONNECT`,
  `ACCESS_FINE_LOCATION` per Android API level).
- **FR-019**: The plugin MUST be idempotent: running the
  modifier twice MUST produce a byte-identical `Info.plist`
  outcome and a byte-identical `AndroidManifest.xml` outcome;
  an existing `NSBluetoothAlwaysUsageDescription` MUST NOT be
  silently dropped — the plugin's value applies only when no
  upstream value is present.
- **FR-020**: The module MUST NOT modify any existing registry
  entry or any prior feature's plugin; the registry change is
  one new card and the `app.json` change is one new `plugins`
  entry (`with-bluetooth`).
- **FR-021**: All native bridge entry points MUST be mocked at
  the import boundary in tests; no test MUST require a live
  iOS or Android runtime, simulator, or BLE peripheral. Web
  Bluetooth tests MUST stub `navigator.bluetooth`.
- **FR-022**: The module MUST run `pnpm format` before its
  final commit and MUST NOT add any `eslint-disable`
  directives.
- **FR-023**: Bridge errors MUST surface as inline captions
  (or in the relevant EventLog), MUST NOT crash the screen,
  and MUST NOT surface as unhandled promise rejections.
- **FR-024**: On screen unmount the hook MUST stop scanning
  (best-effort), unsubscribe all active characteristic
  subscriptions, disconnect the active peripheral
  (best-effort), and detach all event listeners; no callback
  MUST fire after unmount.
- **FR-025**: When the manager is **poweredOff**,
  **unauthorized**, **unsupported**, **resetting**, or
  **unknown**, ScanControls and DiscoveredList controls MUST
  be visibly disabled with an explanatory caption and MUST NOT
  invoke the bridge. The PeripheralPanel, if currently visible,
  MUST switch its connection-state pill to **disconnected**
  when the manager transitions out of **poweredOn**.
- **FR-026**: On Web, a no-filter scan MUST be auto-promoted
  to `acceptAllDevices: true` (a Web Bluetooth requirement)
  and the UI MUST surface a one-time caption explaining the
  difference between continuous scanning (iOS/Android) and
  the per-pick model (Web).
- **FR-027**: The DiscoveredList MUST cap rendering at 100
  rows (sorted by RSSI); additional peripherals MUST still be
  tracked internally for sort but MUST NOT be rendered. This
  cap is documented and not user-configurable in v1.

### Key Entities

- **CentralState**: a string enum
  `'poweredOn' | 'poweredOff' | 'unauthorized' | 'unsupported' | 'resetting' | 'unknown'`,
  driving the StateCard pill. Mapped from
  `CBCentralManagerState` (iOS), the equivalent Android adapter
  state, and the Web Bluetooth `availability` signal.
- **PermissionStatus**: a string enum
  `'granted' | 'denied' | 'undetermined' | 'restricted' | 'notApplicable'`,
  driving the PermissionsCard pill.
- **ScanState**: a string enum `'idle' | 'scanning' | 'paused'`,
  driving the ScanControls pill.
- **ScanOptions**: `{ serviceUUIDs?: string[], allowDuplicates: boolean }`
  — the option bag passed to `startScan`. UUID strings are
  validated client-side.
- **DiscoveredPeripheral**: `{ id: string, name: string | null,
  rssi: number, serviceUUIDs: string[], lastSeen: number,
  manufacturerData?: Uint8Array }` — the JS-side projection of
  one advertising peripheral. The list de-duplicates by `id`
  unless **Allow duplicates** is on.
- **ConnectionState**: a string enum
  `'connecting' | 'connected' | 'disconnecting' | 'disconnected'`,
  driving the PeripheralPanel and disconnect-bar pills.
- **DiscoveredService**: `{ id: string, uuid: string,
  isWellKnown: boolean, characteristics: DiscoveredCharacteristic[] }`.
- **DiscoveredCharacteristic**: `{ id: string, uuid: string,
  serviceId: string, properties: CharacteristicProperty[],
  isSubscribed: boolean }`.
- **CharacteristicProperty**: a string enum
  `'read' | 'write' | 'writeWithoutResponse' | 'notify' | 'indicate'`.
- **CharacteristicEvent**: `{ kind: 'read' | 'write' | 'notify' | 'error',
  bytesHex: string, byteLength: number, at: number,
  message?: string }` — one row in the per-characteristic
  EventLog. The log retains the last 20 entries.
- **BleCentralBridge** (the typed surface of
  `src/native/ble-central.ts`): the union of the methods listed
  in FR-016 plus an event emitter exposing
  `onStateChange`, `onPeripheralDiscovered`,
  `onConnectionStateChange`, and `onCharacteristicValue`.
- **BleNotSupported**: typed error thrown by all bridge methods
  on unsupported platforms (and on Web when
  `navigator.bluetooth` is absent); carries a stable `code`
  field.
- **BlePermissionDenied**: typed error thrown by bridge methods
  that require Bluetooth permission when the permission is
  **denied** or **restricted**.
- **BleOperationNotSupported**: typed error thrown by
  read / write / subscribe when the characteristic does not
  declare the matching property.
- **BluetoothLabState** (hook state): `{ central: CentralState,
  permission: PermissionStatus, scan: ScanState,
  discovered: DiscoveredPeripheral[],
  connected: { peripheral: DiscoveredPeripheral,
  services: DiscoveredService[],
  connectionState: ConnectionState,
  events: Record<string, CharacteristicEvent[]> } | null,
  lastError?: string }` plus actions `setScan`, `setFilter`,
  `setAllowDuplicates`, `connect`, `disconnect`, `read`,
  `write`, `subscribe`, `unsubscribe`, `requestPermission`,
  and `refreshState`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: On a supported iOS or Android device with
  Bluetooth on and permission granted, a user can launch the
  screen and observe at least one nearby advertising
  peripheral in the DiscoveredList within 5 seconds of
  toggling **Scan** on (in an environment with at least one
  reachable BLE peripheral).
- **SC-002**: Tapping **Connect** on a discovered peripheral
  transitions the connection-state pill from **connecting** to
  **connected** within 10 seconds in 95% of attempts on a
  reachable, non-bonded peripheral.
- **SC-003**: After a successful connection, the
  PeripheralPanel renders at least one ServiceRow and at least
  one CharacteristicRow within 5 seconds of the **connected**
  transition in 100% of attempts where the peripheral exposes
  at least one GATT service.
- **SC-004**: For a characteristic declaring `read`, **Read**
  returns a hex-encoded byte string in the EventLog within 2
  seconds in 95% of attempts; for a characteristic declaring
  `notify`, **Subscribe** results in at least one notification
  EventLog row within the peripheral's nominal notification
  interval (no dropped bytes verified by hex-equality assertion
  in tests with a stubbed bridge).
- **SC-005**: `pnpm test` for the module's test suite passes
  with 100% pass rate; project-wide `pnpm check` is green
  (lint, types, tests).
- **SC-006**: On Web browsers without `navigator.bluetooth`,
  no bridge call produces an unhandled promise rejection or
  visible crash across all panel interactions; a "not
  supported" notice replaces the ScanControls and
  DiscoveredList while the rest of the UI remains visible.
- **SC-007**: The module adds exactly one registry entry, one
  `app.json` `plugins` entry (`with-bluetooth`), and zero
  modifications to any prior feature's files outside the
  registry index, the module folder, the native folder, and
  `app.json`.
- **SC-008**: Running `expo prebuild` (or the project's
  equivalent plugin-application step) twice produces a
  byte-identical `Info.plist` and `AndroidManifest.xml`
  outcome (plugin idempotency).
- **SC-009**: After **Disconnect**, no further notification
  EventLog rows are appended for at least 5 seconds and all
  active subscriptions are torn down (verified by zero
  post-disconnect calls to the subscription callback in
  tests).
- **SC-010**: After screen unmount, no scan callback,
  connection callback, or characteristic-value callback fires
  (verified by tests asserting zero post-unmount calls to any
  bridge listener).
- **SC-011**: First-time users complete the full demo flow
  (launch → grant permission → start scan → connect to a
  picked peripheral → read one characteristic → disconnect)
  in under 90 seconds without consulting external docs in a
  bench environment.

## Assumptions

- The feature branch `035-core-bluetooth` already exists and
  is checked out (as a git worktree per the user-provided
  context); branch creation is delegated to the
  `before_specify` git hook and is not part of this command's
  responsibilities.
- Constitution v1.1.0 applies: cross-platform safety,
  additive changes, no breaking edits, full `pnpm check`
  green.
- `react-native-ble-plx` is the chosen library because it is
  the most popular, well-maintained, Expo-compatible BLE
  central library and ships its own config plugin. The
  decision is restated here as an assumption and will be
  re-justified in `research.md` during planning.
- Because `react-native-ble-plx` provides the native
  integration, NO custom Swift module is required for v1;
  this is consistent with prior features that prefer upstream
  libraries when one exists.
- The JS bridge `src/native/ble-central.ts` is intentionally
  one level of indirection above `react-native-ble-plx` so
  that swapping libraries in the future does not ripple into
  the screen or its components. The bridge is the only file
  that imports `react-native-ble-plx` (and `navigator.bluetooth`
  on Web).
- iOS 7.0 is the correct minimum because Core Bluetooth's
  central role has been stable since iOS 7. The
  `NSBluetoothAlwaysUsageDescription` requirement applies on
  iOS 13+; on earlier versions the prompt is implicit and the
  bridge reports **granted** without invoking it.
- Android runtime permissions are handled by
  `react-native-ble-plx`'s plugin; the with-bluetooth wrapper
  declares the permissions in the manifest but the runtime
  request flow lives in the library and is exposed through
  `bleCentral.requestPermission()`.
- Web Bluetooth is treated as progressive enhancement. The
  Web implementation is functionally narrower than iOS/Android
  (no continuous scan; per-pick model via `requestDevice`) and
  this is documented in the UI rather than papered over.
- Service-UUID filter input parses comma-separated UUID
  strings (4-character short form OR 36-character full UUID);
  malformed entries are reported inline and the **Scan**
  toggle is gated until the input is valid or empty.
- The default Write payload is `0x01` (one byte), chosen
  because the universal "test write" payload across BLE
  examples is "any single non-zero byte"; the user can edit
  the payload in the inline input before tapping **Write**.
- The DiscoveredList stale-row timeout (30 seconds) and
  EventLog cap (20 entries) are documented defaults; both can
  be tuned in planning without changing the contract.
- Unit tests run in a JS-only environment (Jest + React
  Native Testing Library) and mock the bridge at the import
  boundary; no on-device, simulator, or BLE peripheral test
  rig is needed.
- `Platform.OS` checks are sufficient for iOS / Android /
  Web routing; no new platform-detection abstraction is
  introduced.
- The `with-bluetooth` plugin is a thin wrapper that calls
  `react-native-ble-plx`'s plugin with the project's default
  permission strings and is declared in `app.json` exactly
  once. The wrapper is idempotent and MUST NOT clobber a
  pre-existing non-empty `NSBluetoothAlwaysUsageDescription`
  set by another plugin.

## Out of Scope

- BLE peripheral / GATT-server role on iOS, Android, or Web —
  this module demonstrates **central** only. A future feature
  may add a peripheral-role companion module.
- BLE bonding, pairing flow UI, and persistent peripheral
  identity across app launches; v1 treats every launch as a
  fresh scan.
- State restoration (`CBCentralManagerOptionRestoreIdentifierKey`)
  and background scanning entitlements; v1 runs only in the
  foreground.
- L2CAP channels, MTU negotiation UI, and PHY (LE 2M / LE Coded)
  selection.
- A custom Swift module wrapping Core Bluetooth directly. v1
  prefers `react-native-ble-plx`; rebuilding the native side
  is explicitly deferred and will only be reconsidered if the
  library is abandoned.
- Replacing or modifying any prior feature's plugin or
  registry entry. The only `app.json` change is appending one
  new `plugins` entry (`with-bluetooth`).
- A virtualized DiscoveredList — a soft cap of 100 rendered
  rows is acceptable for v1 (documented; not user-configurable).
- Any iOS face-tracking, vision, ARKit, document-picker, or
  share-sheet behaviour — those belong to features 017, 032,
  033, and 034 respectively and MUST NOT be touched by this
  feature.
- Automated UI tests on real iOS, Android, or Web devices;
  coverage is JS-pure and mocks the bridge at the import
  boundary.
