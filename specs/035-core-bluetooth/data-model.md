# Phase 1 Data Model — Core Bluetooth (BLE Central) Module (035)

**Companion to**: [plan.md](./plan.md) §"Project Structure" + spec.md §"Key Entities"

This document captures the typed shape and invariants for every
entity transmitted, rendered, or held in memory by feature 035.
JS-side type definitions live in `src/native/ble-central.types.ts`
(entities 1–10) and `src/modules/bluetooth-lab/hooks/useBleCentral.ts`
(entity 11). The four typed error classes are also declared in
`src/native/ble-central.types.ts` so every platform variant of the
bridge shares the same class identity (`instanceof` works across
files).

Unlike feature 034, feature 035 has **no native source files of our
own**. The Swift / Kotlin / Web layer is provided by
`react-native-ble-plx` (iOS / Android) and `navigator.bluetooth`
(Web); the JS bridge translates the library types into the entities
documented below. There is **no JS-side persistent store** and
**no on-disk persistence** (v1). All state is in-memory, scoped to
the screen's lifetime.

---

## Entity 1 — `CentralState`

A string enum mirroring `CBCentralManagerState` (iOS), the Android
adapter state, and the Web Bluetooth `availability` signal.

### Type

```ts
export type CentralState =
  | 'poweredOn'
  | 'poweredOff'
  | 'unauthorized'
  | 'unsupported'
  | 'resetting'
  | 'unknown';
```

### Mapping

| iOS `CBManagerState` | Android `BluetoothAdapter` | Web | JS |
|----------------------|----------------------------|-----|-----|
| `.poweredOn` | `STATE_ON` | `getAvailability() === true` | `'poweredOn'` |
| `.poweredOff` | `STATE_OFF` | `getAvailability() === false` (radio off) | `'poweredOff'` |
| `.unauthorized` | (n/a, surfaced via permissions) | n/a | `'unauthorized'` |
| `.unsupported` | (radio absent) | `navigator.bluetooth` undefined | `'unsupported'` |
| `.resetting` | `STATE_TURNING_ON / STATE_TURNING_OFF` | (transient) | `'resetting'` |
| `.unknown` | (initial) | (initial) | `'unknown'` |

### Invariants

- Default value before the first bridge read: `'unknown'`.
- `'unsupported'` is terminal for the bridge — once observed, the
  hook treats it as permanent for the screen lifetime.
- StateCard caption strings are derived deterministically from
  the enum value (StateCard.tsx).

---

## Entity 2 — `PermissionStatus`

Drives the PermissionsCard pill.

### Type

```ts
export type PermissionStatus =
  | 'granted'
  | 'denied'
  | 'undetermined'
  | 'restricted'
  | 'notApplicable';
```

### Mapping

| Platform | When | JS |
|----------|------|-----|
| iOS 13+ | manager state observed and authorised | `'granted'` |
| iOS 13+ | manager state `unauthorized` | `'denied'` |
| iOS 13+ | manager state `unsupported` | `'restricted'` |
| iOS 13+ | manager state `unknown` (pre-prompt) | `'undetermined'` |
| iOS < 13 | always | `'granted'` (short-circuit, FR-005) |
| Android | all required permissions `granted` | `'granted'` |
| Android | any `never_ask_again` or `denied` | `'denied'` |
| Android | uninitialised | `'undetermined'` |
| Web | always | `'notApplicable'` |

### Invariants

- Default value: `'undetermined'` (iOS / Android),
  `'notApplicable'` (Web).
- `'denied'` triggers the Open Settings affordance in
  `PermissionsCard`.

---

## Entity 3 — `ScanState`

Drives the ScanControls pill.

### Type

```ts
export type ScanState = 'idle' | 'scanning' | 'paused';
```

### State machine

```
idle  ──setScan(true)──►  scanning  ──setScan(false)──►  idle
                            │
                  central state leaves 'poweredOn'
                            ▼
                          paused  ──central back to 'poweredOn'──► scanning
                            │                                         │
                            └────────setScan(false) at any time───────┴────► idle
```

- `idle`: no native scan active.
- `scanning`: `bridge.startScan(opts)` resolved, native callback
  stream attached.
