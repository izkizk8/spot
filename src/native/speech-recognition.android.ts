/**
 * Speech-recognition JS bridge — Android stub.
 *
 * Android does not provide a system-level streaming speech recognizer
 * with parity to Apple's SFSpeechRecognizer (per FR-022 / R-008), so
 * every method short-circuits to `SpeechRecognitionNotSupported`.
 */

import type { Locale, SpeechBridge, SpeechBridgeEventEmitter } from './speech-recognition.types';
import { SpeechRecognitionNotSupported } from './speech-recognition.types';

const events: SpeechBridgeEventEmitter = {
  addListener: () => ({ remove: () => {} }),
  removeAllListeners: () => {},
};

const bridge: SpeechBridge = {
  isAvailable: (_locale: Locale) => false,
  availableLocales: () => [],
  requestAuthorization: () => Promise.reject(new SpeechRecognitionNotSupported()),
  getAuthorizationStatus: () => Promise.reject(new SpeechRecognitionNotSupported()),
  start: () => Promise.reject(new SpeechRecognitionNotSupported()),
  stop: () => Promise.reject(new SpeechRecognitionNotSupported()),
  events,
};

export default bridge;
