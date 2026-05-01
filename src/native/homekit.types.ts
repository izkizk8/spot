/**
 * HomeKit bridge — shared type surface (feature 044).
 *
 * Types referenced by all four `src/native/homekit*.ts` siblings and
 * by the `useHomeKit` hook. Pure module: no React, no native imports.
 */

export const NATIVE_MODULE_NAME = 'HomeKitBridge' as const;

/** Coarse HomeKit access status reported by `HMHomeManager`. */
export type HomeKitAuthStatus = 'notDetermined' | 'authorized' | 'denied' | 'restricted';

export type CharacteristicKind = 'bool' | 'percent' | 'enum' | 'readonly';

export interface CharacteristicEnumOption {
  readonly value: number;
  readonly label: string;
}

export interface CharacteristicRecord {
  readonly id: string;
  readonly serviceId: string;
  readonly name: string;
  readonly kind: CharacteristicKind;
  readonly writable: boolean;
  readonly options?: readonly CharacteristicEnumOption[];
}

export interface AccessoryRecord {
  readonly id: string;
  readonly homeId: string;
  readonly roomId: string | null;
  readonly roomName: string | null;
  readonly name: string;
  readonly reachable: boolean;
  readonly characteristics: readonly CharacteristicRecord[];
}

export interface RoomRecord {
  readonly id: string;
  readonly name: string;
}

export interface HomeRecord {
  readonly id: string;
  readonly name: string;
  readonly isPrimary: boolean;
  readonly rooms: readonly RoomRecord[];
}

/** Characteristic value carried across the bridge. */
export type CharacteristicValue = boolean | number | string;

export interface HomeKitBridge {
  isAvailable(): boolean;
  getAuthStatus(): Promise<HomeKitAuthStatus>;
  requestAccess(): Promise<HomeKitAuthStatus>;
  getHomes(): Promise<readonly HomeRecord[]>;
  getAccessories(homeId: string): Promise<readonly AccessoryRecord[]>;
  readCharacteristic(accessoryId: string, characteristicId: string): Promise<CharacteristicValue>;
  writeCharacteristic(
    accessoryId: string,
    characteristicId: string,
    value: CharacteristicValue,
  ): Promise<void>;
  observeCharacteristic(
    accessoryId: string,
    characteristicId: string,
    listener: (value: CharacteristicValue) => void,
  ): () => void;
}

/**
 * Typed error thrown by the Android / Web variants and by the iOS
 * variant when the native module is missing.
 */
export class HomeKitNotSupported extends Error {
  public readonly code = 'HOMEKIT_NOT_SUPPORTED' as const;

  constructor(message = 'HomeKit is not available on this platform') {
    super(message);
    this.name = 'HomeKitNotSupported';
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, HomeKitNotSupported);
    }
  }
}
