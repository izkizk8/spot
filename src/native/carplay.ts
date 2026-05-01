/**
 * CarPlay bridge — iOS variant (feature 045).
 *
 * Single seam where the `CarPlayBridge` Expo Module is touched. On
 * Android / Web the platform-specific siblings throw
 * `CarPlayNotSupported` for every method.
 *
 * Because shipping an entitled CarPlay scene requires Apple approval
 * for one of six narrow categories, the iOS variant **also** throws
 * `CarPlayNotEntitled` whenever the native module is missing or
 * reports `not-entitled`. The lab UI consumes the error to explain
 * the restriction.
 */

import { Platform } from 'react-native';
import { requireOptionalNativeModule } from 'expo-modules-core';

import {
  type CarPlayBridge,
  type CarPlayStatus,
  type CarPlayTemplateKind,
  CarPlayNotEntitled,
  CarPlayNotSupported,
  NATIVE_MODULE_NAME,
} from './carplay.types';

export { CarPlayNotEntitled, CarPlayNotSupported };

interface NativeCarPlayBridge {
  isAvailable(): boolean;
  getStatus(): Promise<CarPlayStatus>;
  presentTemplate(kind: CarPlayTemplateKind): Promise<void>;
}

function getNative(): NativeCarPlayBridge | null {
  return requireOptionalNativeModule<NativeCarPlayBridge>(NATIVE_MODULE_NAME);
}

function ensureNative(): NativeCarPlayBridge {
  if (Platform.OS !== 'ios') {
    throw new CarPlayNotSupported(`CarPlay is not available on ${Platform.OS}`);
  }
  const native = getNative();
  if (!native) {
    throw new CarPlayNotEntitled('CarPlay native module is not registered');
  }
  return native;
}

export function isAvailable(): boolean {
  if (Platform.OS !== 'ios') return false;
  const native = getNative();
  return native !== null && native.isAvailable();
}

export function getStatus(): Promise<CarPlayStatus> {
  if (Platform.OS !== 'ios') {
    return Promise.resolve('unsupported');
  }
  const native = getNative();
  if (!native) {
    return Promise.resolve('not-entitled');
  }
  return native.getStatus();
}

export function presentTemplate(kind: CarPlayTemplateKind): Promise<void> {
  try {
    return ensureNative().presentTemplate(kind);
  } catch (err) {
    return Promise.reject(err);
  }
}

export const carplay: CarPlayBridge = {
  isAvailable,
  getStatus,
  presentTemplate,
};

export default carplay;
