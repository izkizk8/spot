/**
 * EventLog component (feature 025).
 *
 * Generic FIFO log renderer for region events and significant change events.
 */
import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

import type { RegionEvent, SignificantChangeEvent } from '../types';

type EventEntry = RegionEvent | SignificantChangeEvent;

export interface EventLogProps {
  entries: readonly EventEntry[];
  type: 'region' | 'significant';
  maxEntries?: number;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function isRegionEvent(entry: EventEntry): entry is RegionEvent {
  return 'regionId' in entry;
}

export function EventLog({ entries, type, maxEntries = 100 }: EventLogProps) {
  const displayEntries = entries.slice(0, maxEntries);

  if (displayEntries.length === 0) {
    return (
      <ThemedView style={styles.emptyContainer}>
        <ThemedText themeColor="textSecondary" style={styles.emptyText}>
          No events yet
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <ScrollView style={styles.container} nestedScrollEnabled>
      {displayEntries.map((entry) => (
        <ThemedView key={entry.id} style={styles.row} testID="event-row">
          <ThemedText style={styles.time}>{formatTime(entry.timestamp)}</ThemedText>
          {type === 'region' && isRegionEvent(entry) ? (
            <>
              <ThemedText style={[styles.type, entry.type === 'enter' && styles.typeEnter]}>
                {entry.type}
              </ThemedText>
              <ThemedText themeColor="textSecondary" style={styles.regionId}>
                {entry.regionId}
              </ThemedText>
            </>
          ) : (
            <ThemedText themeColor="textSecondary" style={styles.coords}>
              {(entry as SignificantChangeEvent).latitude.toFixed(4)},{' '}
              {(entry as SignificantChangeEvent).longitude.toFixed(4)}
            </ThemedText>
          )}
        </ThemedView>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    maxHeight: 200,
  },
  emptyContainer: {
    padding: Spacing.three,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.one,
    gap: Spacing.two,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5EA',
  },
  time: {
    fontSize: 12,
    fontVariant: ['tabular-nums'],
    width: 80,
  },
  type: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    width: 50,
  },
  typeEnter: {
    color: '#34C759',
  },
  regionId: {
    fontSize: 12,
    flex: 1,
  },
  coords: {
    fontSize: 12,
    fontVariant: ['tabular-nums'],
  },
});
