# Contract — JS bridge to the BLE Central surface

**Feature**: 035-core-bluetooth
**See**: [spec.md](../spec.md) FR-016, FR-017, FR-021, FR-023, FR-024
**See**: [data-model.md](../data-model.md) Entities 1–10
**See**: [research.md](../research.md) §1 (R-A serialisation),
   §3 (R-C permissions), §4 (R-D classification),
   §5 (R-E events), §6 (R-F web fallback)

Implementation files:

- `src/native/ble-central.ts` (iOS path; imports `react-native-ble-plx`)
- `src/native/ble-central.android.ts` (Android path; imports
  `react-native-ble-plx` + `PermissionsAndroid`)
- `src/native/ble-central.web.ts` (Web path; reads
  `navigator.bluetooth`)
- `src/native/ble-central.types.ts` (shared types + 4 typed error
  classes)

## Invariants (asserted by `test/unit/native/ble-central.test.ts`)

- **B1**. Bridge module identity is the literal export shape
  declared below. The module name `'BleCentralBridge'` is distinct
  from prior modules:
    - 013 `'AppIntents'`
    - 014/027/028 `'WidgetCenter'`
    - 029 `'FocusFilters'`
    - 030 `'BackgroundTasks'`
    - 031 `'Spotlight'`
    - 032 `'QuickLook'`
    - 033 `'ShareSheet'`
    - 034 `'ARKitBridge'` / `'ARKitView'`
- **B2**. On iOS / Android the bridge delegates every method to a
  `react-native-ble-plx` `BleManager` instance. `react-native-ble-plx`
  is imported in `ble-central.ts` and `ble-central.android.ts` and
  in **no other file** in the project.
- **B3**. All mutating async methods are serialised through a
  closure-scoped promise chain inherited verbatim from 030 / 031 /
  032 / 033 / 034 (`enqueue` helper). Two back-to-back calls produce
  native invocations in submission order even if the first rejects.
  Serialisation applies on all three platforms (Web rejects in
  submission order). The synchronous `getState()` and the
  emitter's `on(...)` registration are NOT serialised.
- **B4**. `getState()` is a synchronous read; never throws; never
  triggers a native side-effect. On Web it reads a cached value
  from a `navigator.bluetooth.getAvailability()` Promise resolved
  on bridge module load; until that resolves, it returns
  `'unknown'`.
- **B5**. On Web, when `navigator.bluetooth === undefined` every
  async method throws `BleNotSupported`. `getState()` returns
  `'unsupported'`. `isAvailable()` returns `false`.
- **B6**. On any other (theoretical) platform, every async method
  throws `BleNotSupported` and `getState()` returns `'unsupported'`.
- **B7**. `requestPermission()` on iOS < 13 short-circuits to
  resolve with `'granted'` without invoking the library (FR-005).
- **B8**. `startScan()` with no `serviceUUIDs` (or an empty array)
  on Web auto-promotes to `acceptAllDevices: true` (FR-026).
- **B9**. The four typed error classes (`BleNotSupported`,
  `BleNotAuthorized`, `BleNotPoweredOn`, `BleOperationFailed`) are
  the SAME class identity across the three platform files (each
  variant imports them from `ble-central.types.ts`). `instanceof`
  works across platforms.
- **B10**. The bridge re-broadcasts native events through a typed
  `BleCentralEmitter`; subscriptions are reference-counted at the
  bridge layer (R-E). The emitter is the only event surface
  exposed to consumers.

## Typed surface

