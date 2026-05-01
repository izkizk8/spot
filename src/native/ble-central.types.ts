/**
 * BLE Central Bridge Type Definitions
 * Feature: 035-core-bluetooth
 *
 * Shared type surface for BleCentralBridge across all platforms (iOS, Android, Web).
 * The four typed error classes are declared once here so every platform variant
 * shares the same class identity (`instanceof` works across files).
 *
 * @see specs/035-core-bluetooth/contracts/ble-central-bridge.md
 * @see specs/035-core-bluetooth/data-model.md (entities 1–10)
 */

// ─────────────────────────────────────────────────────────────────────────────
// Entity 1 — CentralState
// ─────────────────────────────────────────────────────────────────────────────

export type CentralState =
  | 'poweredOn'
  | 'poweredOff'
  | 'unauthorized'
  | 'unsupported'
  | 'resetting'
  | 'unknown';

// ─────────────────────────────────────────────────────────────────────────────
// Entity 2 — PermissionStatus
// ─────────────────────────────────────────────────────────────────────────────

export type PermissionStatus =
  | 'granted'
  | 'denied'
  | 'undetermined'
  | 'restricted'
  | 'notApplicable';

// ─────────────────────────────────────────────────────────────────────────────
// Entity 3 — ScanState
// ─────────────────────────────────────────────────────────────────────────────

export type ScanState = 'idle' | 'scanning' | 'paused';

// ─────────────────────────────────────────────────────────────────────────────
// Entity 4 — ScanOptions
// ─────────────────────────────────────────────────────────────────────────────

export interface ScanOptions {
  readonly serviceUUIDs?: readonly string[];
  readonly allowDuplicates: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Entity 5 — DiscoveredPeripheral
// ─────────────────────────────────────────────────────────────────────────────

export interface DiscoveredPeripheral {
  readonly id: string;
  readonly name: string | null;
  readonly rssi: number;
  readonly serviceUUIDs: readonly string[];
  readonly lastSeen: number;
  readonly manufacturerData?: Uint8Array;
}

// ─────────────────────────────────────────────────────────────────────────────
// Entity 6 — ConnectionState
// ─────────────────────────────────────────────────────────────────────────────

export type ConnectionState = 'connecting' | 'connected' | 'disconnecting' | 'disconnected';

// ─────────────────────────────────────────────────────────────────────────────
// Entity 9 — CharacteristicProperty
// ─────────────────────────────────────────────────────────────────────────────

export type CharacteristicProperty =
  | 'read'
  | 'write'
  | 'writeWithoutResponse'
  | 'notify'
  | 'indicate';

// ─────────────────────────────────────────────────────────────────────────────
// Entity 7 — DiscoveredService
// ─────────────────────────────────────────────────────────────────────────────

export interface DiscoveredService {
  readonly id: string;
  readonly uuid: string;
  readonly isWellKnown: boolean;
  readonly characteristics: readonly DiscoveredCharacteristic[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Entity 8 — DiscoveredCharacteristic
// ─────────────────────────────────────────────────────────────────────────────

export interface DiscoveredCharacteristic {
  readonly id: string;
  readonly uuid: string;
  readonly serviceId: string;
  readonly properties: readonly CharacteristicProperty[];
  readonly isSubscribed: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Entity 10 — CharacteristicEvent
// ─────────────────────────────────────────────────────────────────────────────

export interface CharacteristicEvent {
  readonly kind: 'read' | 'write' | 'notify' | 'error';
  readonly bytesHex: string;
  readonly byteLength: number;
  readonly at: number;
  readonly message?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Native module name
// ─────────────────────────────────────────────────────────────────────────────

export const NATIVE_MODULE_NAME = 'BleCentralBridge' as const;

// ─────────────────────────────────────────────────────────────────────────────
// Bridge interface
// ─────────────────────────────────────────────────────────────────────────────

export interface BleCentralEvents {
  stateChange: { state: CentralState };
  peripheralDiscovered: { peripheral: DiscoveredPeripheral };
  connectionStateChange: { peripheralId: string; state: ConnectionState };
  characteristicValue: {
    characteristicId: string;
    bytesHex: string;
    byteLength: number;
    at: number;
  };
}

export interface BleCentralEmitter {
  on<K extends keyof BleCentralEvents>(
    event: K,
    handler: (payload: BleCentralEvents[K]) => void,
  ): () => void;
}

export interface BleCentralBridge {
  getState(): CentralState;
  isAvailable(): boolean;
  requestPermission(): Promise<PermissionStatus>;
  startScan(opts: ScanOptions): Promise<void>;
  stopScan(): Promise<void>;
  connect(peripheralId: string): Promise<void>;
  disconnect(peripheralId: string): Promise<void>;
  discoverServices(peripheralId: string): Promise<readonly DiscoveredService[]>;
  discoverCharacteristics(serviceId: string): Promise<readonly DiscoveredCharacteristic[]>;
  readCharacteristic(characteristicId: string): Promise<{ bytesHex: string; byteLength: number }>;
  writeCharacteristic(
    characteristicId: string,
    bytes: Uint8Array,
    withoutResponse: boolean,
  ): Promise<{ byteLength: number }>;
  subscribeCharacteristic(characteristicId: string): Promise<void>;
  unsubscribeCharacteristic(characteristicId: string): Promise<void>;
  readonly emitter: BleCentralEmitter;
}

// ─────────────────────────────────────────────────────────────────────────────
// Typed error classes (single identity across platform variants)
// ─────────────────────────────────────────────────────────────────────────────

export class BleNotSupported extends Error {
  public readonly code = 'BleNotSupported' as const;
  constructor(message?: string) {
    super(message ?? 'Bluetooth not supported on this platform');
    this.name = 'BleNotSupported';
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, BleNotSupported);
    }
  }
}

export class BleNotAuthorized extends Error {
  public readonly code = 'BleNotAuthorized' as const;
  constructor(message?: string) {
    super(message ?? 'Bluetooth permission not granted');
    this.name = 'BleNotAuthorized';
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, BleNotAuthorized);
    }
  }
}

export class BleNotPoweredOn extends Error {
  public readonly code = 'BleNotPoweredOn' as const;
  constructor(message?: string) {
    super(message ?? 'Bluetooth radio is not powered on');
    this.name = 'BleNotPoweredOn';
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, BleNotPoweredOn);
    }
  }
}

export class BleOperationFailed extends Error {
  public readonly code: string;
  constructor(code: string, message?: string) {
    super(message ?? code);
    this.name = 'BleOperationFailed';
    this.code = code;
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, BleOperationFailed);
    }
  }
}
