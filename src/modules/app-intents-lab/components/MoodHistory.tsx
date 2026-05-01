/**
 * MoodHistory — newest-first list of MoodRecord rows.
 *
 * The caller is responsible for slicing to the desired limit.
 */

import React from 'react';
import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import type { MoodRecord } from '@/modules/app-intents-lab/mood-store';

export interface MoodHistoryProps {
  readonly history: readonly MoodRecord[];
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatTimestamp(ts: number): string {
  const d = new Date(ts);
  const month = MONTHS[d.getMonth()];
  const day = d.getDate();
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${month} ${day}, ${hh}:${mm}`;
}

function titleCase(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function MoodHistory({ history }: MoodHistoryProps) {
  if (history.length === 0) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText style={styles.heading}>Mood History</ThemedText>
        <ThemedText style={styles.empty}>No moods logged yet</ThemedText>
      </ThemedView>
    );
  }
  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.heading}>Mood History</ThemedText>
      {history.map((rec, i) => {
        const time = formatTimestamp(rec.timestamp);
        const label = titleCase(rec.mood);
        return (
          <ThemedView
            key={`${rec.timestamp}-${i}`}
            style={styles.row}
            accessibilityLabel={`${label} at ${time}`}
            testID={`mood-history-row-${i}`}
          >
            <ThemedText style={styles.mood}>{label}</ThemedText>
            <ThemedText style={styles.time}>{time}</ThemedText>
          </ThemedView>
        );
      })}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.two,
    padding: Spacing.two,
  },
  heading: {
    fontSize: 14,
    fontWeight: '600',
  },
  empty: {
    fontSize: 14,
    fontStyle: 'italic',
    opacity: 0.7,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.two,
    borderRadius: Spacing.one,
    borderWidth: 1,
    borderColor: '#D0D1D6',
  },
  mood: {
    fontSize: 14,
    fontWeight: '600',
  },
  time: {
    fontSize: 12,
    opacity: 0.7,
  },
});
