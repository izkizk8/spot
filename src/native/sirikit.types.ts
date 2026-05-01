/**
 * SiriKit Bridge Types
 * Feature: 071-sirikit
 *
 * Type definitions for the SiriKit Custom Intents bridge.
 * SiriKit INIntent / INExtension — iOS 10+ only.
 */

export const NATIVE_MODULE_NAME = 'SiriKit' as const;

export type IntentStatus = 'pending' | 'handling' | 'success' | 'failure';

export type IntentDomain = 'messaging' | 'noteTaking' | 'reminder' | 'workout' | 'payment';

export interface IntentItem {
  id: string;
  domain: IntentDomain;
  utterance: string;
  status: IntentStatus;
  response: string | null;
  createdAt: number;
}

export interface VocabularyEntry {
  term: string;
  pronunciation: string | null;
  scope: 'user' | 'app';
}

export interface SiriKitInfo {
  available: boolean;
  extensionBundleId: string;
  supportedDomains: readonly IntentDomain[];
  vocabularyCount: number;
}

export interface SiriKitBridge {
  getSiriKitInfo(): Promise<SiriKitInfo>;
  getIntents(): Promise<readonly IntentItem[]>;
  simulateIntent(domain: IntentDomain, utterance: string): Promise<IntentItem>;
  handleIntent(id: string): Promise<IntentItem>;
  getVocabulary(): Promise<readonly VocabularyEntry[]>;
}

export class SiriKitNotSupported extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SiriKitNotSupported';
  }
}
