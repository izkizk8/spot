/**
 * Shortcuts Snippets Bridge — Web stub (feature 072).
 *
 * Shortcuts app integration is iOS-only. All methods reject with
 * ShortcutsSnippetsNotSupported. MUST NOT import the iOS variant.
 */

import {
  ShortcutsSnippetsNotSupported,
  type ShortcutItem,
  type ShortcutsInfo,
  type ShortcutsSnippetsBridge,
  type SnippetPreviewData,
  type SnippetType,
} from './shortcuts-snippets.types';

export { ShortcutsSnippetsNotSupported };

const ERR = (): ShortcutsSnippetsNotSupported =>
  new ShortcutsSnippetsNotSupported('Shortcuts Snippets is not supported on web');

export function getInfo(): Promise<ShortcutsInfo> {
  return Promise.reject(ERR());
}

export function getShortcuts(): Promise<readonly ShortcutItem[]> {
  return Promise.reject(ERR());
}

export function donateShortcut(_phrase: string, _intentType: string): Promise<ShortcutItem> {
  return Promise.reject(ERR());
}

export function simulateSnippet(
  _shortcutId: string,
  _type: SnippetType,
): Promise<SnippetPreviewData> {
  return Promise.reject(ERR());
}

export function addVoiceShortcut(_shortcutId: string): Promise<ShortcutItem> {
  return Promise.reject(ERR());
}

export const shortcutsSnippets: ShortcutsSnippetsBridge = {
  getInfo,
  getShortcuts,
  donateShortcut,
  simulateSnippet,
  addVoiceShortcut,
};

export default shortcutsSnippets;