- `paused`: scan was active but central state transitioned out of
  `'poweredOn'` (e.g., user toggled radio off mid-scan); existing
  rows kept (frozen), no native scan running. Auto-resumes when
  central returns to `'poweredOn'` (only if user did not toggle
  off in the interim — spec §"Edge Cases").

---

## Entity 4 — `ScanOptions`

The option bag passed to `startScan`.

### Type

```ts
export interface ScanOptions {
  readonly serviceUUIDs?: readonly string[];
  readonly allowDuplicates: boolean;
}
```

### Invariants

- `serviceUUIDs`, when provided, contains only **valid** UUID
  strings (4-character short form OR 36-character full UUID).
  Validation happens in the ScanControls component before the
  bridge is invoked. The bridge does NOT re-validate; the screen
  is the gate.
- Default: `{ allowDuplicates: false }` (no `serviceUUIDs`).
- On Web, an empty / missing `serviceUUIDs` auto-promotes to
  `acceptAllDevices: true` at the bridge layer (FR-026 / R-F).
- `allowDuplicates: true` re-emits a `peripheralDiscovered` event
  on every advertisement (so the row's RSSI / lastSeen update on
  every ad). `false` coalesces ads for the same `id` between
  bridge and hook (the row updates but the event is de-duped at
  the bridge).

---

## Entity 5 — `DiscoveredPeripheral`

The JS-side projection of one advertising peripheral.

### Type

```ts
export interface DiscoveredPeripheral {
  readonly id: string;            // library-supplied UUID-like identifier
  readonly name: string | null;   // null if not advertised
  readonly rssi: number;          // dBm; library guarantees integer
  readonly serviceUUIDs: readonly string[]; // lower-case, 36-char
  readonly lastSeen: number;      // ms since epoch (Date.now() at event time)
  readonly manufacturerData?: Uint8Array;
}
```

### Invariants

- The DiscoveredList component truncates `id` to its first 8
  characters for display only (FR-008).
- The list de-duplicates by `id` unless **Allow duplicates** is on
  (Entity 4).
- A row is removed from the rendered list if `Date.now() -
  lastSeen > 30_000` (FR-009; configurable default — research §8).
- Wire format from the library is normalised to this shape inside
  the bridge: short-form service UUIDs are expanded to full 36-
  char form (lower-case) for stable React keys; the DiscoveredList
  re-shortens for display when the UUID is in the well-known
  GATT short-form table.

---

## Entity 6 — `ConnectionState`

Drives the PeripheralPanel and DisconnectBar pills.

### Type

```ts
export type ConnectionState =
  | 'connecting'
  | 'connected'
  | 'disconnecting'
  | 'disconnected';
```

### State machine

```
disconnected ──connect()──►  connecting ──success──►  connected
        ▲                          │                       │
        │                          │                       │
        │                          ▼ failure               ▼ disconnect()
        └─────────────────────  disconnected   ◄──── disconnecting
                                                  ▲
                                                  │
                              radio off / out of range / peripheral
                              disconnects unexpectedly
```

- A new connect attempt is rejected at the screen layer while
  state ∈ {`connecting`, `connected`, `disconnecting`} (spec
  §"Edge Cases" — "tap-to-connect during in-progress connection").
- On disconnect (user or unexpected), the PeripheralPanel is
  removed from the layout (FR-015), all subscriptions are torn
  down (FR-024).

---

## Entity 7 — `DiscoveredService`

```ts
export interface DiscoveredService {
  readonly id: string;
  readonly uuid: string;          // lower-case 36-char
  readonly isWellKnown: boolean;  // matches a GATT short-form table entry
  readonly characteristics: readonly DiscoveredCharacteristic[];
}
```

### Invariants

- `id` is the library-supplied service identifier (peripheral-
  scoped); not displayed.
- `uuid` is rendered short-form when `isWellKnown` is true.
- `characteristics` is populated by `discoverCharacteristics`;
  before that call resolves, it is `[]`.

---

## Entity 8 — `DiscoveredCharacteristic`

