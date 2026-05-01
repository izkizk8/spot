/**
 * Shortcuts Snippets Bridge Types
 * Feature: 072-shortcuts-snippets
 *
 * Type definitions for the Shortcuts app integration bridge.
 * INUIAddVoiceShortcutViewController + Intent UI snippets — iOS 12+ only.
 */

export const NATIVE_MODULE_NAME = 'ShortcutsSnippets' as const;

export type SnippetType = 'confirmation' | 'result';

export type ShortcutStatus = 'pending' | 'active' | 'triggered';

export interface ShortcutItem {
  id: string;
  phrase: string;
  intentType: string;
  status: ShortcutStatus;
  snippetType: SnippetType | null;
  createdAt: number;
}

export interface SnippetPreviewData {
  type: SnippetType;
  title: string;
  detail: string;
  parameters: Record<string, string>;
}

export interface ShortcutsInfo {
  available: boolean;
  supportedSnippetTypes: readonly SnippetType[];
  donatedCount: number;
}

export interface ShortcutsSnippetsBridge {
  getInfo(): Promise<ShortcutsInfo>;
  getShortcuts(): Promise<readonly ShortcutItem[]>;
  donateShortcut(phrase: string, intentType: string): Promise<ShortcutItem>;
  simulateSnippet(shortcutId: string, type: SnippetType): Promise<SnippetPreviewData>;
  addVoiceShortcut(shortcutId: string): Promise<ShortcutItem>;
}

export class ShortcutsSnippetsNotSupported extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ShortcutsSnippetsNotSupported';
  }
}
