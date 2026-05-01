/**
 * ShortcutsInfoCard Component
 * Feature: 072-shortcuts-snippets
 *
 * Surfaces the Shortcuts availability and capability info.
 */

import React from 'react';
import { StyleSheet, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import type { ShortcutsInfo } from '@/native/shortcuts-snippets.types';

interface ShortcutsInfoCardProps {
  info: ShortcutsInfo | null;
  style?: ViewStyle;
}

export default function ShortcutsInfoCard({ info, style }: ShortcutsInfoCardProps) {
  return (
    <ThemedView style={[styles.container, style]}>
      <ThemedText style={styles.title}>Shortcuts Capability</ThemedText>
      {info === null ? (
        <ThemedText style={styles.help}>Loading...</ThemedText>
      ) : info.available ? (
        <>
          <ThemedText style={styles.value}>Available</ThemedText>
          <ThemedText style={styles.help}>
            Snippet types: {info.supportedSnippetTypes.join(', ')}
          </ThemedText>
          <ThemedText style={styles.help}>Donated shortcuts: {info.donatedCount}</ThemedText>
        </>
      ) : (
        <ThemedText style={styles.help}>
          Shortcuts integration is unavailable — requires iOS 12 or later.
        </ThemedText>
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
  value: {
    fontSize: 16,
    fontWeight: '600',
  },
  help: {
    fontSize: 14,
    opacity: 0.8,
  },
});
