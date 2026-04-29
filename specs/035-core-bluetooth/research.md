# Phase 0 Research — Core Bluetooth (BLE Central) Module (035)

**Companion to**: [plan.md](./plan.md) §"Resolved decisions"

This document records the code-level detail behind plan-level
decisions **R-A** through **R-G**, plus §8 (soft caps and pruning).
Spec-level decisions were already approved in `spec.md`; they are not
re-litigated here.

All sections below follow the **Decision / Rationale / Alternatives
considered** template.

---

## §1 — R-A: Bridge-level serialisation of concurrent AsyncFunction calls

### Decision

`src/native/ble-central.ts` (and the `.android.ts` / `.web.ts`
siblings) expose an internal, module-scoped promise chain inherited
verbatim from features 030 / 031 / 032 / 033 / 034:

```ts
let chain: Promise<unknown> = Promise.resolve();

function enqueue<T>(work: () => Promise<T>): Promise<T> {
  const next = chain.then(work, work); // run regardless of prior outcome
  chain = next.catch(() => undefined); // don't poison the chain
  return next;                          // preserve original rejection for the caller
}
```

Every **mutating** async bridge method (`requestPermission`,
`startScan`, `stopScan`, `connect`, `disconnect`, `discoverServices`,
`discoverCharacteristics`, `readCharacteristic`,
`writeCharacteristic`, `subscribeCharacteristic`) wraps its native
call through `enqueue(...)`. The synchronous `getState()` and the
event-emitter listener registration / removal are NOT serialised;
they are pure reads. The Android and Web variants apply the same
chain so that two rapid taps reject in submission order.

### Rationale

- Two rapid `connect()` calls hitting the library could result in
  the second succeeding and disconnecting the first
  mid-discovery, breaking the PeripheralPanel's "one connected
  peripheral at a time" invariant. Serialising at the JS bridge
  ensures the second call only fires AFTER the first has resolved
  (with success or failure), giving tests the deterministic
  invariant: "two back-to-back calls produce two native
  invocations in submission order".
- Inheriting the helper verbatim from 030 / 031 / 032 / 033 / 034
  reduces reviewer cognitive load and reuses the same flake-free
  guarantee prior bridge tests demonstrated.
- Errors are preserved for the caller but the chain is detoxified
  by `chain.catch(...)` so a rejected call does not block
  subsequent ones.

### Alternatives considered

- **No serialisation** — rejected; the spec edge case
  "tap-to-connect during in-progress connection" requires a
  deterministic "second call rejects" outcome, which is hard to
  achieve at the screen layer alone (button-disabled state is
  best-effort against double-taps but not against synthetic test
  taps or concurrent gesture handlers).
- **Per-method chain** (one per async function) — rejected;
  cross-method ordering matters too (e.g., `startScan()` must
  not race a pending `connect()`).
- **Library-side serialisation** — `react-native-ble-plx` does not
  expose a single queue; each `BleManager` method has its own
  promise, and concurrent calls can interleave at the native
  layer. Serialising at the JS bridge sidesteps this entirely.

---

## §2 — R-B: Library choice — `react-native-ble-plx`

### Decision

Use **`react-native-ble-plx`** (Polidea / dotintent fork, MIT
license) for the iOS and Android native layer. Pin to the latest
stable minor at branch start that lists Expo SDK 55 in its
peer-deps matrix (specific version string captured in
`package.json` at implementation time; the pin is recorded in the
implementation commit, not here, to avoid stale references).

### Rationale (decision matrix)

