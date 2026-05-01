/**
 * RealityKit USDZ Bridge — iOS variant (feature 062).
 *
 * Single seam where the `RealityKitUsdz` Expo Module is touched.
 * Resolved via `requireOptionalNativeModule` so the surface is
 * null-safe in unit tests where the native module is absent.
 */
import { Platform } from 'react-native';
import { requireOptionalNativeModule } from 'expo-modules-core';

import {
  NATIVE_MODULE_NAME,
  RealityKitUsdzNotSupported,
  type ModelName,
  type RKCapabilities,
  type RealityKitUsdzBridge,
} from './realitykit-usdz.types';

export { RealityKitUsdzNotSupported };

interface NativeRealityKitUsdz {
  getCapabilities(): Promise<RKCapabilities>;
  previewModel(modelName: ModelName): Promise<void>;
}

function getNative(): NativeRealityKitUsdz | null {
  return requireOptionalNativeModule<NativeRealityKitUsdz>(NATIVE_MODULE_NAME);
}

function ensureNative(): NativeRealityKitUsdz {
  if (Platform.OS !== 'ios') {
    throw new RealityKitUsdzNotSupported(`RealityKit USDZ is not available on ${Platform.OS}`);
  }
  const native = getNative();
  if (!native) {
    throw new RealityKitUsdzNotSupported('RealityKitUsdz native module is not registered');
  }
  return native;
}

export function getCapabilities(): Promise<RKCapabilities> {
  try {
    return ensureNative().getCapabilities();
  } catch (err) {
    return Promise.reject(err);
  }
}

export function previewModel(modelName: ModelName): Promise<void> {
  try {
    return ensureNative().previewModel(modelName);
  } catch (err) {
    return Promise.reject(err);
  }
}

export const realityKitUsdz: RealityKitUsdzBridge = {
  getCapabilities,
  previewModel,
};

export default realityKitUsdz;