```ts
export interface DiscoveredCharacteristic {
  readonly id: string;
  readonly uuid: string;          // lower-case 36-char
  readonly serviceId: string;     // foreign key to DiscoveredService.id
  readonly properties: readonly CharacteristicProperty[];
  readonly isSubscribed: boolean;
}
```

### Invariants

- `properties` is a subset of Entity 9; presence of a property
  enables the corresponding action button (Read / Write /
  Subscribe).
- `isSubscribed` is `true` between `subscribeCharacteristic()`
  resolve and `unsubscribeCharacteristic()` (or
  `disconnect()`) resolve.

---

## Entity 9 — `CharacteristicProperty`

```ts
export type CharacteristicProperty =
  | 'read'
  | 'write'
  | 'writeWithoutResponse'
  | 'notify'
  | 'indicate';
```

### Mapping

| Library / Web flag | JS |
|--------------------|-----|
| `isReadable` | `'read'` |
| `isWritableWithResponse` | `'write'` |
| `isWritableWithoutResponse` | `'writeWithoutResponse'` |
| `isNotifiable` | `'notify'` |
| `isIndicatable` | `'indicate'` |

A `Write` action chooses `withResponse` over `withoutResponse`
when both are declared (deterministic; documented in the bridge).
`Subscribe` accepts either `'notify'` or `'indicate'`.

---

## Entity 10 — `CharacteristicEvent`

One row in the per-characteristic EventLog.

### Type

```ts
export interface CharacteristicEvent {
  readonly kind: 'read' | 'write' | 'notify' | 'error';
  readonly bytesHex: string;      // lower-case, no separator; '' for kind === 'error'
  readonly byteLength: number;    // 0 for kind === 'error'
  readonly at: number;            // ms since epoch
  readonly message?: string;      // present iff kind === 'error' or kind === 'write'
}
```

### Invariants

- The EventLog retains the last **20** entries per characteristic
  (FR-014); oldest dropped on overflow.
- `bytesHex` is rendered in a monospaced theme token; no
  separator (e.g., `'01ab23'`).
- For `kind === 'write'`, `message` is `'wrote N bytes'` and
  `bytesHex` is the **payload** that was written.
- For `kind === 'error'`, `bytesHex === ''`, `byteLength === 0`,
  and `message` is the human-readable failure reason.
- The `PeripheralPanel` debounces re-renders to 100 ms windows;
  the underlying buffer never drops bytes (FR-014).

---

## Entity 11 — `BluetoothLabState` (hook state)

The composite state object returned by `useBleCentral()`.

### Type

```ts
export interface BluetoothLabState {
  readonly central: CentralState;
  readonly permission: PermissionStatus;
  readonly scan: ScanState;
  readonly scanFilter: readonly string[];      // current service-UUID filter
  readonly allowDuplicates: boolean;
  readonly discovered: readonly DiscoveredPeripheral[];
  readonly connected: ConnectedSnapshot | null;
  readonly lastError?: string;

  // actions (stable identities; reducer-backed)
  readonly setScan: (next: boolean) => void;
  readonly setFilter: (commaSeparated: string) => void;        // validated; stores parsed array on success
  readonly setAllowDuplicates: (next: boolean) => void;
  readonly connect: (peripheralId: string) => Promise<void>;
  readonly disconnect: () => Promise<void>;
  readonly read: (characteristicId: string) => Promise<void>;
  readonly write: (characteristicId: string, bytes: Uint8Array) => Promise<void>;
  readonly subscribe: (characteristicId: string) => Promise<void>;
  readonly unsubscribe: (characteristicId: string) => Promise<void>;
  readonly requestPermission: () => Promise<void>;
  readonly refreshState: () => Promise<void>;
}

export interface ConnectedSnapshot {
  readonly peripheral: DiscoveredPeripheral;
  readonly services: readonly DiscoveredService[];
  readonly connectionState: ConnectionState;
  readonly events: Readonly<Record<string /* characteristicId */, readonly CharacteristicEvent[]>>;
}
```

### Invariants

- All action functions have stable identities across renders
  (memoised by the reducer pattern).
