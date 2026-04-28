/**
 * Speech-recognition JS bridge — iOS implementation.
 *
 * Uses `requireOptionalNativeModule('SpeechRecognition')`. When the native
 * module is registered, all methods delegate to it. When absent (e.g.
 * iOS < 10 or the module hasn't been autolinked), every async method
 * rejects with `SpeechRecognitionNotSupported` and the synchronous
 * `isAvailable` / `availableLocales` return `false` / `[]`.
 *
 * @see specs/018-speech-recognition/contracts/speech-bridge.contract.ts
 */

import { Platform } from 'react-native';
import { EventEmitter, requireOptionalNativeModule } from 'expo-modules-core';

import type {
  AuthStatus,
  Locale,
  SpeechBridge,
  SpeechBridgeEventEmitter,
} from './speech-recognition.types';
import { SpeechRecognitionNotSupported } from './speech-recognition.types';

interface NativeSpeechRecognition {
  isAvailable(locale: Locale): boolean;
  availableLocales(): Locale[];
  requestAuthorization(): Promise<AuthStatus>;
  getAuthorizationStatus(): Promise<AuthStatus>;
  start(args: { locale: Locale; onDevice: boolean }): Promise<void>;
  stop(): Promise<void>;
  addListener?: (eventName: string) => void;
  removeListeners?: (count: number) => void;
}

const nativeModule = requireOptionalNativeModule<NativeSpeechRecognition>('SpeechRecognition');

function emptyEmitter(): SpeechBridgeEventEmitter {
  return {
    addListener: () => ({ remove: () => {} }),
    removeAllListeners: () => {},
  };
}

const events: SpeechBridgeEventEmitter = nativeModule
  ? (new EventEmitter(
      nativeModule as unknown as ConstructorParameters<typeof EventEmitter>[0],
    ) as unknown as SpeechBridgeEventEmitter)
  : emptyEmitter();

function isAvailable(locale: Locale): boolean {
  if (Platform.OS !== 'ios' || nativeModule == null) return false;
  // When the native module is present and exposes its own per-locale check,
  // delegate so JS reflects the recognizer's true support set.
  if (typeof nativeModule.isAvailable === 'function') {
    try {
      return nativeModule.isAvailable(locale) !== false;
    } catch {
      return true;
    }
  }
  return true;
}

function availableLocales(): Locale[] {
  if (nativeModule == null) return [];
  try {
    return nativeModule.availableLocales();
  } catch {
    return [];
  }
}

async function requestAuthorization(): Promise<AuthStatus> {
  if (nativeModule == null) throw new SpeechRecognitionNotSupported();
  return nativeModule.requestAuthorization();
}

async function getAuthorizationStatus(): Promise<AuthStatus> {
  if (nativeModule == null) throw new SpeechRecognitionNotSupported();
  return nativeModule.getAuthorizationStatus();
}

async function start(args: { locale: Locale; onDevice: boolean }): Promise<void> {
  if (nativeModule == null) throw new SpeechRecognitionNotSupported();
  return nativeModule.start(args);
}

async function stop(): Promise<void> {
  if (nativeModule == null) throw new SpeechRecognitionNotSupported();
  return nativeModule.stop();
}

const bridge: SpeechBridge = {
  isAvailable,
  availableLocales,
  requestAuthorization,
  getAuthorizationStatus,
  start,
  stop,
  events,
};

export default bridge;
