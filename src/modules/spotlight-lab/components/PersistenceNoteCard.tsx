/**
 * PersistenceNoteCard — feature 031 / T034.
 *
 * Static prose about system-managed eviction and re-indexing.
 */

import React from 'react';
import { StyleSheet, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

interface PersistenceNoteCardProps {
  readonly style?: ViewStyle;
}

export default function PersistenceNoteCard({ style }: PersistenceNoteCardProps) {
  return (
    <ThemedView style={[styles.container, style]}>
      <ThemedText style={styles.heading}>Persistence Note</ThemedText>
      <ThemedText style={styles.body}>
        Spotlight index entries are system-managed. iOS may evict entries at any time based on
        storage pressure, user engagement, and time since last access.
      </ThemedText>
      <ThemedText style={styles.body}>
        Apps should re-index from a stable source (database, server, or local assets) on launch or
        when content changes. Never rely on the index as the sole source of truth.
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.three,
    borderRadius: Spacing.two,
  },
  heading: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: Spacing.two,
  },
  body: {
    fontSize: 13,
    lineHeight: 18,
    opacity: 0.7,
    marginBottom: Spacing.two,
  },
});
