/**
 * Shortcuts Snippets Bridge — iOS variant (feature 072).
 *
 * Single seam where the Shortcuts Expo Module is touched. Resolved
 * via requireOptionalNativeModule so the surface is null-safe in
 * unit tests where the module is absent.
 */

import { requireOptionalNativeModule } from 'expo-modules-core';
import { Platform } from 'react-native';

import {
  NATIVE_MODULE_NAME,
  ShortcutsSnippetsNotSupported,
  type ShortcutItem,
  type ShortcutsInfo,
  type ShortcutsSnippetsBridge,
  type SnippetPreviewData,
  type SnippetType,
} from './shortcuts-snippets.types';

export { ShortcutsSnippetsNotSupported };

interface NativeShortcutsSnippets {
  getInfo(): Promise<ShortcutsInfo>;
  getShortcuts(): Promise<readonly ShortcutItem[]>;
  donateShortcut(phrase: string, intentType: string): Promise<ShortcutItem>;
  simulateSnippet(shortcutId: string, type: SnippetType): Promise<SnippetPreviewData>;
  addVoiceShortcut(shortcutId: string): Promise<ShortcutItem>;
}

function getNative(): NativeShortcutsSnippets | null {
  return requireOptionalNativeModule<NativeShortcutsSnippets>(NATIVE_MODULE_NAME);
}

function ensureNative(): NativeShortcutsSnippets {
  if (Platform.OS !== 'ios') {
    throw new ShortcutsSnippetsNotSupported(
      `Shortcuts Snippets is not available on ${Platform.OS}`,
    );
  }
  const native = getNative();
  if (!native) {
    throw new ShortcutsSnippetsNotSupported('ShortcutsSnippets native module is not registered');
  }
  return native;
}

export function getInfo(): Promise<ShortcutsInfo> {
  try {
    return ensureNative().getInfo();
  } catch (err) {
    return Promise.reject(err);
  }
}

export function getShortcuts(): Promise<readonly ShortcutItem[]> {
  try {
    return ensureNative().getShortcuts();
  } catch (err) {
    return Promise.reject(err);
  }
}

export function donateShortcut(phrase: string, intentType: string): Promise<ShortcutItem> {
  try {
    return ensureNative().donateShortcut(phrase, intentType);
  } catch (err) {
    return Promise.reject(err);
  }
}

export function simulateSnippet(
  shortcutId: string,
  type: SnippetType,
): Promise<SnippetPreviewData> {
  try {
    return ensureNative().simulateSnippet(shortcutId, type);
  } catch (err) {
    return Promise.reject(err);
  }
}

export function addVoiceShortcut(shortcutId: string): Promise<ShortcutItem> {
  try {
    return ensureNative().addVoiceShortcut(shortcutId);
  } catch (err) {
    return Promise.reject(err);
  }
}

export const shortcutsSnippets: ShortcutsSnippetsBridge = {
  getInfo,
  getShortcuts,
  donateShortcut,
  simulateSnippet,
  addVoiceShortcut,
};

export default shortcutsSnippets;