```ts
import type {
  CentralState, PermissionStatus, ScanOptions,
  DiscoveredPeripheral, ConnectionState,
  DiscoveredService, DiscoveredCharacteristic,
  CharacteristicEvent,
} from './ble-central.types';

// Methods (11)

// Synchronous reads — never throw, never serialised.
declare function getState(): CentralState;
declare function isAvailable(): boolean;     // false on Web without navigator.bluetooth

// Async (mutating) — serialised through closure-scoped promise chain (B3).
declare function requestPermission(): Promise<PermissionStatus>;
declare function startScan(opts: ScanOptions): Promise<void>;
declare function stopScan(): Promise<void>;
declare function connect(peripheralId: string): Promise<void>;
declare function disconnect(peripheralId: string): Promise<void>;
declare function discoverServices(peripheralId: string): Promise<readonly DiscoveredService[]>;
declare function discoverCharacteristics(serviceId: string): Promise<readonly DiscoveredCharacteristic[]>;
declare function readCharacteristic(characteristicId: string): Promise<{ bytesHex: string; byteLength: number }>;
declare function writeCharacteristic(
  characteristicId: string,
  bytes: Uint8Array,
  withoutResponse: boolean,
): Promise<{ byteLength: number }>;
declare function subscribeCharacteristic(characteristicId: string): Promise<void>;
declare function unsubscribeCharacteristic(characteristicId: string): Promise<void>;

// Event emitter (R-E)
type BleCentralEvents = {
  stateChange: { state: CentralState };
  peripheralDiscovered: { peripheral: DiscoveredPeripheral };
  connectionStateChange: { peripheralId: string; state: ConnectionState };
  characteristicValue: {
    characteristicId: string;
    bytesHex: string;
    byteLength: number;
    at: number;
  };
};
interface BleCentralEmitter {
  on<K extends keyof BleCentralEvents>(
    event: K,
    handler: (payload: BleCentralEvents[K]) => void,
  ): () => void; // returns unsubscribe
}
declare const emitter: BleCentralEmitter;

export {
  getState, isAvailable, requestPermission,
  startScan, stopScan, connect, disconnect,
  discoverServices, discoverCharacteristics,
  readCharacteristic, writeCharacteristic,
  subscribeCharacteristic, unsubscribeCharacteristic,
  emitter,
};
export {
  BleNotSupported, BleNotAuthorized, BleNotPoweredOn, BleOperationFailed,
} from './ble-central.types';
```

## Method behaviour

| Method | Resolves with | Common rejections |
|--------|---------------|-------------------|
| `requestPermission()` | The new `PermissionStatus` after the prompt | `BleNotSupported` (Web w/o `navigator.bluetooth`) |
| `startScan(opts)` | `void` once the native scan is active | `BleNotPoweredOn`, `BleNotAuthorized`, `BleNotSupported` |
| `stopScan()` | `void` | rare; `BleOperationFailed('failed', …)` |
| `connect(id)` | `void` once connected | `BleOperationFailed('connection-failed', …)`, `BleNotPoweredOn` |
| `disconnect(id)` | `void` once disconnected | rare; idempotent on already-disconnected |
| `discoverServices(id)` | List of services | `BleOperationFailed('peripheral-disconnected', …)` |
| `discoverCharacteristics(serviceId)` | List of characteristics | same |
| `readCharacteristic(charId)` | `{ bytesHex, byteLength }` | `BleOperationFailed('operation-not-supported')` if char lacks `read` |
| `writeCharacteristic(charId, bytes, withoutResponse)` | `{ byteLength }` | same; mismatched `withoutResponse` flag rejects |
| `subscribeCharacteristic(charId)` | `void` once subscription is active | `BleOperationFailed('operation-not-supported')` if char lacks `notify`/`indicate` |
| `unsubscribeCharacteristic(charId)` | `void` | rare; idempotent |

## Error mapping

The bridge translates `react-native-ble-plx`'s `BleError`
instances to the four typed classes:

| `BleErrorCode` | Typed class |
|----------------|-------------|
| `BluetoothUnsupported` | `BleNotSupported` |
| `BluetoothUnauthorized` | `BleNotAuthorized` |
| `BluetoothPoweredOff` | `BleNotPoweredOn` |
| `CharacteristicNotFound`, `CharacteristicReadFailed`, `CharacteristicWriteFailed`, `CharacteristicNotifyChangeFailed`, `OperationCancelled`, `OperationTimedOut`, `DeviceAlreadyConnected`, `DeviceDisconnected`, `DeviceConnectionFailed`, `ServicesDiscoveryFailed`, `IncludedServicesDiscoveryFailed`, `CharacteristicsDiscoveryFailed` | `BleOperationFailed(<code>, …)` (the `code` field carries the kebab-case form) |
| any other | `BleOperationFailed('failed', …)` |

On Web, `DOMException` instances are translated:

| Web DOM error | Typed class |
|---------------|-------------|
| `NotFoundError` (user cancelled chooser) | `BleOperationFailed('operation-cancelled', …)` |
| `SecurityError` | `BleNotAuthorized` |
| `NotSupportedError` | `BleNotSupported` |
| `NetworkError` | `BleOperationFailed('connection-failed', …)` |
| any other | `BleOperationFailed('failed', …)` |