| Criterion | `react-native-ble-plx` | Custom Swift `CBCentralManager` bridge | `react-native-ble-manager` |
|-----------|------------------------|----------------------------------------|----------------------------|
| Expo config plugin shipped | ✅ Yes (since 3.x) | ❌ Author it ourselves | ⚠️ Community plugin |
| Maintenance | ✅ Active; weekly downloads ≈ 60k | n/a | ⚠️ Slower release cadence |
| iOS feature coverage | ✅ Full Core Bluetooth central | ⚠️ Whatever we choose to wrap | ✅ Full |
| Android feature coverage | ✅ Full | ❌ Would need a parallel Kotlin bridge | ✅ Full |
| TypeScript types | ✅ Bundled | n/a (we'd write them) | ⚠️ DefinitelyTyped |
| API ergonomics for notify | ✅ `monitorCharacteristicForDevice` returns a Subscription with `.remove()` | n/a | ⚠️ Event-based without per-subscription teardown |
| Error taxonomy | ✅ `BleErrorCode` enum maps cleanly to our typed errors | n/a | ⚠️ String-based |
| Deps weight | ✅ ~80 kB minified JS + native binary | ~0 kB JS, but author + maintain native code | ~70 kB |

### Alternatives considered

- **Custom Swift `CBCentralManager` bridge** (Expo Module
  pattern, à la 034's `ARKitBridge`) — rejected. Pros: zero new
  runtime JS dependency; full control over the surface. Cons:
  (a) duplicates a mature library at significant authoring +
  maintenance cost; (b) does not give us Android parity (we'd
  need a parallel Kotlin bridge); (c) multiplies on-device
  verification cost (every release would need iOS + Android
  smoke tests we do not currently run); (d) violates the
  project's prefer-upstream-libraries-when-they-exist precedent.
  The bridge's typed surface is intentionally library-agnostic so
  swapping to a custom implementation later is feasible without
  rewriting screens.
- **`react-native-ble-manager`** — rejected. Slower release
  cadence, weaker TypeScript types, and an event-based
  notification API that makes per-subscription teardown awkward
  (R-E).
- **`@stoprocent/react-native-bluetooth-classic`** — rejected.
  Targets Bluetooth Classic, not BLE; out of scope for the Core
  Bluetooth central role.
- **`expo-bluetooth`** — does not exist as a first-party Expo
  module at SDK 55.

### Consequences

- One new runtime JS dependency (`react-native-ble-plx`).
- One new Expo prebuild plugin entry (`./plugins/with-bluetooth`,
  which chains the upstream plugin — R-G).
- The bridge file `src/native/ble-central.ts` is the **only** file
  in the project that imports `react-native-ble-plx`. All other
  code touches the library through the typed bridge interface.

---

## §3 — R-C: iOS permission model + Android runtime permission matrix

### Decision

**iOS**:

- iOS 13+ requires the `NSBluetoothAlwaysUsageDescription` plist
  key. The OS prompts the user the first time the bridge calls
  any method that activates the central manager (typically
  `startScan()`); there is no separate "request" API on iOS for
  Bluetooth.
- The bridge's `requestPermission()` on iOS 13+ delegates to a
  best-effort path: it triggers a no-op `startDeviceScan(null,
  null, () => {})` followed immediately by `stopDeviceScan()`,
  which causes the OS to surface the prompt; the bridge then
  reads the manager state and translates to `PermissionStatus`:
  - `unauthorized` → `'denied'`
  - `unsupported` → `'restricted'`
  - `unknown` → `'undetermined'`
  - `poweredOn` / `poweredOff` / `resetting` → `'granted'`
- iOS < 13 has no separate Bluetooth permission. The bridge
  short-circuits `requestPermission()` to resolve with
  `'granted'` without invoking the library. (Detected via
  `parseInt(Platform.Version, 10) < 13` on iOS.)

**Android**:

| Android API | Required runtime permissions |
|-------------|------------------------------|
| API 31+ (Android 12+) | `BLUETOOTH_SCAN`, `BLUETOOTH_CONNECT` |
| API 30 and below | `ACCESS_FINE_LOCATION` (BLE scanning requires location on pre-API-31) |

The wrapper plugin (R-G) declares all three permissions in the
manifest. The runtime request lives in the library's
`requestPermissions()` API, which uses
`PermissionsAndroid.requestMultiple` under the hood; the bridge's
`requestPermission()` invokes it and translates the result map
into `PermissionStatus`:

- All requested permissions `granted` → `'granted'`
- Any `never_ask_again` → `'denied'` (Open Settings affordance
  shown by the PermissionsCard)
- Any `denied` → `'denied'`

**Web**: `'notApplicable'` (Web Bluetooth permissions are
origin-scoped and granted per-device-pick at scan time — see R-F).

### Rationale

- The library's permission API is the most reliable cross-Android-
  version path; re-implementing it would duplicate the API-level
  matrix logic.
- Mapping every variant to a finite `PermissionStatus` enum (5
  values) is what the PermissionsCard component consumes; richer
  Android-specific values (e.g., `never_ask_again`) are folded
  into `'denied'` at the bridge layer with the "Open Settings"
  affordance handled by the UI.
- iOS < 13 is rare in the field but the spec lists `minIOS: '7.0'`
  (FR-001), so the short-circuit MUST exist.

### Alternatives considered

- **Skip iOS < 13 short-circuit** and rely on the library's
  behaviour — rejected; the library's behaviour on iOS < 13 is
  undocumented for this exact case and would couple our spec
  invariant (FR-005: iOS < 13 reports `'granted'` without
  invoking the bridge) to library internals.
- **Use `react-native-permissions` for the Android matrix** —
  rejected; adds a second runtime dependency for a problem the
  library already solves.

---

## §4 — R-D: Hook error classification

### Decision

`useBleCentral.ts` wraps every mutating bridge call in a
`try / catch`; on catch it dispatches `{ type: 'error',
classification, message }` where `classification` is one of:

| Classification | Triggered by | UI surface |
|----------------|--------------|------------|
| `'unsupported'` | `BleNotSupported` thrown by the bridge (Web without `navigator.bluetooth`, or any non-iOS / non-Android / non-Web platform) | StateCard caption: "Bluetooth not supported on this platform" |
| `'unauthorized'` | `BleNotAuthorized` (mapped from library `BleErrorCode.BluetoothUnauthorized` or central state `unauthorized`) | PermissionsCard pill flips to `'denied'`; inline caption + Open Settings affordance |
| `'powered-off'` | `BleNotPoweredOn` (mapped from library `BleErrorCode.BluetoothPoweredOff` or central state `poweredOff`) | StateCard caption: "Bluetooth is off — enable it in Settings to scan"; ScanControls disabled |
| `'operation-not-supported'` | `BleOperationFailed` with code `'operation-not-supported'` (read on a write-only characteristic, etc.) | EventLog entry kind `'error'` with the reason; the offending button is also disabled at the UI layer |
| `'failed'` | Any other Error (timeout, out of range, peripheral refused) | The relevant inline caption (StateCard / ScanControls / PeripheralPanel) shows `lastError`; no crash, no unhandled rejection |

The classifier is a single pure function in
`useBleCentral.ts`:

```ts
function classify(e: unknown): { classification: ErrorClass; message: string } {
  if (e instanceof BleNotSupported) return { classification: 'unsupported', message: e.message };
  if (e instanceof BleNotAuthorized) return { classification: 'unauthorized', message: e.message };
  if (e instanceof BleNotPoweredOn) return { classification: 'powered-off', message: e.message };
  if (e instanceof BleOperationFailed) return { classification: 'operation-not-supported', message: e.message };
  return { classification: 'failed', message: e instanceof Error ? e.message : String(e) };
}
```

The `mounted: { current: boolean }` ref is checked before every
dispatch so no callback fires after unmount (FR-024, SC-010).

### Rationale

- Five categories cover every documented spec failure mode and
  map to distinct UI affordances; finer-grained categories would
  duplicate the library's `BleErrorCode` taxonomy without UI
  benefit.
- `instanceof` checks work because all four typed error classes
  live in `src/native/ble-central.types.ts` and are imported by
  every platform variant — single class identity across files.
- The `mounted` guard mirrors 034's R-D pattern.

### Alternatives considered

- **Surface the raw library error object** — rejected; couples
  the screen to library internals and breaks the bridge's
  library-agnostic contract.
- **String-match on error messages** — rejected; brittle and
  language-dependent.

---

## §5 — R-E: Event-emitter design

### Decision

The bridge exposes a typed `BleCentralEmitter`:

```ts
type BleCentralEvents = {
  stateChange: { state: CentralState };
  peripheralDiscovered: { peripheral: DiscoveredPeripheral };
  connectionStateChange: { peripheralId: string; state: ConnectionState };
  characteristicValue: { characteristicId: string; bytesHex: string; byteLength: number; at: number };
};

interface BleCentralEmitter {
  on<K extends keyof BleCentralEvents>(
    event: K,
    handler: (payload: BleCentralEvents[K]) => void,
  ): () => void; // returns unsubscribe
}
```

**iOS / Android** subscribe to `react-native-ble-plx`'s native
callbacks (`onStateChange`, `startDeviceScan` callback,
`onDeviceDisconnected`, and `monitorCharacteristicForDevice`) on
the first `on(...)` call and re-broadcast the translated payloads
through the emitter. Subscriptions are reference-counted; when the
last consumer unsubscribes, the bridge tears down the underlying
library subscription.

**Web** translates `navigator.bluetooth` events
(`availabilitychanged`, GATT `gattserverdisconnected`,
`characteristicvaluechanged`) into the same shape.

The hook owns one subscription per event type and stores the
returned unsubscribe in a ref; the `useEffect` cleanup calls every
unsubscribe on unmount.

### Rationale

- A single emitter per event type with a returned unsubscribe is
  the smallest, most testable surface that covers every spec
  scenario.
- Reference counting at the bridge layer prevents the
  "double-subscribe" footgun where the hook runs an effect twice
  in StrictMode and the second subscribe leaks.
- Re-broadcast through a typed shape means the screen and tests
  never see library-specific event payloads, which keeps the
  bridge's library-agnostic contract intact.

### Alternatives considered

- **Expose the library's `BleManager` directly** — rejected; ties
  every consumer to library internals.
- **Use Node-style `EventEmitter`** — rejected; weaker typing,
  no per-listener unsubscribe handle, no reference counting.
- **Use RxJS Observables** — rejected; new runtime dependency for
  a small surface; also overkill given the four event types.

---

## §6 — R-F: Web Bluetooth fallback model

### Decision

`src/native/ble-central.web.ts` implements the typed bridge against
`navigator.bluetooth` with the following mapping:

| Bridge method | Web Bluetooth call | Notes |
|---------------|---------------------|-------|
| `getState()` | Synchronous read of `navigator.bluetooth.getAvailability()` cache; emits `'poweredOn'` when available, `'unsupported'` when `navigator.bluetooth` is undefined, `'poweredOff'` otherwise. | The async `getAvailability()` Promise is resolved on bridge module load and cached. |
| `requestPermission()` | Resolves with `'notApplicable'`. | Web Bluetooth permission is per-device-pick at scan time. |
| `startScan(opts)` | `navigator.bluetooth.requestDevice({ filters: opts.serviceUUIDs?.map(uuid => ({ services: [uuid] })) ?? undefined, acceptAllDevices: opts.serviceUUIDs == null \|\| opts.serviceUUIDs.length === 0 })`. The picked device is emitted as a single `peripheralDiscovered` event; scan state transitions to `'idle'` after the pick (no continuous scan). | FR-026: a no-filter scan auto-promotes to `acceptAllDevices: true`; the UI surfaces a one-time caption explaining the per-pick model. |
| `stopScan()` | No-op (the scan is already a one-shot pick). | Resolves immediately. |
| `connect(id)` | Looks up the device by id from the picked-devices map, calls `device.gatt.connect()`. | Emits `connectionStateChange` `'connecting'` then `'connected'`. |
| `disconnect(id)` | `device.gatt.disconnect()`. | Emits `'disconnecting'` then `'disconnected'`. |
| `discoverServices(id)` | `device.gatt.getPrimaryServices()`. | Each service's UUID is normalised to lower-case 36-char form. |
| `discoverCharacteristics(serviceId)` | `service.getCharacteristics()`. | Properties translated from `BluetoothCharacteristicProperties` to our `CharacteristicProperty[]`. |
| `readCharacteristic(charId)` | `characteristic.readValue()`. | Returns hex-encoded bytes via the `characteristicValue` event. |
| `writeCharacteristic(charId, bytes, withoutResponse)` | `withoutResponse ? characteristic.writeValueWithoutResponse(bytes) : characteristic.writeValueWithResponse(bytes)`. | The `bytes` parameter is `Uint8Array`. |
| `subscribeCharacteristic(charId)` | `characteristic.startNotifications()` + `addEventListener('characteristicvaluechanged', …)`. | Re-broadcasts each value through the emitter. |

When `navigator.bluetooth` is `undefined`, every method throws
`BleNotSupported` synchronously (or returns a rejected promise for
async methods). The screen detects this via
`bridge.isAvailable() === false` (a synchronous read) and renders
the "not supported" notice in place of ScanControls + DiscoveredList
(FR-017, FR-026, SC-006).

### Rationale

- Web Bluetooth's per-pick model is fundamentally different from
  iOS / Android continuous scanning; the spec acknowledges this
  (US6-AS2) and FR-026 mandates the auto-promotion to
  `acceptAllDevices: true` for no-filter scans.
- Mapping each bridge method to a single Web Bluetooth call keeps
  the implementation small (≈ 200 LoC) and testable with a
  stubbed `navigator.bluetooth`.
- The hex encoding is a single helper shared with the iOS / Android
  paths.

### Alternatives considered

- **Refuse to support Web Bluetooth and always render the "not
  supported" notice on Web** — rejected; Spec FR-017 + SC-006
  explicitly require progressive enhancement on browsers that
  expose `navigator.bluetooth`.
- **Use a polyfill (e.g., `webbluetooth` npm package)** —
  rejected; the package targets Node, not browsers; no runtime
  benefit.

---

## §7 — R-G: `with-bluetooth` plugin chaining + idempotency

### Decision

`plugins/with-bluetooth/index.ts` is a `ConfigPlugin` that:

1. **Chains the upstream plugin first.** Imports the
   `react-native-ble-plx` config plugin via
   `withPlugins(config, [['react-native-ble-plx', { isBackgroundEnabled: false, modes: [], bluetoothAlwaysPermission: undefined }]])`.
   Passing `bluetoothAlwaysPermission: undefined` means the
   upstream plugin DOES NOT set the iOS plist key (we own that
   set in step 2 to preserve any operator override).
2. **Runs a `withInfoPlist` mod** that sets
   `NSBluetoothAlwaysUsageDescription` to a default string
   (`'Used to demonstrate Core Bluetooth central scanning, connection, and characteristic operations.'`)
   ONLY when the key is **absent**. When the key is present
   (even with an empty string), the plugin leaves it unchanged.

```ts
import type { ConfigPlugin } from '@expo/config-plugins';
import { withInfoPlist, withPlugins } from '@expo/config-plugins';

const DEFAULT_BT_USAGE =
  'Used to demonstrate Core Bluetooth central scanning, connection, and characteristic operations.';

const withBluetooth: ConfigPlugin = (config) => {
  let next = withPlugins(config, [
    ['react-native-ble-plx', { isBackgroundEnabled: false, modes: [], bluetoothAlwaysPermission: undefined }],
  ]);
  next = withInfoPlist(next, (cfg) => {
    if (!cfg.modResults.NSBluetoothAlwaysUsageDescription) {
      cfg.modResults.NSBluetoothAlwaysUsageDescription = DEFAULT_BT_USAGE;
    }
    return cfg;
  });
  return next;
};

export default withBluetooth;
```

### Idempotency proof

- Step 1 (`withPlugins`) is deterministic for fixed options;
  invoking it twice on the same config produces a deep-equal
  output because `react-native-ble-plx`'s plugin uses
  membership-checked appends for permissions and a
  set-only-when-absent rule for any plist key it owns.
- Step 2 (`withInfoPlist`) is set-only-when-absent; the second
  invocation reads the value placed by the first and short-
  circuits.
- ⇒ Two consecutive applications produce a deep-equal config
  (SC-008).

### Coexistence with operator overrides

- An operator who sets `NSBluetoothAlwaysUsageDescription` via
  another plugin or via `app.json`'s `expo.ios.infoPlist` block
  causes step 2 to no-op for that key.
- Test asserts that running `with-bluetooth` on a config with a
  pre-set `NSBluetoothAlwaysUsageDescription = 'OPERATOR'`
  preserves `'OPERATOR'` verbatim.

### Android permissions

The upstream plugin already declares `BLUETOOTH_SCAN`,
`BLUETOOTH_CONNECT`, and `ACCESS_FINE_LOCATION` (the last guarded
by `android:maxSdkVersion="30"`) in the manifest. The wrapper does
NOT redeclare them; the test asserts the wrapper's `withPlugins`
call lists `react-native-ble-plx` exactly once.

### Rationale

- Chaining a single upstream plugin is the standard
  `@expo/config-plugins` pattern; it reuses the library's
  battle-tested manifest / plist mods rather than re-implementing
  them.
- Owning step 2 ourselves is what gives us the "preserve operator
  override" guarantee (FR-019), which the upstream plugin would
  break if we passed it a non-undefined `bluetoothAlwaysPermission`
  option (the upstream plugin always overwrites that key).
- The plugin uses ONLY `withPlugins` and `withInfoPlist`; no
  `withDangerousMod`, no manifest mods. Same surface discipline as
  034's `with-arkit`.

### Alternatives considered

- **Skip the wrapper and add `react-native-ble-plx` directly to
  `app.json` `plugins`** — rejected; we lose control of the iOS
  plist string and the operator-override guarantee. The wrapper's
  cost is one file (≈ 25 LoC).
- **Re-implement the upstream plugin's manifest mods** —
  rejected; doubles the surface to maintain and risks divergence
  from the library's runtime expectations.

---

## §8 — Soft caps and pruning

### DiscoveredList soft cap (100 rows)

The hook does **not** hard-cap; it tracks every advertising
peripheral in the reducer state. The `DiscoveredList` component
slices to the 100 newest-by-RSSI rows at render time. This keeps
the cap UI-only and documented (FR-027); future tuning does not
change the bridge contract.

### EventLog soft cap (20 entries)

Per-characteristic; oldest dropped on overflow. Implemented in the
reducer with a shift-on-overflow array. Test covers 0 / 1 / 20 / 21
entries.

### Stale-row prune (30 s)

A `setInterval(1000)` tick in the hook compares each
`DiscoveredPeripheral.lastSeen` to `Date.now()` and removes rows
older than 30 s. The interval is cleared on unmount (FR-024). Test
uses `jest.useFakeTimers()` to advance time across the threshold.

### Notification render coalescing (100 ms)

The `PeripheralPanel` debounces EventLog re-renders to 100 ms
windows; underlying `bytesHex` payloads are preserved (no dropped
bytes). Test asserts hex-equality of the captured payload sequence
across a burst.

### Rationale

- Soft caps over hard caps preserve test determinism and let the
  cap be tuned later without re-deriving spec invariants.
- Render coalescing isolates the React commit cost from the
  notification arrival rate; the underlying buffer never drops
  bytes.

---

## Closed questions

- **Should the wrapper own the runtime permission UI?** — No. The
  PermissionsCard owns the UI; the bridge owns the platform
  request. The library's API is the only thing that knows the
  Android API matrix.
- **Should the hook expose the raw `BleManager`?** — No. The hook
  exposes only the typed `BluetoothLabState` shape. The screen
  imports nothing from `react-native-ble-plx`.
- **Should we support concurrent connections?** — No (v1). The
  spec edge case "tap-to-connect during in-progress connection"
  rejects the second attempt; the hook tracks at most one
  connected peripheral. Future v2 may relax this.
