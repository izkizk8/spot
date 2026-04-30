/**
 * CoreImage Bridge — iOS variant (feature 064).
 *
 * Single seam where the `CoreImage` Expo Module is touched. Resolved
 * via `requireOptionalNativeModule` so the surface is null-safe in
 * unit tests where the module is absent.
 */
import { Platform } from 'react-native';
import { requireOptionalNativeModule } from 'expo-modules-core';

import {
  NATIVE_MODULE_NAME,
  CoreImageNotSupported,
  type CICapabilities,
  type CoreImageBridge,
  type FilterId,
  type FilterParams,
  type FilterResult,
} from './core-image.types';

export { CoreImageNotSupported };

interface NativeCoreImage {
  getCapabilities(): Promise<CICapabilities>;
  applyFilter(filterId: FilterId, params: FilterParams): Promise<FilterResult>;
}

function getNative(): NativeCoreImage | null {
  return requireOptionalNativeModule<NativeCoreImage>(NATIVE_MODULE_NAME);
}

function ensureNative(): NativeCoreImage {
  if (Platform.OS !== 'ios') {
    throw new CoreImageNotSupported(`CoreImage is not available on ${Platform.OS}`);
  }
  const native = getNative();
  if (!native) {
    throw new CoreImageNotSupported('CoreImage native module is not registered');
  }
  return native;
}

export function getCapabilities(): Promise<CICapabilities> {
  try {
    return ensureNative().getCapabilities();
  } catch (err) {
    return Promise.reject(err);
  }
}

export function applyFilter(filterId: FilterId, params: FilterParams): Promise<FilterResult> {
  try {
    return ensureNative().applyFilter(filterId, params);
  } catch (err) {
    return Promise.reject(err);
  }
}

export const coreImage: CoreImageBridge = {
  getCapabilities,
  applyFilter,
};

export default coreImage;
