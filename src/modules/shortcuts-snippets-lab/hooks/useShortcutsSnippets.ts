/**
 * useShortcutsSnippets Hook
 * Feature: 072-shortcuts-snippets
 *
 * State machine for the Shortcuts Snippets lab. The native bridge is
 * replaceable at the import boundary via __setShortcutsSnippetsBridgeForTests
 * for unit tests.
 */

import { useCallback, useState } from 'react';

import shortcutsSnippetsDefault from '@/native/shortcuts-snippets';
import type {
  ShortcutItem,
  ShortcutsInfo,
  ShortcutsSnippetsBridge,
  SnippetPreviewData,
  SnippetType,
} from '@/native/shortcuts-snippets.types';

let mockBridge: ShortcutsSnippetsBridge | null = null;

export function __setShortcutsSnippetsBridgeForTests(bridge: ShortcutsSnippetsBridge | null) {
  mockBridge = bridge;
}

function getBridge(): ShortcutsSnippetsBridge {
  if (mockBridge) return mockBridge;
  return shortcutsSnippetsDefault;
}

export interface ShortcutsSnippetsState {
  info: ShortcutsInfo | null;
  shortcuts: readonly ShortcutItem[];
  activeSnippet: SnippetPreviewData | null;
  loading: boolean;
  lastError: Error | null;
}

export interface ShortcutsSnippetsActions {
  refresh(): Promise<void>;
  donateShortcut(phrase: string, intentType: string): Promise<ShortcutItem | null>;
  simulateSnippet(shortcutId: string, type: SnippetType): Promise<SnippetPreviewData | null>;
  addVoiceShortcut(shortcutId: string): Promise<ShortcutItem | null>;
}

export function useShortcutsSnippets(): ShortcutsSnippetsState & ShortcutsSnippetsActions {
  const [info, setInfo] = useState<ShortcutsInfo | null>(null);
  const [shortcuts, setShortcuts] = useState<readonly ShortcutItem[]>([]);
  const [activeSnippet, setActiveSnippet] = useState<SnippetPreviewData | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastError, setLastError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setLastError(null);
    try {
      const bridge = getBridge();
      const [infoResult, shortcutsResult] = await Promise.all([
        bridge.getInfo(),
        bridge.getShortcuts(),
      ]);
      setInfo(infoResult);
      setShortcuts(shortcutsResult);
    } catch (err) {
      setLastError(err as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  const donateShortcut = useCallback(
    async (phrase: string, intentType: string): Promise<ShortcutItem | null> => {
      setLastError(null);
      try {
        const bridge = getBridge();
        const item = await bridge.donateShortcut(phrase, intentType);
        setShortcuts((prev) => [item, ...prev]);
        return item;
      } catch (err) {
        setLastError(err as Error);
        return null;
      }
    },
    [],
  );

  const simulateSnippet = useCallback(
    async (shortcutId: string, type: SnippetType): Promise<SnippetPreviewData | null> => {
      setLastError(null);
      try {
        const bridge = getBridge();
        const preview = await bridge.simulateSnippet(shortcutId, type);
        setActiveSnippet(preview);
        return preview;
      } catch (err) {
        setLastError(err as Error);
        return null;
      }
    },
    [],
  );

  const addVoiceShortcut = useCallback(async (shortcutId: string): Promise<ShortcutItem | null> => {
    setLastError(null);
    try {
      const bridge = getBridge();
      const updated = await bridge.addVoiceShortcut(shortcutId);
      setShortcuts((prev) => prev.map((s) => (s.id === shortcutId ? updated : s)));
      return updated;
    } catch (err) {
      setLastError(err as Error);
      return null;
    }
  }, []);

  return {
    info,
    shortcuts,
    activeSnippet,
    loading,
    lastError,
    refresh,
    donateShortcut,
    simulateSnippet,
    addVoiceShortcut,
  };
}
