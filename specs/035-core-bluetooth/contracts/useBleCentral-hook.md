# Contract — `useBleCentral` hook

**Feature**: 035-core-bluetooth
**See**: [spec.md](../spec.md) FR-006 .. FR-015, FR-023, FR-024
**See**: [data-model.md](../data-model.md) Entity 11
   (`BluetoothLabState`)
**See**: [research.md](../research.md) §1 (R-A serialisation),
   §4 (R-D classification), §5 (R-E events), §8 (caps + pruning)

Implementation file:

- `src/modules/bluetooth-lab/hooks/useBleCentral.ts`

The hook is the **only** public surface consumed by the screen
variants and components. It composes the bridge's typed surface
(see [`ble-central-bridge.md`](./ble-central-bridge.md)) into the
state object documented below and exposes stable-identity action
functions.

## Invariants (asserted by `useBleCentral.test.tsx`)

- **H1**. The hook returns a single `BluetoothLabState` object
  (Entity 11) per render. All action functions have stable
  identities across renders (memoised by the reducer pattern).
- **H2**. **Mount**: the hook reads `bridge.getState()`,
  subscribes to all four bridge events
  (`stateChange`, `peripheralDiscovered`, `connectionStateChange`,
  `characteristicValue`) via `bridge.emitter.on(...)`, and starts
  a 1 s `setInterval` for stale-row pruning (research §8).
- **H3**. **Unmount**: the hook synchronously sets
  `mounted.current = false`; clears the prune interval; tears
  down every active subscription (calls
  `bridge.unsubscribeCharacteristic(id)` for each); if a
  peripheral is connected, calls `bridge.disconnect(id)`
  best-effort (rejection swallowed); detaches every event
  listener through its returned unsubscribe handle. **No callback
  fires after unmount** (FR-024 / SC-010).
- **H4**. Every `Promise`-returning action wraps the bridge call
  in a `try / catch`; on catch it dispatches
  `error/<classification>` per R-D's classifier. None surface as
  unhandled rejections (FR-023).
- **H5**. **Scan toggle gating** (FR-006): when `central !== 'poweredOn'`,
  `setScan(true)` is a no-op that dispatches a
  `'scanBlockedByCentralState'` action; the bridge is NOT
  invoked.
- **H6**. **Filter validation** (FR-006): `setFilter(comma)`
  parses the comma-separated input synchronously. Each entry must
  match a UUID (4-char short form OR 36-char full UUID). On
  failure the hook stores `lastError` with the validation message
  and `scanFilter` is unchanged. The screen gates the **Scan**
  toggle on `lastError == null` for filter errors.
- **H7**. **Connect → discover flow** (FR-010): on
  `connect(id)` success, the hook automatically dispatches
  `discoverServices(id)`; for each resolved service it dispatches
  `discoverCharacteristics(serviceId)`. The discoveries run
  serially via the bridge's `enqueue` chain (R-A), so the
  PeripheralPanel sees a stable shape.
- **H8**. **Stale-row prune** (FR-009): on every 1 s tick, rows
  where `Date.now() - lastSeen > 30_000` are removed from
  `discovered`. Configurable threshold (default 30 s); not
  user-tunable in v1.
- **H9**. **EventLog cap** (FR-014): per-characteristic events
  are stored in an array capped at 20 entries (oldest dropped on
  push).
- **H10**. **Single connection at a time** (spec edge case): a
  new `connect(id)` while `connected != null` (any state other
  than `'disconnected'`) rejects synchronously with
  `BleOperationFailed('connection-in-progress', …)`; the bridge
  is NOT invoked.
- **H11**. **Auto-resume on `poweredOn`** (FR-025): when the
  central state transitions out of `'poweredOn'` while scanning,
  `scan` flips to `'paused'` and the bridge's scan is stopped.
  When the central returns to `'poweredOn'`, the hook
  automatically restarts the scan with the current filter (only
  if the user did not toggle scan off in the interim).

## Hook return shape

```ts
export interface BluetoothLabState {
  // observed state (read-only views of the hook's reducer)
  readonly central: CentralState;
  readonly permission: PermissionStatus;
  readonly scan: ScanState;
  readonly scanFilter: readonly string[];
  readonly allowDuplicates: boolean;
  readonly discovered: readonly DiscoveredPeripheral[];
  readonly connected: ConnectedSnapshot | null;
  readonly lastError?: string;

  // actions (stable identities; reducer-backed)
  readonly setScan: (next: boolean) => void;
  readonly setFilter: (commaSeparated: string) => void;
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
```

