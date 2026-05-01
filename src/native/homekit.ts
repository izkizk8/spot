/**
 * HomeKit Bridge — iOS variant (feature 044).
 *
 * Single seam where the `HomeKitBridge` Expo Module is touched. On
 * Android / Web the platform-specific siblings throw
 * `HomeKitNotSupported` for every method.
 *
 * The native module is resolved via `requireOptionalNativeModule` so
 * the surface is null-safe in unit tests where the module is absent.
 *
 * Mocking strategy in tests: jest.mock('expo-modules-core') with a
 * `requireOptionalNativeModule` factory that returns a fake bridge.
 */

import { Platform } from 'react-native';
import { requireOptionalNativeModule } from 'expo-modules-core';

import {
  type AccessoryRecord,
  type CharacteristicValue,
  type HomeKitAuthStatus,
  type HomeRecord,
  HomeKitNotSupported,
  NATIVE_MODULE_NAME,
} from './homekit.types';

export { HomeKitNotSupported };

interface NativeListenerSubscription {
  remove(): void;
}

interface NativeHomeKitBridge {
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
  addListener(
    event: 'onCharacteristicUpdate',
    listener: (payload: {
      accessoryId: string;
      characteristicId: string;
      value: CharacteristicValue;
    }) => void,
  ): NativeListenerSubscription;
  startObserving(accessoryId: string, characteristicId: string): Promise<void>;
  stopObserving(accessoryId: string, characteristicId: string): Promise<void>;
}

function getNative(): NativeHomeKitBridge | null {
  return requireOptionalNativeModule<NativeHomeKitBridge>(NATIVE_MODULE_NAME);
}

function ensureNative(): NativeHomeKitBridge {
  if (Platform.OS !== 'ios') {
    throw new HomeKitNotSupported(`HomeKit is not available on ${Platform.OS}`);
  }
  const native = getNative();
  if (!native) {
    throw new HomeKitNotSupported('HomeKit native module is not registered');
  }
  return native;
}

export function isAvailable(): boolean {
  if (Platform.OS !== 'ios') return false;
  const native = getNative();
  return native !== null && native.isAvailable();
}

export function getAuthStatus(): Promise<HomeKitAuthStatus> {
  try {
    return ensureNative().getAuthStatus();
  } catch (err) {
    return Promise.reject(err);
  }
}

export function requestAccess(): Promise<HomeKitAuthStatus> {
  try {
    return ensureNative().requestAccess();
  } catch (err) {
    return Promise.reject(err);
  }
}

export function getHomes(): Promise<readonly HomeRecord[]> {
  try {
    return ensureNative().getHomes();
  } catch (err) {
    return Promise.reject(err);
  }
}

export function getAccessories(homeId: string): Promise<readonly AccessoryRecord[]> {
  try {
    return ensureNative().getAccessories(homeId);
  } catch (err) {
    return Promise.reject(err);
  }
}

export function readCharacteristic(
  accessoryId: string,
  characteristicId: string,
): Promise<CharacteristicValue> {
  try {
    return ensureNative().readCharacteristic(accessoryId, characteristicId);
  } catch (err) {
    return Promise.reject(err);
  }
}

export function writeCharacteristic(
  accessoryId: string,
  characteristicId: string,
  value: CharacteristicValue,
): Promise<void> {
  try {
    return ensureNative().writeCharacteristic(accessoryId, characteristicId, value);
  } catch (err) {
    return Promise.reject(err);
  }
}

/**
 * Subscribe to characteristic updates. Returns an unsubscribe
 * function that detaches the listener AND asks the bridge to stop
 * observing on the native side. Listener errors are swallowed so a
 * misbehaving handler cannot bring the bridge down.
 */
export function observeCharacteristic(
  accessoryId: string,
  characteristicId: string,
  listener: (value: CharacteristicValue) => void,
): () => void {
  let native: NativeHomeKitBridge;
  try {
    native = ensureNative();
  } catch {
    // Match the documented behaviour: return a no-op unsubscribe.
    return () => {};
  }

  const subscription = native.addListener('onCharacteristicUpdate', (payload) => {
    if (payload.accessoryId !== accessoryId || payload.characteristicId !== characteristicId) {
      return;
    }
    try {
      listener(payload.value);
    } catch {
      // Listener errors are swallowed.
    }
  });

  void native.startObserving(accessoryId, characteristicId).catch(() => {
    // Best-effort: if the native side cannot start, the listener
    // simply never fires.
  });

  let removed = false;
  return () => {
    if (removed) return;
    removed = true;
    subscription.remove();
    void native.stopObserving(accessoryId, characteristicId).catch(() => {});
  };
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
