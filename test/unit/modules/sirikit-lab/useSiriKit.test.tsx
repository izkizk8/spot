/**
 * useSiriKit Hook Test
 * Feature: 071-sirikit
 *
 * Exercises refresh, simulateIntent, handleIntent, and error paths.
 */

import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { act, renderHook } from '@testing-library/react-native';

import { __setSiriKitBridgeForTests, useSiriKit } from '@/modules/sirikit-lab/hooks/useSiriKit';
import type {
  IntentDomain,
  IntentItem,
  SiriKitBridge,
  SiriKitInfo,
  VocabularyEntry,
} from '@/native/sirikit.types';

const sample = (id: string, domain: IntentDomain = 'messaging'): IntentItem => ({
  id,
  domain,
  utterance: `say something ${id}`,
  status: 'pending',
  response: null,
  createdAt: 1,
});

const sampleVocab = (term: string): VocabularyEntry => ({
  term,
  pronunciation: null,
  scope: 'user',
});

describe('useSiriKit', () => {
  let bridge: SiriKitBridge;

  const defaultInfo: SiriKitInfo = {
    available: true,
    extensionBundleId: 'com.spot.SiriKitExtension',
    supportedDomains: ['messaging', 'noteTaking'],
    vocabularyCount: 2,
  };

  beforeEach(() => {
    bridge = {
      getSiriKitInfo: jest.fn(async (): Promise<SiriKitInfo> => defaultInfo),
      getIntents: jest.fn(
        async (): Promise<readonly IntentItem[]> => [sample('a'), sample('b', 'noteTaking')],
      ),
      simulateIntent: jest.fn(
        async (domain: IntentDomain, utterance: string): Promise<IntentItem> => ({
          id: 'new',
          domain,
          utterance,
          status: 'pending',
          response: null,
          createdAt: Date.now(),
        }),
      ),
      handleIntent: jest.fn(
        async (id: string): Promise<IntentItem> => ({
          ...sample(id),
          status: 'success',
          response: 'Intent handled successfully',
        }),
      ),
      getVocabulary: jest.fn(
        async (): Promise<readonly VocabularyEntry[]> => [sampleVocab('spot'), sampleVocab('lab')],
      ),
    };
    __setSiriKitBridgeForTests(bridge);
  });

  afterEach(() => {
    __setSiriKitBridgeForTests(null);
  });

  it('initial state is empty / idle', () => {
    const { result } = renderHook(() => useSiriKit());
    expect(result.current.info).toBeNull();
    expect(result.current.intents).toEqual([]);
    expect(result.current.vocabulary).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.lastError).toBeNull();
  });

  it('refresh populates info, intents, and vocabulary', async () => {
    const { result } = renderHook(() => useSiriKit());
    await act(async () => {
      await result.current.refresh();
    });
    expect(bridge.getSiriKitInfo).toHaveBeenCalledTimes(1);
    expect(bridge.getIntents).toHaveBeenCalledTimes(1);
    expect(bridge.getVocabulary).toHaveBeenCalledTimes(1);
    expect(result.current.info?.available).toBe(true);
    expect(result.current.intents).toHaveLength(2);
    expect(result.current.vocabulary).toHaveLength(2);
  });

  it('refresh records error and resets loading', async () => {
    bridge.getSiriKitInfo = jest.fn(async () => {
      throw new Error('refresh-failed');
    });
    __setSiriKitBridgeForTests(bridge);
    const { result } = renderHook(() => useSiriKit());
    await act(async () => {
      await result.current.refresh();
    });
    expect(result.current.lastError?.message).toBe('refresh-failed');
    expect(result.current.loading).toBe(false);
  });

  it('simulateIntent prepends the new intent', async () => {
    const { result } = renderHook(() => useSiriKit());
    await act(async () => {
      await result.current.refresh();
    });
    await act(async () => {
      await result.current.simulateIntent('messaging', 'Send message');
    });
    expect(result.current.intents[0]?.id).toBe('new');
    expect(result.current.intents).toHaveLength(3);
  });

  it('simulateIntent error path returns null and records error', async () => {
    bridge.simulateIntent = jest.fn(async () => {
      throw new Error('simulate-failed');
    });
    __setSiriKitBridgeForTests(bridge);
    const { result } = renderHook(() => useSiriKit());
    let returned: IntentItem | null = sample('placeholder');
    await act(async () => {
      returned = await result.current.simulateIntent('messaging', 'test');
    });
    expect(returned).toBeNull();
    expect(result.current.lastError?.message).toBe('simulate-failed');
  });

  it('handleIntent updates the intent in place', async () => {
    const { result } = renderHook(() => useSiriKit());
    await act(async () => {
      await result.current.refresh();
    });
    await act(async () => {
      await result.current.handleIntent('a');
    });
    const updated = result.current.intents.find((i) => i.id === 'a');
    expect(updated?.status).toBe('success');
    expect(updated?.response).toBe('Intent handled successfully');
  });

  it('handleIntent error path returns null and records error', async () => {
    bridge.handleIntent = jest.fn(async () => {
      throw new Error('handle-failed');
    });
    __setSiriKitBridgeForTests(bridge);
    const { result } = renderHook(() => useSiriKit());
    await act(async () => {
      await result.current.refresh();
    });
    let returned: IntentItem | null = sample('placeholder');
    await act(async () => {
      returned = await result.current.handleIntent('a');
    });
    expect(returned).toBeNull();
    expect(result.current.lastError?.message).toBe('handle-failed');
  });
});
