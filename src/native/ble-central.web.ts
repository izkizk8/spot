/**
 * BLE Central Bridge — Web variant
 * Feature: 035-core-bluetooth
 *
 * Web Bluetooth path. When `navigator.bluetooth === undefined` every async
 * method rejects with `BleNotSupported`. MUST NOT import the iOS bridge
 * (`./ble-central.ts`) at module evaluation time (SC-007).
 *
 * Mutating async methods are serialised through a closure-scoped promise
 * chain so back-to-back calls resolve in submission order even when an
 * earlier call rejects (R-A).
 *
 * @see specs/035-core-bluetooth/contracts/ble-central-bridge.md
 */

import {
  type BleCentralEmitter,
  type BleCentralEvents,
  type CentralState,
  type DiscoveredCharacteristic,
  type DiscoveredService,
  type PermissionStatus,
  type ScanOptions,
  type CharacteristicProperty,
  BleNotAuthorized,
  BleNotPoweredOn,
  BleNotSupported,
  BleOperationFailed,
} from './ble-central.types';

export {
  BleNotAuthorized,
  BleNotPoweredOn,
  BleNotSupported,
  BleOperationFailed,
} from './ble-central.types';

// ─────────────────────────────────────────────────────────────────────────────
// navigator.bluetooth shape (minimal subset)
// ─────────────────────────────────────────────────────────────────────────────

interface WebBluetoothCharacteristic {
  uuid: string;
  properties: {
    read: boolean;
    write: boolean;
    writeWithoutResponse: boolean;
    notify: boolean;
    indicate: boolean;
  };
  readValue(): Promise<DataView>;
  writeValue(bytes: BufferSource): Promise<void>;
  writeValueWithResponse?(bytes: BufferSource): Promise<void>;
  writeValueWithoutResponse?(bytes: BufferSource): Promise<void>;
  startNotifications(): Promise<WebBluetoothCharacteristic>;
  stopNotifications(): Promise<WebBluetoothCharacteristic>;
  addEventListener(event: 'characteristicvaluechanged', handler: (e: Event) => void): void;
  removeEventListener(event: 'characteristicvaluechanged', handler: (e: Event) => void): void;
  value: DataView | null;
}

interface WebBluetoothService {
  uuid: string;
  getCharacteristics(): Promise<WebBluetoothCharacteristic[]>;
}

interface WebBluetoothServer {
  connected: boolean;
  connect(): Promise<WebBluetoothServer>;
  disconnect(): void;
  getPrimaryServices(): Promise<WebBluetoothService[]>;
}

interface WebBluetoothDevice {
  id: string;
  name?: string | null;
  gatt?: WebBluetoothServer;
}

interface WebBluetoothNavigator {
  requestDevice(opts: {
    acceptAllDevices?: boolean;
    filters?: { services: string[] }[];
    optionalServices?: string[];
  }): Promise<WebBluetoothDevice>;
  getAvailability?(): Promise<boolean>;
}

function getNav(): WebBluetoothNavigator | undefined {
  if (typeof navigator === 'undefined') return undefined;
  const nav = (navigator as unknown as { bluetooth?: WebBluetoothNavigator }).bluetooth;
  return nav;
}

// ─────────────────────────────────────────────────────────────────────────────
// Cached availability
// ─────────────────────────────────────────────────────────────────────────────

let cachedState: CentralState = 'unknown';

