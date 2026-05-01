/**
 * EventRow — Single event row with tap-to-edit and long-press-to-delete.
 */

import React from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';

import type { EventSummary } from '../types';

interface EventRowProps {
  event: EventSummary;
  onEdit: (event: EventSummary) => void;
  onDelete: (id: string) => void;
}

function formatDate(d: Date, allDay: boolean): string {
  if (allDay) {
    return d.toLocaleDateString();
  }
  return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  })}`;
}

function formatRange(event: EventSummary): string {
  if (event.allDay) {
    const start = formatDate(event.startDate, true);
    const end = formatDate(event.endDate, true);
    return start === end ? start : `${start} – ${end}`;
  }
  return `${formatDate(event.startDate, false)} → ${formatDate(event.endDate, false)}`;
}

export function EventRow({ event, onEdit, onDelete }: EventRowProps) {
  const handleLongPress = () => {
    Alert.alert('Delete event?', `"${event.title}" will be removed from your calendar.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => onDelete(event.id),
      },
    ]);
  };

  return (
    <Pressable
      style={styles.container}
      onPress={() => onEdit(event)}
      onLongPress={handleLongPress}
      testID={`eventkit-event-${event.id}`}
    >
      <View style={styles.titleRow}>
        <ThemedText type='default' style={styles.title} numberOfLines={1}>
          {event.title}
        </ThemedText>
        {event.allDay ? (
          <ThemedText type='smallBold' themeColor='tintB' style={styles.badge}>
            ALL-DAY
          </ThemedText>
        ) : null}
      </View>

      {event.location ? (
        <ThemedText type='small' themeColor='textSecondary' numberOfLines={1}>
          📍 {event.location}
        </ThemedText>
      ) : null}

      <ThemedText type='small' themeColor='textSecondary'>
        {formatRange(event)}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: Spacing.two,
    gap: Spacing.half,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  title: {
    flex: 1,
  },
  badge: {
    fontSize: 10,
  },
});
