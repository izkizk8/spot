/**
 * useShortcutsSnippets Hook Test
 * Feature: 072-shortcuts-snippets
 *
 * Exercises refresh, donateShortcut, simulateSnippet, addVoiceShortcut, and error paths.
 */

import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { act, renderHook } from '@testing-library/react-native';

import {
  __setShortcutsSnippetsBridgeForTests,
  useShortcutsSnippets,
} from '@/modules/shortcuts-snippets-lab/hooks/useShortcutsSnippets';
import type {
  ShortcutItem,
  ShortcutsInfo,
  ShortcutsSnippetsBridge,
  SnippetPreviewData,
  SnippetType,
} from '@/native/shortcuts-snippets.types';

const sampleShortcut = (id: string): ShortcutItem => ({
  id,
  phrase: `Do action ${id}`,
  intentType: 'OrderCoffeeIntent',
  status: 'pending',
  snippetType: null,
  createdAt: 1,
});

const sampleSnippet = (type: SnippetType): SnippetPreviewData => ({
  type,
  title: type === 'confirmation' ? 'Confirm Order' : 'Order Placed',
  detail: type === 'confirmation' ? 'Order one coffee?' : 'Your order is on the way.',
  parameters: { item: 'Latte', size: 'Large' },
});

describe('useShortcutsSnippets', () => {
  let bridge: ShortcutsSnippetsBridge;

  const defaultInfo: ShortcutsInfo = {
    available: true,
    supportedSnippetTypes: ['confirmation', 'result'],
    donatedCount: 0,
  };

  beforeEach(() => {
    bridge = {
      getInfo: jest.fn(async (): Promise<ShortcutsInfo> => defaultInfo),
      getShortcuts: jest.fn(
        async (): Promise<readonly ShortcutItem[]> => [sampleShortcut('a'), sampleShortcut('b')],
      ),
      donateShortcut: jest.fn(
        async (phrase: string, intentType: string): Promise<ShortcutItem> => ({
          id: 'new',
          phrase,
          intentType,
          status: 'pending',
          snippetType: null,
          createdAt: Date.now(),
        }),
      ),
      simulateSnippet: jest.fn(
        async (_shortcutId: string, type: SnippetType): Promise<SnippetPreviewData> =>
          sampleSnippet(type),
      ),
      addVoiceShortcut: jest.fn(
        async (id: string): Promise<ShortcutItem> => ({
          ...sampleShortcut(id),
          status: 'active',
          snippetType: 'result',
        }),
      ),
    };
    __setShortcutsSnippetsBridgeForTests(bridge);
  });

  afterEach(() => {
    __setShortcutsSnippetsBridgeForTests(null);
  });

  it('initial state is empty / idle', () => {
    const { result } = renderHook(() => useShortcutsSnippets());
    expect(result.current.info).toBeNull();
    expect(result.current.shortcuts).toEqual([]);
    expect(result.current.activeSnippet).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.lastError).toBeNull();
  });

  it('refresh populates info and shortcuts', async () => {
    const { result } = renderHook(() => useShortcutsSnippets());
    await act(async () => {
      await result.current.refresh();
    });
    expect(bridge.getInfo).toHaveBeenCalledTimes(1);
    expect(bridge.getShortcuts).toHaveBeenCalledTimes(1);
    expect(result.current.info?.available).toBe(true);
    expect(result.current.shortcuts).toHaveLength(2);
  });

  it('refresh records error and resets loading', async () => {
    bridge.getInfo = jest.fn(async () => {
      throw new Error('refresh-failed');
    });
    __setShortcutsSnippetsBridgeForTests(bridge);
    const { result } = renderHook(() => useShortcutsSnippets());
    await act(async () => {
      await result.current.refresh();
    });
    expect(result.current.lastError?.message).toBe('refresh-failed');
    expect(result.current.loading).toBe(false);
  });

  it('donateShortcut prepends the new shortcut', async () => {
    const { result } = renderHook(() => useShortcutsSnippets());
    await act(async () => {
      await result.current.refresh();
    });
    await act(async () => {
      await result.current.donateShortcut('Order coffee', 'OrderCoffeeIntent');
    });
    expect(result.current.shortcuts[0]?.id).toBe('new');
    expect(result.current.shortcuts).toHaveLength(3);
  });

  it('donateShortcut error path returns null and records error', async () => {
    bridge.donateShortcut = jest.fn(async () => {
      throw new Error('donate-failed');
    });
    __setShortcutsSnippetsBridgeForTests(bridge);
    const { result } = renderHook(() => useShortcutsSnippets());
    let returned: ShortcutItem | null = sampleShortcut('placeholder');
    await act(async () => {
      returned = await result.current.donateShortcut('test', 'TestIntent');
    });
    expect(returned).toBeNull();
    expect(result.current.lastError?.message).toBe('donate-failed');
  });

  it('simulateSnippet sets activeSnippet (confirmation)', async () => {
    const { result } = renderHook(() => useShortcutsSnippets());
    await act(async () => {
      await result.current.refresh();
    });
    await act(async () => {
      await result.current.simulateSnippet('a', 'confirmation');
    });
    expect(result.current.activeSnippet?.type).toBe('confirmation');
    expect(result.current.activeSnippet?.title).toBe('Confirm Order');
  });

  it('simulateSnippet sets activeSnippet (result)', async () => {
    const { result } = renderHook(() => useShortcutsSnippets());
    await act(async () => {
      await result.current.refresh();
    });
    await act(async () => {
      await result.current.simulateSnippet('a', 'result');
    });
    expect(result.current.activeSnippet?.type).toBe('result');
  });

  it('simulateSnippet error path returns null and records error', async () => {
    bridge.simulateSnippet = jest.fn(async () => {
      throw new Error('simulate-failed');
    });
    __setShortcutsSnippetsBridgeForTests(bridge);
    const { result } = renderHook(() => useShortcutsSnippets());
    let returned: SnippetPreviewData | null = sampleSnippet('confirmation');
    await act(async () => {
      returned = await result.current.simulateSnippet('a', 'confirmation');
    });
    expect(returned).toBeNull();
    expect(result.current.lastError?.message).toBe('simulate-failed');
  });

  it('addVoiceShortcut updates the shortcut in place', async () => {
    const { result } = renderHook(() => useShortcutsSnippets());
    await act(async () => {
      await result.current.refresh();
    });
    await act(async () => {
      await result.current.addVoiceShortcut('a');
    });
    const updated = result.current.shortcuts.find((s) => s.id === 'a');
    expect(updated?.status).toBe('active');
    expect(updated?.snippetType).toBe('result');
  });

  it('addVoiceShortcut error path returns null and records error', async () => {
    bridge.addVoiceShortcut = jest.fn(async () => {
      throw new Error('add-failed');
    });
    __setShortcutsSnippetsBridgeForTests(bridge);
    const { result } = renderHook(() => useShortcutsSnippets());
    await act(async () => {
      await result.current.refresh();
    });
    let returned: ShortcutItem | null = sampleShortcut('placeholder');
    await act(async () => {
      returned = await result.current.addVoiceShortcut('a');
    });
    expect(returned).toBeNull();
    expect(result.current.lastError?.message).toBe('add-failed');
  });
});
