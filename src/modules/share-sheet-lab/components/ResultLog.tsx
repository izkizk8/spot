/**
 * ResultLog — feature 033 / T031.
 *
 * Displays 0-10 ShareLogEntry rows, newest-first. Each row shows type,
 * activityType, outcome label, and timestamp.
 */

import React from 'react';
import { ScrollView, StyleSheet, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import type { ShareLogEntry } from '../hooks/useShareSession';

interface ResultLogProps {
  readonly entries: readonly ShareLogEntry[];
  readonly style?: ViewStyle;
}

export default function ResultLog({ entries, style }: ResultLogProps) {
  if (entries.length === 0) {
    return (
      <ThemedView style={[styles.container, style]}>
        <ThemedText style={styles.emptyText}>No shares yet</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ScrollView style={[styles.container, style]} contentContainerStyle={styles.content}>
      {entries.slice(0, 10).map((entry) => (
        <ThemedView key={entry.id} style={styles.row}>
          <ThemedView style={styles.header}>
            <ThemedText style={styles.type}>{entry.type.toUpperCase()}</ThemedText>
            <ThemedText style={styles.timestamp}>
              {new Date(entry.timestamp).toLocaleTimeString()}
            </ThemedText>
          </ThemedView>

          <ThemedText style={styles.activityType}>
            {entry.activityType === '(none)' ? 'No activity' : entry.activityType}
          </ThemedText>

          <ThemedText style={[styles.outcome, getOutcomeStyle(entry.outcome)]}>
            {entry.outcome.toUpperCase()}
          </ThemedText>

          {entry.errorMessage && (
            <ThemedText style={styles.error}>{entry.errorMessage}</ThemedText>
          )}
        </ThemedView>
      ))}
    </ScrollView>
  );
}

function getOutcomeStyle(outcome: ShareLogEntry['outcome']) {
  switch (outcome) {
    case 'completed':
      return { color: '#34c759' };
    case 'cancelled':
      return { color: '#ff9500' };
    case 'error':
      return { color: '#ff3b30' };
  }
}

const styles = StyleSheet.create({
  container: {
    maxHeight: 300,
  },
  content: {
    gap: Spacing.two,
  },
  emptyText: {
    fontSize: 14,
    opacity: 0.5,
    textAlign: 'center',
    paddingVertical: Spacing.four,
  },
  row: {
    padding: Spacing.three,
    borderRadius: Spacing.two,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    gap: Spacing.one,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  type: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  timestamp: {
    fontSize: 11,
    opacity: 0.6,
  },
  activityType: {
    fontSize: 12,
    opacity: 0.8,
  },
  outcome: {
    fontSize: 14,
    fontWeight: '600',
  },
  error: {
    fontSize: 12,
    color: '#ff3b30',
    fontStyle: 'italic',
  },
});
