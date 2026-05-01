/**
 * Live Text Bridge — Android stub (feature 080).
 *
 * Live Text is iOS-only. All methods reject with LiveTextNotSupported.
 * MUST NOT import the iOS variant.
 */

import {
  LiveTextNotSupported,
  type LiveTextBridge,
  type LiveTextCapabilities,
  type OCRResult,
  type RecognitionLanguage,
  type ScannerConfig,
  type ScanSession,
} from './live-text.types';

export { LiveTextNotSupported };

const ERR = (): LiveTextNotSupported =>
  new LiveTextNotSupported('Live Text is not available on Android');

export function getCapabilities(): Promise<LiveTextCapabilities> {
  return Promise.reject(ERR());
}

export function recognizeText(
  _base64Image: string,
  _language?: RecognitionLanguage,
): Promise<OCRResult> {
  return Promise.reject(ERR());
}

export function startScanner(_config: ScannerConfig): Promise<ScanSession> {
  return Promise.reject(ERR());
}

export function stopScanner(_sessionId: string): Promise<void> {
  return Promise.reject(ERR());
}

export const liveText: LiveTextBridge = {
  getCapabilities,
  recognizeText,
  startScanner,
  stopScanner,
};

export default liveText;
