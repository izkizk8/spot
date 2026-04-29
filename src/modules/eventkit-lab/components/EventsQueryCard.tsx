/**
 * EventsQueryCard — Date-range picker + events list with edit/delete actions.
 */

import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { DATE_RANGE_LABELS, DATE_RANGE_PRESETS, type DateRangePreset } from '../date-ranges';
import type { EventSummary } from '../types';
import { EventRow } from './EventRow';

interface EventsQueryCardProps {
  range: DateRangePreset;
  events: EventSummary[];
  onRangeChange: (range: DateRangePreset) => void;
  onRefresh: () => void;
  onEdit: (event: EventSummary) => void;
  onDelete: (id: string) => void;
}

export function EventsQueryCard({
  range,
  events,
  onRangeChange,
  onRefresh,
  onEdit,
  onDelete,
}: EventsQueryCardProps) {
  const theme = useTheme();

  return (
    <ThemedView style={styles.container} type="backgroundElement" testID="eventkit-events">
      <View style={styles.header}>
        <ThemedText type="subtitle">Events</ThemedText>
        <Pressable style={styles.refresh} onPress={onRefresh} testID="eventkit-events-refresh">
          <ThemedText type="link" themeColor="tintA">
            Refresh
          </ThemedText>
        </Pressable>
      </View>

      <View style={styles.segments}>
        {DATE_RANGE_PRESETS.map((preset) => {
          const selected = preset === range;
          return (
            <Pressable
              key={preset}
              style={[
                styles.segment,
                {
                  backgroundColor: selected ? theme.backgroundSelected : 'transparent',
                },
              ]}
              onPress={() => onRangeChange(preset)}
              testID={`eventkit-events-range-${preset}`}
            >
              <ThemedText
                type={selected ? 'smallBold' : 'small'}
                themeColor={selected ? 'text' : 'textSecondary'}
              >
                {DATE_RANGE_LABELS[preset]}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>

      {events.length === 0 ? (
        <ThemedText type="small" themeColor="textSecondary">
          No events in this range
        </ThemedText>
      ) : (
        events.map((event) => (
          <EventRow key={event.id} event={event} onEdit={onEdit} onDelete={onDelete} />
        ))
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.three,
    borderRadius: Spacing.two,
    gap: Spacing.two,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  refresh: {
    padding: Spacing.one,
  },
  segments: {
    flexDirection: 'row',
    gap: Spacing.one,
  },
  segment: {
    flex: 1,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.two,
    borderRadius: Spacing.one,
    alignItems: 'center',
  },
});