function refreshAvailability(): void {
  const nav = getNav();
  if (!nav) {
    cachedState = 'unsupported';
    return;
  }
  if (typeof nav.getAvailability === 'function') {
    nav
      .getAvailability()
      .then((ok) => {
        cachedState = ok ? 'poweredOn' : 'poweredOff';
        emit('stateChange', { state: cachedState });
      })
      .catch(() => {
        // Leave cached state.
      });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Emitter
// ─────────────────────────────────────────────────────────────────────────────

type Listener<K extends keyof BleCentralEvents> = (payload: BleCentralEvents[K]) => void;

const listeners: { [K in keyof BleCentralEvents]?: Set<Listener<K>> } = {};

function emit<K extends keyof BleCentralEvents>(event: K, payload: BleCentralEvents[K]): void {
  const set = listeners[event] as Set<Listener<K>> | undefined;
  if (!set) return;
  for (const fn of Array.from(set)) {
    try {
      fn(payload);
    } catch {
      // Listener errors are not bridge errors.
    }
  }
}

export const emitter: BleCentralEmitter = {
  on<K extends keyof BleCentralEvents>(
    event: K,
    handler: (payload: BleCentralEvents[K]) => void,
  ): () => void {
    let set = listeners[event] as Set<Listener<K>> | undefined;
    if (!set) {
      set = new Set();
      (listeners as Record<string, unknown>)[event] = set;
    }
    set.add(handler);
    return () => {
      set?.delete(handler);
    };
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Serialisation chain (R-A applies on Web too)
// ─────────────────────────────────────────────────────────────────────────────

let chain: Promise<unknown> = Promise.resolve();

function enqueue<T>(fn: () => Promise<T>): Promise<T> {
  const result = chain.then(fn, fn);
  chain = result.catch(() => undefined);
  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// In-memory maps
// ─────────────────────────────────────────────────────────────────────────────

const devices: Map<string, WebBluetoothDevice> = new Map();
const services: Map<string, { device: WebBluetoothDevice; service: WebBluetoothService }> =
  new Map();
const characteristics: Map<
  string,
  { service: WebBluetoothService; char: WebBluetoothCharacteristic; handler?: (e: Event) => void }
> = new Map();

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function dataViewToHex(dv: DataView | null): { hex: string; len: number } {
  if (!dv) return { hex: '', len: 0 };
  let hex = '';
  for (let i = 0; i < dv.byteLength; i++) {
    hex += dv.getUint8(i).toString(16).padStart(2, '0');
  }
  return { hex, len: dv.byteLength };
}

function translateError(e: unknown): Error {
  if (
    e instanceof BleNotSupported ||
    e instanceof BleNotAuthorized ||
    e instanceof BleNotPoweredOn ||
    e instanceof BleOperationFailed
  ) {
    return e;
  }
  const name = (e as { name?: string }).name ?? '';
  const message = (e as { message?: string }).message ?? String(e);
  switch (name) {
    case 'NotFoundError':
      return new BleOperationFailed('operation-cancelled', message);
    case 'SecurityError':
      return new BleNotAuthorized(message);
    case 'NotSupportedError':
      return new BleNotSupported(message);
    case 'NetworkError':
      return new BleOperationFailed('connection-failed', message);
    default:
      return new BleOperationFailed('failed', message);
  }
}

function characteristicProperties(
  c: WebBluetoothCharacteristic,
): readonly CharacteristicProperty[] {
  const out: CharacteristicProperty[] = [];
  if (c.properties.read) out.push('read');
  if (c.properties.write) out.push('write');
  if (c.properties.writeWithoutResponse) out.push('writeWithoutResponse');
  if (c.properties.notify) out.push('notify');
  if (c.properties.indicate) out.push('indicate');
  return out;
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

// Initialise availability lazily (don't run side-effects at import time on
// SSR-style web bundles unless `navigator` exists).
if (typeof navigator !== 'undefined') {
  refreshAvailability();
}

export function getState(): CentralState {
  if (!getNav()) return 'unsupported';
  return cachedState;
}

export function isAvailable(): boolean {
  return getNav() != null;
}

export function requestPermission(): Promise<PermissionStatus> {
  if (!getNav()) return Promise.reject(new BleNotSupported());
  return Promise.resolve('notApplicable');
}

export function startScan(opts: ScanOptions): Promise<void> {
  const nav = getNav();
  if (!nav) return Promise.reject(new BleNotSupported());
  return enqueue(async () => {
    try {
      const filterUuids = opts.serviceUUIDs ?? [];
      const requestOpts =
        filterUuids.length === 0
          ? { acceptAllDevices: true }
          : { filters: [{ services: filterUuids as string[] }] };
      const device = await nav.requestDevice(requestOpts);
      devices.set(device.id, device);
      emit('peripheralDiscovered', {
        peripheral: {
          id: device.id,
          name: device.name ?? null,
          rssi: -127,
          serviceUUIDs: (filterUuids as string[]).map((u) => u.toLowerCase()),
          lastSeen: Date.now(),
        },
      });
    } catch (e) {
      throw translateError(e);
    }
  });
}

export function stopScan(): Promise<void> {
  if (!getNav()) return Promise.reject(new BleNotSupported());
  return enqueue(async () => {
    // Web Bluetooth has no continuous scan; resolve.
  });
}

export function connect(peripheralId: string): Promise<void> {
  if (!getNav()) return Promise.reject(new BleNotSupported());
  return enqueue(async () => {
    try {
      const device = devices.get(peripheralId);
      if (!device || !device.gatt) {
        throw new BleOperationFailed('connection-failed', `Unknown peripheralId ${peripheralId}`);
      }
      emit('connectionStateChange', { peripheralId, state: 'connecting' });
      await device.gatt.connect();
      emit('connectionStateChange', { peripheralId, state: 'connected' });
    } catch (e) {
      throw translateError(e);
    }
  });
}

export function disconnect(peripheralId: string): Promise<void> {
  if (!getNav()) return Promise.reject(new BleNotSupported());
  return enqueue(async () => {
    try {
      const device = devices.get(peripheralId);
      emit('connectionStateChange', { peripheralId, state: 'disconnecting' });
      device?.gatt?.disconnect();
      emit('connectionStateChange', { peripheralId, state: 'disconnected' });
    } catch (e) {
      throw translateError(e);
    }
  });
}

export function discoverServices(peripheralId: string): Promise<readonly DiscoveredService[]> {
  if (!getNav()) return Promise.reject(new BleNotSupported());
  return enqueue(async () => {
    try {
      const device = devices.get(peripheralId);
      if (!device || !device.gatt) {
        throw new BleOperationFailed(
          'peripheral-disconnected',
          `Unknown peripheralId ${peripheralId}`,
        );
      }
      const list = await device.gatt.getPrimaryServices();
      const out: DiscoveredService[] = [];
      for (const s of list) {
        const id = `${peripheralId}|${s.uuid}`;
        services.set(id, { device, service: s });
        out.push({
          id,
          uuid: s.uuid.toLowerCase(),
          isWellKnown: s.uuid.length === 4,
          characteristics: [],
        });
      }
      return out;
    } catch (e) {
      throw translateError(e);
    }
  });
}

export function discoverCharacteristics(
  serviceId: string,
): Promise<readonly DiscoveredCharacteristic[]> {
  if (!getNav()) return Promise.reject(new BleNotSupported());
  return enqueue(async () => {
    try {
      const entry = services.get(serviceId);
      if (!entry) throw new BleOperationFailed('failed', `Unknown serviceId ${serviceId}`);
      const list = await entry.service.getCharacteristics();
      const out: DiscoveredCharacteristic[] = [];
      for (const c of list) {
        const id = `${serviceId}|${c.uuid}`;
        characteristics.set(id, { service: entry.service, char: c });
        out.push({
          id,
          uuid: c.uuid.toLowerCase(),
          serviceId,
          properties: characteristicProperties(c),
          isSubscribed: false,
        });
      }
      return out;
    } catch (e) {
      throw translateError(e);
    }
  });
}

export function readCharacteristic(
  characteristicId: string,
): Promise<{ bytesHex: string; byteLength: number }> {
  if (!getNav()) return Promise.reject(new BleNotSupported());
  return enqueue(async () => {
    try {
      const entry = characteristics.get(characteristicId);
      if (!entry) {
        throw new BleOperationFailed('failed', `Unknown characteristicId ${characteristicId}`);
      }
      const dv = await entry.char.readValue();
      const { hex, len } = dataViewToHex(dv);
      return { bytesHex: hex, byteLength: len };
    } catch (e) {
      throw translateError(e);
    }
  });
}

export function writeCharacteristic(
  characteristicId: string,
  bytes: Uint8Array,
  withoutResponse: boolean,
): Promise<{ byteLength: number }> {
  if (!getNav()) return Promise.reject(new BleNotSupported());
  return enqueue(async () => {
    try {
      const entry = characteristics.get(characteristicId);
      if (!entry) {
        throw new BleOperationFailed('failed', `Unknown characteristicId ${characteristicId}`);
      }
      const buffer = bytes.buffer.slice(
        bytes.byteOffset,
        bytes.byteOffset + bytes.byteLength,
      ) as ArrayBuffer;
      if (withoutResponse && entry.char.writeValueWithoutResponse) {
        await entry.char.writeValueWithoutResponse(buffer);
      } else if (!withoutResponse && entry.char.writeValueWithResponse) {
        await entry.char.writeValueWithResponse(buffer);
      } else {
        await entry.char.writeValue(buffer);
      }
      return { byteLength: bytes.length };
    } catch (e) {
      throw translateError(e);
    }
  });
}

export function subscribeCharacteristic(characteristicId: string): Promise<void> {
  if (!getNav()) return Promise.reject(new BleNotSupported());
  return enqueue(async () => {
    try {
      const entry = characteristics.get(characteristicId);
      if (!entry) {
        throw new BleOperationFailed('failed', `Unknown characteristicId ${characteristicId}`);
      }
      if (entry.handler) return;
      const handler = (e: Event) => {
        const target = e.target as unknown as { value?: DataView | null };
        const dv = target?.value ?? null;
        const { hex, len } = dataViewToHex(dv);
        emit('characteristicValue', {
          characteristicId,
          bytesHex: hex,
          byteLength: len,
          at: Date.now(),
        });
      };
      await entry.char.startNotifications();
      entry.char.addEventListener('characteristicvaluechanged', handler);
      entry.handler = handler;
    } catch (e) {
      throw translateError(e);
    }
  });
}

export function unsubscribeCharacteristic(characteristicId: string): Promise<void> {
  if (!getNav()) return Promise.reject(new BleNotSupported());
  return enqueue(async () => {
    try {
      const entry = characteristics.get(characteristicId);
      if (!entry || !entry.handler) return;
      entry.char.removeEventListener('characteristicvaluechanged', entry.handler);
      await entry.char.stopNotifications().catch(() => undefined);
      entry.handler = undefined;
    } catch (e) {
      throw translateError(e);
    }
  });
}

export function __resetForTests(): void {
  cachedState = 'unknown';
  chain = Promise.resolve();
  devices.clear();
  services.clear();
  characteristics.clear();
  for (const k of Object.keys(listeners)) {
    delete (listeners as Record<string, unknown>)[k];
  }
}
