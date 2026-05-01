/**
 * SiriKit Bridge — iOS variant (feature 071).
 *
 * Single seam where the SiriKit Expo Module is touched. Resolved
 * via requireOptionalNativeModule so the surface is null-safe in
 * unit tests where the module is absent.
 */

import { requireOptionalNativeModule } from 'expo-modules-core';
import { Platform } from 'react-native';

import {
  NATIVE_MODULE_NAME,
  SiriKitNotSupported,
  type IntentDomain,
  type IntentItem,
  type SiriKitBridge,
  type SiriKitInfo,
  type VocabularyEntry,
} from './sirikit.types';

export { SiriKitNotSupported };

interface NativeSiriKit {
  getSiriKitInfo(): Promise<SiriKitInfo>;
  getIntents(): Promise<readonly IntentItem[]>;
  simulateIntent(domain: IntentDomain, utterance: string): Promise<IntentItem>;
  handleIntent(id: string): Promise<IntentItem>;
  getVocabulary(): Promise<readonly VocabularyEntry[]>;
}

function getNative(): NativeSiriKit | null {
  return requireOptionalNativeModule<NativeSiriKit>(NATIVE_MODULE_NAME);
}

function ensureNative(): NativeSiriKit {
  if (Platform.OS !== 'ios') {
    throw new SiriKitNotSupported(`SiriKit is not available on ${Platform.OS}`);
  }
  const native = getNative();
  if (!native) {
    throw new SiriKitNotSupported('SiriKit native module is not registered');
  }
  return native;
}

export function getSiriKitInfo(): Promise<SiriKitInfo> {
  try {
    return ensureNative().getSiriKitInfo();
  } catch (err) {
    return Promise.reject(err);
  }
}

export function getIntents(): Promise<readonly IntentItem[]> {
  try {
    return ensureNative().getIntents();
  } catch (err) {
    return Promise.reject(err);
  }
}

export function simulateIntent(domain: IntentDomain, utterance: string): Promise<IntentItem> {
  try {
    return ensureNative().simulateIntent(domain, utterance);
  } catch (err) {
    return Promise.reject(err);
  }
}

export function handleIntent(id: string): Promise<IntentItem> {
  try {
    return ensureNative().handleIntent(id);
  } catch (err) {
    return Promise.reject(err);
  }
}

export function getVocabulary(): Promise<readonly VocabularyEntry[]> {
  try {
    return ensureNative().getVocabulary();
  } catch (err) {
    return Promise.reject(err);
  }
}

export const sirikit: SiriKitBridge = {
  getSiriKitInfo,
  getIntents,
  simulateIntent,
  handleIntent,
  getVocabulary,
};

export default sirikit;
