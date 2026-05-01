/**
 * SiriKit Bridge — Android stub (feature 071).
 *
 * SiriKit is iOS-only. All methods reject with
 * `SiriKitNotSupported`. MUST NOT import the iOS variant.
 */

import {
  SiriKitNotSupported,
  type IntentDomain,
  type IntentItem,
  type SiriKitBridge,
  type SiriKitInfo,
  type VocabularyEntry,
} from './sirikit.types';

export { SiriKitNotSupported };

const ERR = (): SiriKitNotSupported =>
  new SiriKitNotSupported('SiriKit is not available on Android');

export function getSiriKitInfo(): Promise<SiriKitInfo> {
  return Promise.reject(ERR());
}

export function getIntents(): Promise<readonly IntentItem[]> {
  return Promise.reject(ERR());
}

export function simulateIntent(_domain: IntentDomain, _utterance: string): Promise<IntentItem> {
  return Promise.reject(ERR());
}

export function handleIntent(_id: string): Promise<IntentItem> {
  return Promise.reject(ERR());
}

export function getVocabulary(): Promise<readonly VocabularyEntry[]> {
  return Promise.reject(ERR());
}

export const sirikit: SiriKitBridge = {
  getSiriKitInfo,
  getIntents,
  simulateIntent,
  handleIntent,
  getVocabulary,
};

export default sirikit;
