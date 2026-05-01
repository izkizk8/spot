/**
 * ShortcutPanel Component
 * Feature: 072-shortcuts-snippets
 *
 * Displays donated shortcuts and snippet simulation controls.
 */

import React from 'react';
import { StyleSheet, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import type { ShortcutItem, SnippetType } from '@/native/shortcuts-snippets.types';

interface ShortcutPanelProps {
  shortcuts: readonly ShortcutItem[];
  onSimulateSnippet: (shortcutId: string, type: SnippetType) => void;
  onAddVoiceShortcut: (shortcutId: string) => void;
  loading: boolean;
  style?: ViewStyle;
}

export default function ShortcutPanel({ shortcuts, style }: ShortcutPanelProps) {
  return (
    <ThemedView style={[styles.container, style]}>
      <ThemedText style={styles.title}>Donated Shortcuts</ThemedText>
      {shortcuts.length === 0 ? (
        <ThemedText style={styles.help}>No shortcuts donated yet.</ThemedText>
      ) : (
        shortcuts.map((item) => (
          <ThemedView key={item.id} style={styles.row}>
            <ThemedText style={styles.phrase}>{item.phrase}</ThemedText>
            <ThemedText style={styles.help}>
              {item.intentType} · {item.status}
            </ThemedText>
            {item.snippetType !== null ? (
              <ThemedText style={styles.help}>Snippet: {item.snippetType}</ThemedText>
            ) : null}
          </ThemedView>
        ))
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.three,
    gap: Spacing.two,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  row: {
    paddingVertical: Spacing.one,
    gap: Spacing.half,
  },
  phrase: {
    fontSize: 15,
    fontWeight: '600',
  },
  help: {
    fontSize: 13,
    opacity: 0.8,
  },
});
