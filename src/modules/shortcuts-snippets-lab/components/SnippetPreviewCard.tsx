/**
 * SnippetPreviewCard Component
 * Feature: 072-shortcuts-snippets
 *
 * Shows a simulated confirmation or result snippet preview UI.
 */

import React from 'react';
import { StyleSheet, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import type { SnippetPreviewData } from '@/native/shortcuts-snippets.types';

interface SnippetPreviewCardProps {
  snippet: SnippetPreviewData | null;
  style?: ViewStyle;
}

export default function SnippetPreviewCard({ snippet, style }: SnippetPreviewCardProps) {
  return (
    <ThemedView style={[styles.container, style]}>
      <ThemedText style={styles.title}>Snippet Preview</ThemedText>
      {snippet === null ? (
        <ThemedText style={styles.help}>No snippet simulated yet.</ThemedText>
      ) : (
        <>
          <ThemedText style={styles.badge}>
            {snippet.type === 'confirmation' ? '⏳ Confirmation' : '✅ Result'}
          </ThemedText>
          <ThemedText style={styles.snippetTitle}>{snippet.title}</ThemedText>
          <ThemedText style={styles.help}>{snippet.detail}</ThemedText>
          {Object.entries(snippet.parameters).map(([key, value]) => (
            <ThemedText key={key} style={styles.param}>
              {key}: {value}
            </ThemedText>
          ))}
        </>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.three,
    gap: Spacing.one,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  badge: {
    fontSize: 14,
    fontWeight: '600',
  },
  snippetTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  help: {
    fontSize: 14,
    opacity: 0.8,
  },
  param: {
    fontSize: 13,
    opacity: 0.7,
    fontFamily: 'monospace',
  },
});
