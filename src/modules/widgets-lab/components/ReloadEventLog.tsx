/**
 * ReloadEventLog — newest-first list of the last 10 widget reload attempts.
 *
 * Ring-buffer trimming is the parent's responsibility (the `events` prop is
 * already capped at 10 by the screen's reducer). Component is purely
 * presentational; renders null when not on iOS 14+ (FR-031).
 *
 * @see specs/014-home-widgets/tasks.md T034
 */

import React from 'react';
import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

export type ReloadEventStatus = 'success' | 'failure';

export interface ReloadEvent {
  readonly id: string;
  readonly timestamp: number;
  readonly status: ReloadEventStatus;
  readonly errorMessage?: string;
}

export interface ReloadEventLogProps {
  readonly events: readonly ReloadEvent[];
  readonly isAvailable: boolean;
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString();
}

export function ReloadEventLog({ events, isAvailable }: ReloadEventLogProps) {
  if (!isAvailable) return null;

  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.heading}>Reload events</ThemedText>
      {events.length === 0 ? (
        <ThemedText style={styles.empty}>No reload events yet — push to populate the log.</ThemedText>
      ) : (
        events.map((e) => (
          <ThemedView
            key={e.id}
            accessibilityLabel={`Reload event ${e.id}`}
            style={styles.entry}
          >
            <ThemedText style={styles.entryStatus}>
              {e.status === 'success' ? '✓' : '✗'} {formatTime(e.timestamp)}
            </ThemedText>
            {e.status === 'failure' && e.errorMessage != null && (
              <ThemedText style={styles.entryError}>{e.errorMessage}</ThemedText>
            )}
          </ThemedView>
        ))
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.one,
    padding: Spacing.three,
    borderRadius: Spacing.two,
    borderWidth: 1,
    borderColor: '#D0D1D6',
  },
  heading: {
    fontSize: 16,
    fontWeight: '600',
  },
  empty: {
    fontSize: 13,
    fontStyle: 'italic',
    color: '#60646C',
  },
  entry: {
    paddingVertical: Spacing.half,
    gap: Spacing.half,
  },
  entryStatus: {
    fontSize: 13,
  },
  entryError: {
    fontSize: 12,
    color: '#D70015',
  },
});
