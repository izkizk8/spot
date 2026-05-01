# Quickstart — Core Bluetooth (BLE Central) Module (035)

**Companion to**: [plan.md](./plan.md), [spec.md](./spec.md)

This document is the operator-facing checklist for verifying feature
035 end-to-end. It has two halves:

1. **JS-pure verification** — runnable on Windows / CI without an iOS
   or Android device. Closes FR-021, FR-022, FR-023, SC-005, SC-006,
   SC-007, SC-010, and the JS-pure half of SC-008 (the plugin
   idempotency assertion in `with-bluetooth.test.ts`).
2. **On-device verification** — required to close
   US1 / US2 / US3 / US4 / US5 / US6 acceptance scenarios that depend
   on a real `CBCentralManager`, `BluetoothAdapter`, or
   `navigator.bluetooth`. Closes SC-001 through SC-004, SC-009, and
   SC-011.

---

## Prerequisites

- pnpm ≥ 9, Node 22.x (project's pinned versions).
- For on-device iOS steps: macOS host with Xcode 16+, an **iOS 13+
  device** with Bluetooth radio (any iPhone 6s or later in
  practice). Apple developer signing configured for the
  `com.izkizk8.spot` bundle id (or a fork thereof). At least **one
  reachable BLE peripheral** in advertising range — a phone in
  peripheral mode (e.g., the LightBlue iOS app), a BLE beacon, or
  any GATT-server demo board (e.g., a heart-rate sensor, a
  Bluefruit Feather).
- For on-device Android steps: a configured Android emulator or
  device with Bluetooth and **API 31+** (Android 12+) for the
  modern permission set; alternatively, an API 30 device to
  exercise the legacy `ACCESS_FINE_LOCATION` path.
- For Web verification: Chrome / Edge / Opera (desktop) — Web
  Bluetooth supported. Plus Safari or Firefox to exercise the
  fallback notice (Web Bluetooth NOT supported).

---

## §1 — JS-pure verification (Windows / CI)

### 1.1 Install + lint + typecheck + test

```pwsh
pnpm install      # adds react-native-ble-plx (one new runtime dep)
pnpm format       # FR-022 — must produce no diff after the feature commit
pnpm lint         # FR-022 — no eslint-disable directives anywhere in 035
pnpm typecheck    # TS strict; bridge typed surface matches the contract
pnpm test         # SC-005 — all listed test files pass
pnpm check        # FR-022 — aggregate gate; MUST be green
```

**Expected**: every command exits 0. `pnpm check` reports a delta of
**≥ +14 suites** versus 034's closing baseline (see plan.md §"Test
baseline tracking").

### 1.2 Confirm zero `eslint-disable` introductions

```pwsh
git --no-pager diff main...HEAD -- src/ test/ plugins/ |
  Select-String -Pattern 'eslint-disable' -CaseSensitive
```

**Expected**: zero matches.

### 1.3 Confirm registry growth is exactly +1

```pwsh
git --no-pager diff main...HEAD -- src/modules/registry.ts |
  Select-String -Pattern '^\+\s+bluetoothLab' -CaseSensitive
```

**Expected**: exactly two `+`-prefixed lines (one import, one array
entry). No other registry changes.

### 1.4 Confirm `app.json` plugin growth is exactly +1

```pwsh
git --no-pager diff main...HEAD -- app.json |
  Select-String -Pattern '\+\s+"\./plugins/with-bluetooth"' -CaseSensitive
```

**Expected**: exactly one `+`-prefixed line; no other `app.json`
modifications.

### 1.5 Confirm `package.json` adds exactly one runtime dep

```pwsh
git --no-pager diff main...HEAD -- package.json |
  Select-String -Pattern 'react-native-ble-plx' -CaseSensitive
```

**Expected**: exactly one `+`-prefixed line in the `dependencies`
block. No `devDependencies` change.

### 1.6 Plugin unit-test gate

```pwsh
pnpm test test/unit/plugins/with-bluetooth.test.ts
```

**Expected**: all assertions pass — idempotency (SC-008), chaining
of the upstream `react-native-ble-plx` plugin exactly once,
preservation of an existing `NSBluetoothAlwaysUsageDescription`
(FR-019), no unintended manifest mods.

### 1.7 Bridge unit-test gate

```pwsh
pnpm test test/unit/native/ble-central.test.ts
```

**Expected**: every platform path passes —
- iOS: closure-scoped serialisation invariant (R-A); event
  re-broadcast for `stateChange`, `peripheralDiscovered`,
  `connectionStateChange`, `characteristicValue` (R-E).
- Android: same as iOS plus permission-flow translation through
  the mocked `PermissionsAndroid`.
- Web: `requestDevice` + GATT method mapping; no-filter scan
  auto-promoted to `acceptAllDevices: true` (FR-026); when
  `navigator.bluetooth` is undefined every method throws
  `BleNotSupported`.
- Each typed error class round-trips `instanceof` across the
  three platform files.

---

## §2 — On-device verification

### 2.1 Prebuild + Info.plist + Manifest assertions

```bash
# macOS host
pnpm install
pnpm prebuild --platform ios --clean
plutil -p ios/spot/Info.plist | grep -E 'NSBluetoothAlwaysUsageDescription'

pnpm prebuild --platform android --clean
grep -E 'BLUETOOTH_SCAN|BLUETOOTH_CONNECT|ACCESS_FINE_LOCATION' \
  android/app/src/main/AndroidManifest.xml
```

**Expected**:

- `NSBluetoothAlwaysUsageDescription` is non-empty. If no other
  plugin owns it, the value is the wrapper's default
  `'Used to demonstrate Core Bluetooth central scanning,
  connection, and characteristic operations.'` (research §7).
- `AndroidManifest.xml` contains `BLUETOOTH_SCAN`,
  `BLUETOOTH_CONNECT`, and `ACCESS_FINE_LOCATION` (the latter
  guarded by `android:maxSdkVersion="30"`). Each appears exactly
  once.
- (Idempotency) Re-running `pnpm prebuild --clean` produces a
  byte-identical Info.plist + AndroidManifest.xml. Verify with
  `diff` against a saved snapshot (SC-008).

### 2.2 iOS — state, permission, scan (US1 / US2)

```bash
pnpm ios   # or open ios/spot.xcworkspace and Run in Xcode
```

On the device:

1. From the home grid, tap **Bluetooth (BLE Central)**.
2. The screen mounts. The first time, on iOS 13+ the **Request**
   button on the PermissionsCard triggers the
   `NSBluetoothAlwaysUsageDescription` prompt. Grant it.
3. Within 2 seconds:
   - **StateCard** pill should read **poweredOn**.
   - **PermissionsCard** pill should read **granted**.
4. Toggle **Scan** on. Within 5 seconds:
   - **ScanControls** pill flips to **scanning**.
   - **DiscoveredList** populates with at least one row sorted by
     RSSI descending.

**Closes**: SC-001, US1-AS1, US1-AS2, US2-AS1.

If the device's Bluetooth radio is **off** when the screen mounts,
StateCard pill reads **poweredOff** with a caption explaining how
to enable it; ScanControls is disabled. (US1-AS3.)

### 2.3 iOS — connect, discover, read / write / subscribe (US3 / US4)

1. With at least one row in the DiscoveredList, tap **Connect** on
   a row that you control (e.g., a LightBlue peripheral or a
   demo board running a known GATT service).
2. Within 10 seconds: the connection-state pill transitions
   **connecting** → **connected**; the **PeripheralPanel** appears
   showing at least one **ServiceRow** with at least one
   **CharacteristicRow** within 5 seconds of the **connected**
   transition.
3. Pick a CharacteristicRow declaring `read`; tap **Read**. Within
   2 seconds, a hex byte string appears in that characteristic's
   EventLog with a timestamp.
4. Pick a CharacteristicRow declaring `write` or
   `writeWithoutResponse`; tap **Write**. The default payload
   `0x01` is sent; the EventLog gains a `'wrote 1 bytes'` entry.
5. Pick a CharacteristicRow declaring `notify`; tap **Subscribe**.
   The subscribed indicator appears on the row. As the peripheral
   notifies, hex entries append to the EventLog. The log retains
   the last 20 entries; older entries drop.

**Closes**: SC-002, SC-003, SC-004, US3-AS1, US3-AS2, US4-AS1,
US4-AS2, US4-AS3.

### 2.4 iOS — disconnect cleanup (US5 / SC-009)

1. With at least one active subscription, tap **Disconnect** on
   the bottom bar.
2. Within 5 seconds: connection-state pill transitions
   **disconnecting** → **disconnected**; PeripheralPanel
   disappears.
3. Watch the previous EventLogs for 5 seconds. Verify that no
   further notification entries are appended to any EventLog.

**Closes**: SC-009, US5-AS1, US5-AS2.

### 2.5 iOS — unmount safety (SC-010)

1. Open the screen, start a scan, connect, subscribe to a
   notify characteristic.
2. Navigate away (back button).
3. Open Xcode's Console and observe the next 5 seconds of logs.

**Expected**: no `peripheralDiscovered`, `characteristicValue`, or
`connectionStateChange` log line fires after the navigation. The
hook stopped scanning, unsubscribed, disconnected, and detached
all listeners on unmount (FR-024).

**Closes**: SC-010, FR-024 acceptance.

### 2.6 Android — full parity (US6-AS1)

```bash
pnpm android
```

1. Open the **Bluetooth (BLE Central)** card.
2. On API 31+ tap **Request** — the system prompts for
   `BLUETOOTH_SCAN` and `BLUETOOTH_CONNECT`. Grant both.
   On API 30 and below the prompt is for `ACCESS_FINE_LOCATION`.
3. Repeat the iOS flow (§2.2 → §2.5). All steps should behave
   identically.

**Closes**: US6-AS1.

### 2.7 Web — progressive enhancement (US6-AS2 / US6-AS3)

```bash
pnpm web
```

In Chrome / Edge:

1. Open the **Bluetooth (BLE Central)** card.
2. PermissionsCard pill reads **not applicable**.
3. Toggle **Scan** on with no filter; a one-time caption appears
   explaining the per-pick model. The browser's Bluetooth device
   chooser dialog opens. Pick a peripheral.
4. The picked device appears as a single row in the
   DiscoveredList. Tap **Connect**. The flow proceeds as on iOS /
   Android (with Web Bluetooth's narrower service surface).

In Safari / Firefox (no Web Bluetooth):

1. Open the **Bluetooth (BLE Central)** card.
2. ScanControls + DiscoveredList are replaced by a "Web Bluetooth
   not supported in this browser" notice.
3. The other panels (StateCard, PermissionsCard, DisconnectBar)
   remain visible and legible. No console errors. No unhandled
   promise rejections in the DevTools console.

Verify the web bundle does NOT include `src/native/ble-central.ts`:

```bash
# In Chrome / Edge DevTools, Sources tab, search for 'BleManager'
# (the react-native-ble-plx export name). Expected: zero matches.
```

**Closes**: SC-006, US6-AS2, US6-AS3.

---

## §3 — First-time-user flow (SC-011)

A naïve operator (no docs in front of them) should complete the
following within 90 seconds on iOS or Android with Bluetooth on
and at least one reachable peripheral nearby:

1. Tap the **Bluetooth (BLE Central)** card.
2. Tap **Request** on the PermissionsCard and grant the prompt.
3. Toggle **Scan** on; wait for at least one row.
4. Tap **Connect** on a row.
5. Pick a characteristic that declares `read`; tap **Read**.
6. Tap **Disconnect**.

**Expected**: total elapsed time ≤ 90 s; PeripheralPanel
disappears at the end; no error captions surfaced; no console
errors.

**Closes**: SC-011.

---

## §4 — Sign-off

Record the device model(s), iOS / Android / browser version(s),
build SHA, and a screenshot of the running screen with at least 1
discovered peripheral row and the PeripheralPanel populated, in
the feature's `retrospective.md`. The retrospective is the gate
for merge.
