/**
 * HomeKit Bridge — Web variant (feature 044). All async methods
 * reject with `HomeKitNotSupported`; `isAvailable()` returns false.
 * MUST NOT import the iOS bridge file.
 */

import {
  type AccessoryRecord,
  type CharacteristicValue,
  type HomeKitAuthStatus,
  type HomeRecord,
  HomeKitNotSupported,
} from './homekit.types';

export { HomeKitNotSupported };

const ERR = new HomeKitNotSupported('HomeKit is not available on Web');

export function isAvailable(): boolean {
  return false;
}

export function getAuthStatus(): Promise<HomeKitAuthStatus> {
  return Promise.reject(ERR);
}

export function requestAccess(): Promise<HomeKitAuthStatus> {
  return Promise.reject(ERR);
}

export function getHomes(): Promise<readonly HomeRecord[]> {
  return Promise.reject(ERR);
}

export function getAccessories(_homeId: string): Promise<readonly AccessoryRecord[]> {
  return Promise.reject(ERR);
}

export function readCharacteristic(
  _accessoryId: string,
  _characteristicId: string,
): Promise<CharacteristicValue> {
  return Promise.reject(ERR);
}

export function writeCharacteristic(
  _accessoryId: string,
  _characteristicId: string,
  _value: CharacteristicValue,
): Promise<void> {
  return Promise.reject(ERR);
}

export function observeCharacteristic(
  _accessoryId: string,
  _characteristicId: string,
  _listener: (value: CharacteristicValue) => void,
): () => void {
  return () => {};
}

export const homekit = {
  isAvailable,
  getAuthStatus,
  requestAccess,
  getHomes,
  getAccessories,
  readCharacteristic,
  writeCharacteristic,
  observeCharacteristic,
};

export default homekit;
