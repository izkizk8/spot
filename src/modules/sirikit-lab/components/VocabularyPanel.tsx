/**
 * VocabularyPanel Component
 * Feature: 071-sirikit
 *
 * Displays SiriKit vocabulary entries (user-specific and app-specific).
 */

import React from 'react';
import { StyleSheet, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import type { VocabularyEntry } from '@/native/sirikit.types';

interface VocabularyPanelProps {
  vocabulary: readonly VocabularyEntry[];
  style?: ViewStyle;
}

export default function VocabularyPanel({ vocabulary, style }: VocabularyPanelProps) {
  return (
    <ThemedView style={[styles.container, style]}>
      <ThemedText style={styles.title}>Vocabulary</ThemedText>
      {vocabulary.length === 0 ? (
        <ThemedText style={styles.help}>No entries registered.</ThemedText>
      ) : (
        vocabulary.map((entry) => (
          <ThemedView key={`${entry.scope}:${entry.term}`} style={styles.row}>
            <ThemedText style={styles.term}>{entry.term}</ThemedText>
            <ThemedText style={styles.help}>
              scope: {entry.scope}
              {entry.pronunciation !== null ? ` · ${entry.pronunciation}` : ''}
            </ThemedText>
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
    paddingVertical: Spacing.half,
    gap: Spacing.half,
  },
  term: {
    fontSize: 15,
    fontWeight: '600',
  },
  help: {
    fontSize: 13,
    opacity: 0.8,
  },
});
