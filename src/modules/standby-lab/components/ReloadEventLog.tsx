/**
 * ReloadEventLog — presentational list of widget reload events.
 *
 * Pure: empty state when entries=[]; one row per entry; success vs.
 * failure visually distinguished. Renders entries in the order received
 * (the screen owns the ring buffer, prepends most recent first).
 *
 * @see specs/028-standby-mode/tasks.md T026, T033
 * @see specs/028-standby-mode/spec.md FR-SB-033, FR-SB-034
 */

import React from 'react';
import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

export interface ReloadEvent {
  readonly timestamp: number;
  readonly kind: string;
  readonly success: boolean;
  readonly error?: string;
}

export interface ReloadEventLogProps {
  readonly entries: readonly ReloadEvent[];
}

function formatTimestamp(ts: number): string {
  return new Date(ts).toLocaleTimeString();
}

export function ReloadEventLog({ entries }: ReloadEventLogProps) {
  if (entries.length === 0) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText style={styles.emptyText}>No pushes yet</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.heading}>Push History</ThemedText>
      {entries.map((entry, index) => (
        <ThemedView
          key={`${entry.timestamp}-${index}`}
          style={styles.entry}
          accessibilityLabel={
            entry.success
              ? `Success: ${entry.kind} at ${formatTimestamp(entry.timestamp)}`
              : `Failure: ${entry.kind} at ${formatTimestamp(entry.timestamp)}`
          }
        >
          <ThemedText style={[styles.entryText, entry.success ? styles.success : styles.failure]}>
            {entry.success ? '✓' : '✗'} {formatTimestamp(entry.timestamp)} · {entry.kind}
          </ThemedText>
          {!entry.success && entry.error ? (
            <ThemedText style={styles.errorText}>{entry.error}</ThemedText>
          ) : null}
        </ThemedView>
      ))}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.three,
    borderRadius: Spacing.two,
    borderWidth: 1,
    borderColor: '#D0D1D6',
    gap: Spacing.two,
  },
  heading: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: Spacing.one,
  },
  emptyText: {
    fontSize: 14,
    fontStyle: 'italic',
    opacity: 0.6,
  },
  entry: {
    gap: Spacing.one,
  },
  entryText: {
    fontSize: 13,
  },
  success: {
    color: '#34C759',
  },
  failure: {
    color: '#FF3B30',
  },
  errorText: {
    fontSize: 12,
    opacity: 0.8,
    paddingLeft: Spacing.two,
  },
});
