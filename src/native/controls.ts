/**
 * Controls Bridge — iOS variant (feature 087).
 *
 * Single seam where the SpotControls Expo Module is touched. Resolved
 * via requireOptionalNativeModule so the surface is null-safe in
 * unit tests where the module is absent.
 */
import { requireOptionalNativeModule } from 'expo-modules-core';
import { Platform } from 'react-native';

import {
  NATIVE_MODULE_NAME,
  ControlsNotSupported,
  type ControlActionResult,
  type ControlInfo,
  type ControlsBridge,
  type ControlsCapabilities,
} from './controls.types';

export { ControlsNotSupported };

interface NativeControls {
  getCapabilities(): Promise<ControlsCapabilities>;
  getRegisteredControls(): Promise<readonly ControlInfo[]>;
  triggerControl(controlId: string): Promise<ControlActionResult>;
}

function getNative(): NativeControls | null {
  return requireOptionalNativeModule<NativeControls>(NATIVE_MODULE_NAME);
}

function ensureNative(): NativeControls {
  if (Platform.OS !== 'ios') {
    throw new ControlsNotSupported(`Controls are not available on ${Platform.OS}`);
  }
  const native = getNative();
  if (!native) {
    throw new ControlsNotSupported('SpotControls native module is not registered');
  }
  return native;
}

export function getCapabilities(): Promise<ControlsCapabilities> {
  try {
    return ensureNative().getCapabilities();
  } catch (err) {
    return Promise.reject(err);
  }
}

export function getRegisteredControls(): Promise<readonly ControlInfo[]> {
  try {
    return ensureNative().getRegisteredControls();
  } catch (err) {
    return Promise.reject(err);
  }
}

export function triggerControl(controlId: string): Promise<ControlActionResult> {
  try {
    return ensureNative().triggerControl(controlId);
  } catch (err) {
    return Promise.reject(err);
  }
}

export const controls: ControlsBridge = {
  getCapabilities,
  getRegisteredControls,
  triggerControl,
};

export default controls;
