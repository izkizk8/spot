/**
 * RunHistoryList — feature 030 / T029.
 */

import React from 'react';
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import type { TaskRunRecord } from '@/native/background-tasks.types';

import { HISTORY_MAX_ENTRIES } from '@/modules/background-tasks-lab/history-store';

interface RunHistoryListProps {
  readonly history: readonly TaskRunRecord[];
  readonly error: Error | null;
  readonly onClear: () => void;
  readonly style?: ViewStyle;
}

function formatNumberOrDash(value: number | null): string {
  if (value == null) return '—';
  return String(value);
}

function formatTimestampOrDash(value: number | null): string {
  if (value == null) return '—';
  return new Date(value).toLocaleString();
}

export default function RunHistoryList({ history, error, onClear, style }: RunHistoryListProps) {
  const visible = history.slice(0, HISTORY_MAX_ENTRIES);

  return (
    <ThemedView style={[styles.container, style]}>
      <View style={styles.headerRow}>
        <ThemedText style={styles.heading}>Run history</ThemedText>
        <Pressable accessibilityRole="button" onPress={onClear} style={styles.clearButton}>
          <ThemedText style={styles.clearText}>Clear history</ThemedText>
        </Pressable>
      </View>

      {error != null ? (
        <ThemedText style={styles.error} accessibilityLabel="history error">
          History unavailable: {error.message}
        </ThemedText>
      ) : null}

      {visible.length === 0 ? (
        <ThemedText style={styles.empty}>No background runs recorded yet</ThemedText>
      ) : (
        visible.map((rec) => (
          <View key={rec.id} style={styles.row}>
            <ThemedText style={styles.rowId}>{rec.id}</ThemedText>
            <ThemedText style={styles.rowMeta}>
              {rec.type} • {rec.status}
            </ThemedText>
            <ThemedText style={styles.rowMeta}>
              scheduled: {formatTimestampOrDash(rec.scheduledAt)}
            </ThemedText>
            <ThemedText style={styles.rowMeta}>
              started: {formatTimestampOrDash(rec.startedAt)}
            </ThemedText>
            <ThemedText style={styles.rowMeta}>
              ended: {formatTimestampOrDash(rec.endedAt)}
            </ThemedText>
            <ThemedText style={styles.rowMeta}>
              duration: {formatNumberOrDash(rec.durationMs)} ms
            </ThemedText>
          </View>
        ))
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.three,
    borderRadius: Spacing.two,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.two,
  },
  heading: {
    fontSize: 18,
    fontWeight: '600',
  },
  clearButton: {
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.two,
    borderRadius: Spacing.one,
    backgroundColor: '#E0E1E6',
  },
  clearText: {
    fontSize: 12,
    fontWeight: '600',
  },
  empty: {
    fontSize: 14,
    opacity: 0.6,
    fontStyle: 'italic',
  },
  error: {
    fontSize: 13,
    color: '#FF3B30',
    marginBottom: Spacing.two,
  },
  row: {
    paddingVertical: Spacing.two,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#ccc',
  },
  rowId: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
  },
  rowMeta: {
    fontSize: 12,
    opacity: 0.8,
  },
});
