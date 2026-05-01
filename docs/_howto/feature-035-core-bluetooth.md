---
last_verified: 2026-05-01
prerequisites:
  - macOS with Xcode (optional; react-native-ble-plx works in custom dev client)
  - iPhone running iOS 13+
  - A second BLE device to connect to (another iPhone, a BLE peripheral, etc.)
  - Apple Developer account (free tier sufficient)
---

# How to verify Core Bluetooth on iPhone

## Goal
Confirm CBCentralManager scans and discovers peripherals, connects and discovers
services/characteristics, reads and writes characteristics, and GATT notification
subscriptions deliver live data.

## Prerequisites
- Node 20+, pnpm; `pnpm install` already run
- `react-native-ble-plx` installed
- `with-bluetooth` plugin registered in `app.json` (adds `NSBluetoothAlwaysUsageDescription`,
  UIBackgroundModes: bluetooth-central/peripheral)

## Steps
1. Build the JS layer:
   ```bash
   npx expo install react-native-ble-plx
   pnpm install && pnpm check
   ```
2. Generate native project and build:
   ```bash
   npx expo prebuild --clean
   pnpm ios:ipa
   ```
3. Install the IPA per [sideload-iphone.md](sideload-iphone.md).
4. In the app, navigate to **"Bluetooth"** in the Modules tab.
5. Grant Bluetooth permission when prompted.
6. Tap **Scan** — confirm nearby peripherals appear in the list with RSSI values.
7. Tap a peripheral row to connect — confirm "Connected" status and service list.
8. Tap a readable characteristic — confirm the raw hex value is displayed.
9. Write a value to a writable characteristic — confirm success response.
10. Subscribe to a notify characteristic — confirm live updates in the log.
11. Tap **Disconnect** — confirm peripheral returns to "Disconnected" state.

## Verify
- Scan returns nearby BLE peripherals with RSSI within ~2 s
- Connect / disconnect lifecycle transitions work
- Readable characteristic displays value
- Writable characteristic accepts write command without error
- Notify characteristic pushes live updates when subscribed
- On web: "Bluetooth Lab is iOS/Android only" banner

## Troubleshooting
- **No devices in scan list** → verify Bluetooth is enabled in Control Center;
  also ensure the test peripheral is advertising (not in a connected sleep state)
- **Permission prompt not appearing** → verify `with-bluetooth` plugin and a fresh prebuild;
  ensure `NSBluetoothAlwaysUsageDescription` is in Info.plist
- **Connect immediately disconnects** → peripheral may require pairing or authentication;
  check `react-native-ble-plx` docs for `requestMTU` and `discoverAllServicesAndCharacteristics` order

## Implementation references
- Spec: `specs/035-core-bluetooth/spec.md`
- Plan: `specs/035-core-bluetooth/plan.md`
- Module: `src/modules/bluetooth-lab/`
- Native bridge: `src/native/bluetooth.ts`
- Plugin: `plugins/with-bluetooth/`

## See Also
- [sideload-iphone.md](sideload-iphone.md) — Initial sideloading from Windows