- `setFilter` parses the comma-separated input synchronously; on
  validation failure the hook stores `lastError` with the
  validation message and the `scanFilter` is unchanged. The
  `ScanControls` component gates the **Scan** toggle on
  `lastError == null` for filter-related errors.
- All `Promise`-returning actions catch their errors and dispatch
  `error/<classification>` (R-D); none surface as unhandled
  rejections (FR-023).
- `discovered` is sorted by RSSI descending; ties broken by
  `lastSeen` descending. The slicing to 100 rendered rows happens
  in `DiscoveredList`, not the hook (research §8).
- `connected` is `null` while `connectionState ∈
  {'disconnected'}`; non-null while in
  `{'connecting','connected','disconnecting'}` (so the
  PeripheralPanel can show the pill during the disconnecting
  transition).
- The hook is the **only** public surface consumed by the screen
  variants. Components do not import `src/native/ble-central.ts`
  directly.

### Lifecycle

| Phase | Behaviour |
|-------|-----------|
| Mount | Read `bridge.getState()`; subscribe to `stateChange`, `peripheralDiscovered`, `connectionStateChange`, `characteristicValue` events; start a 1 s `setInterval` for stale-row pruning. |
| Tick (1 s) | If `mounted`, dispatch `discovered/prune` removing rows where `Date.now() - lastSeen > 30_000`. |
| Action | Bridge call inside `enqueue` (R-A); on success, dispatch the corresponding action; on error, classify (R-D) and dispatch `error/<classification>`. |
| Unmount | Synchronously set `mounted.current = false`; clear the prune interval; for each active subscription, call `bridge.unsubscribeCharacteristic(id)`; if `connected != null`, call `bridge.disconnect(id)` (best-effort, swallow rejection); detach all event listeners through their unsubscribe handles. SC-010: zero post-unmount calls. |

---

## Typed error classes

All four classes live in `src/native/ble-central.types.ts` so every
platform variant of the bridge shares the same class identity.

```ts
export class BleNotSupported extends Error {
  readonly name = 'BleNotSupported';
  readonly code = 'BleNotSupported' as const;
  constructor(message?: string) { super(message ?? 'Bluetooth not supported on this platform'); }
}

export class BleNotAuthorized extends Error {
  readonly name = 'BleNotAuthorized';
  readonly code = 'BleNotAuthorized' as const;
  constructor(message?: string) { super(message ?? 'Bluetooth permission not granted'); }
}

export class BleNotPoweredOn extends Error {
  readonly name = 'BleNotPoweredOn';
  readonly code = 'BleNotPoweredOn' as const;
  constructor(message?: string) { super(message ?? 'Bluetooth radio is not powered on'); }
}

export class BleOperationFailed extends Error {
  readonly name = 'BleOperationFailed';
  readonly code: string; // 'operation-not-supported' | 'connection-failed' | 'timeout' | string
  constructor(code: string, message?: string) { super(message ?? code); this.code = code; }
}
```

### Invariants

- `instanceof` works across the three bridge platform files
  because every variant imports the class from the shared
  `*.types.ts` (single class identity).
- The hook's `classify(e)` function (R-D) uses these classes
  directly; no string matching.
- The bridge translates library-specific errors to these classes:
  - `BleErrorCode.BluetoothUnsupported` → `BleNotSupported`
  - `BleErrorCode.BluetoothUnauthorized` → `BleNotAuthorized`
  - `BleErrorCode.BluetoothPoweredOff` → `BleNotPoweredOn`
  - `BleErrorCode.CharacteristicNotFound` (and similar) →
    `BleOperationFailed('operation-not-supported', …)`
  - All other `BleError` instances → `BleOperationFailed(<code>, …)`

---

## Cross-entity invariants

1. The Web Bluetooth and `react-native-ble-plx` library types are
   normalised to the shapes above **inside the bridge**; the hook
   and screen never see library-specific types.
2. The hook is the only producer of `BluetoothLabState`; the
   screen and components consume sub-shapes via props, never the
   whole state.
3. Every action method on the hook is stable across renders
   (reducer pattern), so child components do not re-render when
   only their callbacks would change identity.
4. The four typed error classes are the only errors the hook
   classifies; any other thrown value falls into the `'failed'`
   bucket (R-D).