`ConnectedSnapshot` shape: see [data-model.md](../data-model.md)
Entity 11.

## Reducer actions (internal)

| Action | Payload | Effect |
|--------|---------|--------|
| `central/update` | `{ state: CentralState }` | Updates `central`; if leaving `'poweredOn'` while scanning, flips `scan` to `'paused'` and stops bridge scan; if returning to `'poweredOn'` while paused, restarts bridge scan with current filter (H11). |
| `permission/update` | `{ status: PermissionStatus }` | Updates `permission`. |
| `scan/setRequested` | `{ requested: boolean }` | Drives `scan` based on `central` and `requested`. |
| `scan/setFilter` | `{ uuids: readonly string[] }` | Validated by H6. |
| `scan/setAllowDuplicates` | `{ next: boolean }` | Forwards to bridge on next `startScan`. |
| `discovered/add` | `{ peripheral }` | Adds or updates a row; sorts by RSSI desc, ties by lastSeen desc. |
| `discovered/prune` | `{ now: number }` | Removes rows where `now - lastSeen > 30_000`. |
| `connected/start` | `{ peripheral }` | `connectionState = 'connecting'`. |
| `connected/connected` | `void` | `connectionState = 'connected'`. |
| `connected/services` | `{ services }` | Populates the service tree. |
| `connected/characteristics` | `{ serviceId, chars }` | Populates a service's characteristic list. |
| `connected/event` | `{ characteristicId, event: CharacteristicEvent }` | Pushes to the event log; cap 20. |
| `connected/disconnecting` | `void` | `connectionState = 'disconnecting'`. |
| `connected/disconnected` | `void` | Tears down `connected` snapshot (sets to `null`). |
| `error/<classification>` | `{ message: string }` | Sets `lastError` per R-D. |

## Lifecycle (test-asserted sequence)

1. **Mount** → 1 sync read of `getState()`, 4 emitter
   `on(...)` calls, 1 `setInterval(1000)`.
2. **User toggles scan on** → `setScan(true)` → if
   `central === 'poweredOn'` and filter is valid:
   `bridge.startScan({ serviceUUIDs, allowDuplicates })`. ScanControls
   pill flips to `'scanning'`.
3. **Bridge emits `peripheralDiscovered`** → reducer dispatches
   `discovered/add`.
4. **User taps Connect on a row** → `connect(peripheralId)` → bridge
   `connect(id)` → on success, hook auto-runs `discoverServices(id)`
   and per-service `discoverCharacteristics(serviceId)`.
5. **User taps Read on a characteristic** → `read(charId)` →
   bridge `readCharacteristic(charId)` → reducer dispatches
   `connected/event { kind: 'read', bytesHex, … }`.
6. **Bridge emits `characteristicValue` for a subscribed char** →
   reducer dispatches `connected/event { kind: 'notify', … }`.
   The PeripheralPanel debounces re-renders to 100 ms windows
   (FR-014); the underlying buffer never drops bytes.
7. **User taps Disconnect** → `disconnect()` → for each
   `isSubscribed` characteristic, hook calls
   `bridge.unsubscribeCharacteristic(charId)` (parallel-safe via
   `enqueue`); then `bridge.disconnect(id)`. Reducer transitions
   `connectionState` `'disconnecting'` → `'disconnected'` and
   tears down the `connected` snapshot.
8. **Unmount** → H3 cleanup.

## Testing strategy

- The bridge module is mocked at the import boundary
  (`jest.mock('@/native/ble-central', () => …)`). The mock
  exposes a controllable emitter (so the test can drive
  `peripheralDiscovered`, `connectionStateChange`, etc., events
  by hand) and resolved / rejecting promises for each method.
- `jest.useFakeTimers()` exercises H8 (1 s tick) and FR-014
  (100 ms coalescing).
- `instanceof` assertions verify R-D's classifier picks the
  right typed error class.
- A "no post-unmount call" assertion: after `unmount()`, the test
  fires synthetic emitter events and resolves pending bridge
  promises; the hook MUST NOT dispatch any action. A
  `dispatch` spy with `expect(dispatch).not.toHaveBeenCalled()`
  after the unmount-time call count is captured.
