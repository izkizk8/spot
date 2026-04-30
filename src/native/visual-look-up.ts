/**
 * Visual Look Up Bridge — iOS variant (feature 060).
 *
 * Single seam where the `VisualLookUp` Expo Module is touched.
 * Resolved via `requireOptionalNativeModule` so the surface is
 * null-safe in unit tests where the module is absent.
 */

import { Platform } from 'react-native';
import { requireOptionalNativeModule } from 'expo-modules-core';

import {
  NATIVE_MODULE_NAME,
  VisualLookUpNotSupported,
  type AnalysisResult,
  type VisualLookUpBridge,
} from './visual-look-up.types';

export { VisualLookUpNotSupported };

interface NativeVisualLookUp {
  isSupported(): Promise<boolean>;
  analyzeImage(imageUri: string): Promise<AnalysisResult>;
}

function getNative(): NativeVisualLookUp | null {
  return requireOptionalNativeModule<NativeVisualLookUp>(NATIVE_MODULE_NAME);
}

function ensureNative(): NativeVisualLookUp {
  if (Platform.OS !== 'ios') {
    throw new VisualLookUpNotSupported(`Visual Look Up is not available on ${Platform.OS}`);
  }
  const native = getNative();
  if (!native) {
    throw new VisualLookUpNotSupported('VisualLookUp native module is not registered');
  }
  return native;
}

export function isSupported(): Promise<boolean> {
  try {
    return ensureNative().isSupported();
  } catch (err) {
    return Promise.reject(err);
  }
}

export function analyzeImage(imageUri: string): Promise<AnalysisResult> {
  try {
    return ensureNative().analyzeImage(imageUri);
  } catch (err) {
    return Promise.reject(err);
  }
}

export const visualLookUp: VisualLookUpBridge = {
  isSupported,
  analyzeImage,
};

export default visualLookUp;
