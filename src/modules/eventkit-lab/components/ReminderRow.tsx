/**
 * ReminderRow — Single reminder row with tap-to-edit and long-press-to-delete.
 */

import React from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';

import type { ReminderSummary } from '../types';

interface ReminderRowProps {
  reminder: ReminderSummary;
  onEdit: (reminder: ReminderSummary) => void;
  onDelete: (id: string) => void;
}

const PRIORITY_LABELS: Record<ReminderSummary['priority'], string> = {
  none: '',
  low: 'LOW',
  medium: 'MED',
  high: 'HIGH',
};

function formatDue(d: Date): string {
  return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  })}`;
}

export function ReminderRow({ reminder, onEdit, onDelete }: ReminderRowProps) {
  const handleLongPress = () => {
    Alert.alert('Delete reminder?', `"${reminder.title}" will be removed.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => onDelete(reminder.id),
      },
    ]);
  };

  const priorityLabel = PRIORITY_LABELS[reminder.priority];

  return (
    <Pressable
      style={styles.container}
      onPress={() => onEdit(reminder)}
      onLongPress={handleLongPress}
      testID={`eventkit-reminder-${reminder.id}`}
    >
      <View style={styles.titleRow}>
        <ThemedText
          type="default"
          style={styles.title}
          numberOfLines={1}
          themeColor={reminder.completed ? 'textSecondary' : 'text'}
        >
          {reminder.completed ? '✓ ' : ''}
          {reminder.title}
        </ThemedText>
        {priorityLabel !== '' ? (
          <ThemedText type="smallBold" themeColor="tintB" style={styles.badge}>
            {priorityLabel}
          </ThemedText>
        ) : null}
      </View>

      {reminder.dueDate ? (
        <ThemedText type="small" themeColor="textSecondary">
          Due {formatDue(reminder.dueDate)}
        </ThemedText>
      ) : null}
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
