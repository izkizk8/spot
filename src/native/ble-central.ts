/**
 * BLE Central Bridge — iOS variant
 * Feature: 035-core-bluetooth
 *
 * Single seam where react-native-ble-plx is imported. Wraps the upstream
 * BleManager into a typed bridge surface; mutating async calls are
 * serialised through a closure-scoped promise chain (R-A) so back-to-back
 * calls execute in submission order even when an earlier call rejects.
 *
 * @see specs/035-core-bluetooth/contracts/ble-central-bridge.md
 */

import { Platform } from 'react-native';
import {
  BleManager,
  type Device,
  type Service,
  type Characteristic,
  type Subscription,
  BleErrorCode,
} from 'react-native-ble-plx';

import {
  type BleCentralEmitter,
  type BleCentralEvents,
  type CentralState,
  type DiscoveredCharacteristic,
  type DiscoveredPeripheral,
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
// Manager (lazy-instantiated; module-level singleton)
// ─────────────────────────────────────────────────────────────────────────────

let manager: BleManager | null = null;

function getManager(): BleManager {
  if (!manager) {
    manager = new BleManager();
  }
  return manager;
}

// ─────────────────────────────────────────────────────────────────────────────
// State cache
// ─────────────────────────────────────────────────────────────────────────────

let cachedState: CentralState = 'unknown';

// ─────────────────────────────────────────────────────────────────────────────
// Typed emitter
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
// Library state subscription (registered lazily on first use)
// ─────────────────────────────────────────────────────────────────────────────

let stateSub: Subscription | null = null;
let connectionSubs: Map<string, Subscription> = new Map();
let charValueSubs: Map<string, Subscription> = new Map();

function mapBleState(s: string): CentralState {
  switch (s) {
    case 'PoweredOn':
      return 'poweredOn';
    case 'PoweredOff':
      return 'poweredOff';
    case 'Unauthorized':
      return 'unauthorized';
    case 'Unsupported':
      return 'unsupported';
    case 'Resetting':
      return 'resetting';
    default:
      return 'unknown';
  }
}

function ensureStateSubscription(): void {
  if (stateSub) return;
  const m = getManager();
  stateSub = m.onStateChange((next: string) => {
    const mapped = mapBleState(next);
    cachedState = mapped;
    emit('stateChange', { state: mapped });
  }, true);
}

// ─────────────────────────────────────────────────────────────────────────────
// Serialisation chain (R-A)
// ─────────────────────────────────────────────────────────────────────────────

let chain: Promise<unknown> = Promise.resolve();

function enqueue<T>(fn: () => Promise<T>): Promise<T> {
  const result = chain.then(fn, fn);
  chain = result.catch(() => undefined);
  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// Error translation (R-D)
// ─────────────────────────────────────────────────────────────────────────────

function translateError(e: unknown): Error {
  if (
    e instanceof BleNotSupported ||
    e instanceof BleNotAuthorized ||
    e instanceof BleNotPoweredOn ||
    e instanceof BleOperationFailed
  ) {
    return e;
  }
  const errorCode = (e as { errorCode?: number; message?: string }).errorCode;
  const message = (e as { message?: string }).message ?? String(e);
  switch (errorCode) {
    case BleErrorCode.BluetoothUnsupported:
      return new BleNotSupported(message);
    case BleErrorCode.BluetoothUnauthorized:
      return new BleNotAuthorized(message);
    case BleErrorCode.BluetoothPoweredOff:
      return new BleNotPoweredOn(message);
    case BleErrorCode.OperationCancelled:
      return new BleOperationFailed('operation-cancelled', message);
    case BleErrorCode.OperationTimedOut:
      return new BleOperationFailed('timeout', message);
    case BleErrorCode.DeviceDisconnected:
      return new BleOperationFailed('peripheral-disconnected', message);
    case BleErrorCode.DeviceConnectionFailed:
      return new BleOperationFailed('connection-failed', message);
    default:
      if (typeof errorCode === 'number') {
        return new BleOperationFailed('failed', message);
      }
      return new BleOperationFailed('failed', message);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function deviceToPeripheral(d: Device): DiscoveredPeripheral {
  return {
    id: d.id,
    name: d.name ?? d.localName ?? null,
    rssi: typeof d.rssi === 'number' ? d.rssi : -127,
    serviceUUIDs: (d.serviceUUIDs ?? []).map((u) => u.toLowerCase()),
    lastSeen: Date.now(),
  };
}

function serviceToDiscoveredService(s: Service): DiscoveredService {
  return {
    id: s.id != null ? String(s.id) : s.uuid,
    uuid: s.uuid.toLowerCase(),
    isWellKnown: s.uuid.length === 4 || s.uuid.toLowerCase().startsWith('0000'),
    characteristics: [],
  };
}

function charToDiscoveredCharacteristic(c: Characteristic): DiscoveredCharacteristic {
  const properties: CharacteristicProperty[] = [];
  if (c.isReadable) properties.push('read');
  if (c.isWritableWithResponse) properties.push('write');
  if (c.isWritableWithoutResponse) properties.push('writeWithoutResponse');
  if (c.isNotifiable) properties.push('notify');
  if (c.isIndicatable) properties.push('indicate');
  return {
    id: c.id != null ? String(c.id) : c.uuid,
    uuid: c.uuid.toLowerCase(),
    serviceId: c.serviceID != null ? String(c.serviceID) : c.serviceUUID,
    properties,
    isSubscribed: false,
  };
}

const charById: Map<string, Characteristic> = new Map();
const serviceById: Map<string, Service> = new Map();
const deviceById: Map<string, Device> = new Map();

// base64 helpers (RN provides global atob/btoa via core-js polyfills)
declare const atob: (s: string) => string;
declare const btoa: (s: string) => string;

function base64ToHex(b64: string): { hex: string; len: number } {
  const bin = atob(b64);
  let hex = '';
  for (let i = 0; i < bin.length; i++) {
    hex += bin.charCodeAt(i).toString(16).padStart(2, '0');
  }
  return { hex, len: bin.length };
}

function bytesToBase64(bytes: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < bytes.length; i++) {
    bin += String.fromCharCode(bytes[i]);
  }
  return btoa(bin);
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

export function getState(): CentralState {
  if (Platform.OS !== 'ios') return 'unsupported';
  ensureStateSubscription();
  return cachedState;
}

export function isAvailable(): boolean {
  return Platform.OS === 'ios';
}

export function requestPermission(): Promise<PermissionStatus> {
  if (Platform.OS !== 'ios') {
    return Promise.reject(new BleNotSupported());
  }
  // iOS < 13 short-circuits to 'granted' (FR-005)
  const v = Platform.Version;
  const major = typeof v === 'number' ? Math.floor(v) : typeof v === 'string' ? parseInt(v, 10) : 0;
  if (major < 13) {
    return Promise.resolve('granted');
  }
  ensureStateSubscription();
  switch (cachedState) {
    case 'poweredOn':
    case 'poweredOff':
    case 'resetting':
      return Promise.resolve('granted');
    case 'unauthorized':
      return Promise.resolve('denied');
    case 'unsupported':
      return Promise.resolve('restricted');
    default:
      return Promise.resolve('undetermined');
  }
}

export function startScan(opts: ScanOptions): Promise<void> {
  if (Platform.OS !== 'ios') return Promise.reject(new BleNotSupported());
  return enqueue(
    () =>
      new Promise<void>((resolve, reject) => {
        try {
          const m = getManager();
          const uuids =
            opts.serviceUUIDs && opts.serviceUUIDs.length > 0 ? opts.serviceUUIDs : null;
          m.startDeviceScan(
            uuids as string[] | null,
            { allowDuplicates: opts.allowDuplicates },
            (error, device) => {
              if (error) {
                emit('stateChange', { state: cachedState });
                return;
              }
              if (device) {
                deviceById.set(device.id, device);
                emit('peripheralDiscovered', { peripheral: deviceToPeripheral(device) });
              }
            },
          );
          resolve();
        } catch (e) {
          reject(translateError(e));
        }
      }),
  );
}

export function stopScan(): Promise<void> {
  if (Platform.OS !== 'ios') return Promise.reject(new BleNotSupported());
  return enqueue(async () => {
    try {
      getManager().stopDeviceScan();
    } catch (e) {
      throw translateError(e);
    }
  });
}

export function connect(peripheralId: string): Promise<void> {
  if (Platform.OS !== 'ios') return Promise.reject(new BleNotSupported());
  return enqueue(async () => {
    try {
      emit('connectionStateChange', { peripheralId, state: 'connecting' });
      const device = await getManager().connectToDevice(peripheralId);
      deviceById.set(device.id, device);
      const sub = device.onDisconnected((_err, d) => {
        emit('connectionStateChange', {
          peripheralId: d?.id ?? peripheralId,
          state: 'disconnected',
        });
      });
      connectionSubs.set(peripheralId, sub);
      emit('connectionStateChange', { peripheralId, state: 'connected' });
    } catch (e) {
      throw translateError(e);
    }
  });
}

export function disconnect(peripheralId: string): Promise<void> {
  if (Platform.OS !== 'ios') return Promise.reject(new BleNotSupported());
  return enqueue(async () => {
    try {
      emit('connectionStateChange', { peripheralId, state: 'disconnecting' });
      await getManager().cancelDeviceConnection(peripheralId);
      connectionSubs.get(peripheralId)?.remove();
      connectionSubs.delete(peripheralId);
      emit('connectionStateChange', { peripheralId, state: 'disconnected' });
    } catch (e) {
      throw translateError(e);
    }
  });
}

export function discoverServices(peripheralId: string): Promise<readonly DiscoveredService[]> {
  if (Platform.OS !== 'ios') return Promise.reject(new BleNotSupported());
  return enqueue(async () => {
    try {
      const device =
        await getManager().discoverAllServicesAndCharacteristicsForDevice(peripheralId);
      deviceById.set(device.id, device);
      const services = await device.services();
      for (const s of services) serviceById.set(String(s.id ?? s.uuid), s);
      return services.map(serviceToDiscoveredService);
    } catch (e) {
      throw translateError(e);
    }
  });
}

export function discoverCharacteristics(
  serviceId: string,
): Promise<readonly DiscoveredCharacteristic[]> {
  if (Platform.OS !== 'ios') return Promise.reject(new BleNotSupported());
  return enqueue(async () => {
    try {
      const service = serviceById.get(serviceId);
      if (!service) {
        throw new BleOperationFailed('failed', `Unknown serviceId ${serviceId}`);
      }
      const chars = await service.characteristics();
      for (const c of chars) charById.set(String(c.id ?? c.uuid), c);
      return chars.map(charToDiscoveredCharacteristic);
    } catch (e) {
      throw translateError(e);
    }
  });
}

export function readCharacteristic(
  characteristicId: string,
): Promise<{ bytesHex: string; byteLength: number }> {
  if (Platform.OS !== 'ios') return Promise.reject(new BleNotSupported());
  return enqueue(async () => {
    try {
      const c = charById.get(characteristicId);
      if (!c)
        throw new BleOperationFailed('failed', `Unknown characteristicId ${characteristicId}`);
      const updated = await c.read();
      const value = updated.value ?? '';
      const { hex, len } = base64ToHex(value);
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
  if (Platform.OS !== 'ios') return Promise.reject(new BleNotSupported());
  return enqueue(async () => {
    try {
      const c = charById.get(characteristicId);
      if (!c)
        throw new BleOperationFailed('failed', `Unknown characteristicId ${characteristicId}`);
      const b64 = bytesToBase64(bytes);
      if (withoutResponse) {
        await c.writeWithoutResponse(b64);
      } else {
        await c.writeWithResponse(b64);
      }
      return { byteLength: bytes.length };
    } catch (e) {
      throw translateError(e);
    }
  });
}

export function subscribeCharacteristic(characteristicId: string): Promise<void> {
  if (Platform.OS !== 'ios') return Promise.reject(new BleNotSupported());
  return enqueue(async () => {
    try {
      const c = charById.get(characteristicId);
      if (!c)
        throw new BleOperationFailed('failed', `Unknown characteristicId ${characteristicId}`);
      if (charValueSubs.has(characteristicId)) return;
      const sub = c.monitor((error, updated) => {
        if (error || !updated) return;
        const value = updated.value ?? '';
        const { hex, len } = base64ToHex(value);
        emit('characteristicValue', {
          characteristicId,
          bytesHex: hex,
          byteLength: len,
          at: Date.now(),
        });
      });
      charValueSubs.set(characteristicId, sub);
    } catch (e) {
      throw translateError(e);
    }
  });
}

export function unsubscribeCharacteristic(characteristicId: string): Promise<void> {
  if (Platform.OS !== 'ios') return Promise.reject(new BleNotSupported());
  return enqueue(async () => {
    try {
      const sub = charValueSubs.get(characteristicId);
      if (sub) {
        sub.remove();
        charValueSubs.delete(characteristicId);
      }
    } catch (e) {
      throw translateError(e);
    }
  });
}

// Test-only reset (not part of the public surface but useful for unit tests).
export function __resetForTests(): void {
  manager = null;
  stateSub?.remove();
  stateSub = null;
  for (const s of connectionSubs.values()) s.remove();
  connectionSubs = new Map();
  for (const s of charValueSubs.values()) s.remove();
  charValueSubs = new Map();
  charById.clear();
  serviceById.clear();
  deviceById.clear();
  cachedState = 'unknown';
  chain = Promise.resolve();
  for (const k of Object.keys(listeners)) {
    delete (listeners as Record<string, unknown>)[k];
  }
}
