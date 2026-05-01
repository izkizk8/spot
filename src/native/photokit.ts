/**
 * PhotoKit Bridge — iOS variant (feature 057).
 *
 * Single seam where the `PhotoKit` Expo Module is touched. Resolved
 * via `requireOptionalNativeModule` so the surface is null-safe in
 * unit tests where the module is absent.
 */

import { Platform } from 'react-native';
import { requireOptionalNativeModule } from 'expo-modules-core';

import {
  NATIVE_MODULE_NAME,
  PhotoKitNotSupported,
  type AuthorizationStatus,
  type PhotoAsset,
  type PhotoKitBridge,
  type PickerConfig,
} from './photokit.types';

export { PhotoKitNotSupported };

interface NativePhotoKit {
  requestAuthorization(): Promise<AuthorizationStatus>;
  getAuthorizationStatus(): Promise<AuthorizationStatus>;
  presentPicker(config?: PickerConfig): Promise<readonly PhotoAsset[]>;
}

function getNative(): NativePhotoKit | null {
  return requireOptionalNativeModule<NativePhotoKit>(NATIVE_MODULE_NAME);
}

function ensureNative(): NativePhotoKit {
  if (Platform.OS !== 'ios') {
    throw new PhotoKitNotSupported(`PhotoKit is not available on ${Platform.OS}`);
  }
  const native = getNative();
  if (!native) {
    throw new PhotoKitNotSupported('PhotoKit native module is not registered');
  }
  return native;
}

export function requestAuthorization(): Promise<AuthorizationStatus> {
  try {
    return ensureNative().requestAuthorization();
  } catch (err) {
    return Promise.reject(err);
  }
}

export function getAuthorizationStatus(): Promise<AuthorizationStatus> {
  try {
    return ensureNative().getAuthorizationStatus();
  } catch (err) {
    return Promise.reject(err);
  }
}

export function presentPicker(config?: PickerConfig): Promise<readonly PhotoAsset[]> {
  try {
    return ensureNative().presentPicker(config);
  } catch (err) {
    return Promise.reject(err);
  }
}

export const photokit: PhotoKitBridge = {
  requestAuthorization,
  getAuthorizationStatus,
  presentPicker,
};

export default photokit;
