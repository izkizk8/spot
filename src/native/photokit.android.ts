/**
 * PhotoKit Bridge — Android stub (feature 057).
 *
 * PHPickerViewController is iOS-only. All methods reject with
 * `PhotoKitNotSupported`. MUST NOT import the iOS variant.
 */

import {
  PhotoKitNotSupported,
  type AuthorizationStatus,
  type PhotoAsset,
  type PhotoKitBridge,
  type PickerConfig,
} from './photokit.types';

export { PhotoKitNotSupported };

const ERR = (): PhotoKitNotSupported =>
  new PhotoKitNotSupported('PhotoKit is not available on Android');

export function requestAuthorization(): Promise<AuthorizationStatus> {
  return Promise.reject(ERR());
}

export function getAuthorizationStatus(): Promise<AuthorizationStatus> {
  return Promise.reject(ERR());
}

export function presentPicker(_config?: PickerConfig): Promise<readonly PhotoAsset[]> {
  return Promise.reject(ERR());
}

export const photokit: PhotoKitBridge = {
  requestAuthorization,
  getAuthorizationStatus,
  presentPicker,
};

export default photokit;
