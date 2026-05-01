/**
 * Live Text Bridge — iOS variant (feature 080).
 *
 * Single seam where the LiveText Expo Module is touched. Resolved
 * via requireOptionalNativeModule so the surface is null-safe in
 * unit tests where the module is absent.
 */

import { requireOptionalNativeModule } from 'expo-modules-core';
import { Platform } from 'react-native';

import {
  NATIVE_MODULE_NAME,
  LiveTextNotSupported,
  type LiveTextBridge,
  type LiveTextCapabilities,
  type OCRResult,
  type RecognitionLanguage,
  type ScannerConfig,
  type ScanSession,
} from './live-text.types';

export { LiveTextNotSupported };

interface NativeLiveText {
  getCapabilities(): Promise<LiveTextCapabilities>;
  recognizeText(base64Image: string, language?: RecognitionLanguage): Promise<OCRResult>;
  startScanner(config: ScannerConfig): Promise<ScanSession>;
  stopScanner(sessionId: string): Promise<void>;
}

function getNative(): NativeLiveText | null {
  return requireOptionalNativeModule<NativeLiveText>(NATIVE_MODULE_NAME);
}

function ensureNative(): NativeLiveText {
  if (Platform.OS !== 'ios') {
    throw new LiveTextNotSupported(`Live Text is not available on ${Platform.OS}`);
  }
  const native = getNative();
  if (!native) {
    throw new LiveTextNotSupported('LiveText native module is not registered');
  }
  return native;
}

export function getCapabilities(): Promise<LiveTextCapabilities> {
  try {
    return ensureNative().getCapabilities();
  } catch (err) {
    return Promise.reject(err);
  }
}

export function recognizeText(
  base64Image: string,
  language?: RecognitionLanguage,
): Promise<OCRResult> {
  try {
    return ensureNative().recognizeText(base64Image, language);
  } catch (err) {
    return Promise.reject(err);
  }
}

export function startScanner(config: ScannerConfig): Promise<ScanSession> {
  try {
    return ensureNative().startScanner(config);
  } catch (err) {
    return Promise.reject(err);
  }
}

export function stopScanner(sessionId: string): Promise<void> {
  try {
    return ensureNative().stopScanner(sessionId);
  } catch (err) {
    return Promise.reject(err);
  }
}

export const liveText: LiveTextBridge = {
  getCapabilities,
  recognizeText,
  startScanner,
  stopScanner,
};

export default liveText;
