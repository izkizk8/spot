/**
 * useSiriKit Hook
 * Feature: 071-sirikit
 *
 * State machine for the SiriKit lab. The native bridge is replaceable
 * at the import boundary via __setSiriKitBridgeForTests for unit tests.
 */

import { useCallback, useState } from 'react';

import sirikitDefault from '@/native/sirikit';
import type {
  IntentDomain,
  IntentItem,
  SiriKitBridge,
  SiriKitInfo,
  VocabularyEntry,
} from '@/native/sirikit.types';

let mockBridge: SiriKitBridge | null = null;

export function __setSiriKitBridgeForTests(bridge: SiriKitBridge | null) {
  mockBridge = bridge;
}

function getBridge(): SiriKitBridge {
  if (mockBridge) return mockBridge;
  return sirikitDefault;
}

export interface SiriKitState {
  info: SiriKitInfo | null;
  intents: readonly IntentItem[];
  vocabulary: readonly VocabularyEntry[];
  loading: boolean;
  lastError: Error | null;
}

export interface SiriKitActions {
  refresh(): Promise<void>;
  simulateIntent(domain: IntentDomain, utterance: string): Promise<IntentItem | null>;
  handleIntent(id: string): Promise<IntentItem | null>;
}

export function useSiriKit(): SiriKitState & SiriKitActions {
  const [info, setInfo] = useState<SiriKitInfo | null>(null);
  const [intents, setIntents] = useState<readonly IntentItem[]>([]);
  const [vocabulary, setVocabulary] = useState<readonly VocabularyEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastError, setLastError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setLastError(null);
    try {
      const bridge = getBridge();
      const [infoResult, intentsResult, vocabResult] = await Promise.all([
        bridge.getSiriKitInfo(),
        bridge.getIntents(),
        bridge.getVocabulary(),
      ]);
      setInfo(infoResult);
      setIntents(intentsResult);
      setVocabulary(vocabResult);
    } catch (err) {
      setLastError(err as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  const simulateIntent = useCallback(
    async (domain: IntentDomain, utterance: string): Promise<IntentItem | null> => {
      setLastError(null);
      try {
        const bridge = getBridge();
        const item = await bridge.simulateIntent(domain, utterance);
        setIntents((prev) => [item, ...prev]);
        return item;
      } catch (err) {
        setLastError(err as Error);
        return null;
      }
    },
    [],
  );

  const handleIntent = useCallback(async (id: string): Promise<IntentItem | null> => {
    setLastError(null);
    try {
      const bridge = getBridge();
      const updated = await bridge.handleIntent(id);
      setIntents((prev) => prev.map((i) => (i.id === id ? updated : i)));
      return updated;
    } catch (err) {
      setLastError(err as Error);
      return null;
    }
  }, []);

  return {
    info,
    intents,
    vocabulary,
    loading,
    lastError,
    refresh,
    simulateIntent,
    handleIntent,
  };
}
