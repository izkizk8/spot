/**
 * RemindersQueryCard — Filter toggle + reminders list with edit/delete actions.
 */

import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import type { ReminderSummary, RemindersFilter } from '../types';
import { ReminderRow } from './ReminderRow';

interface RemindersQueryCardProps {
  filter: RemindersFilter;
  reminders: ReminderSummary[];
  onFilterChange: (filter: RemindersFilter) => void;
  onRefresh: () => void;
  onEdit: (reminder: ReminderSummary) => void;
  onDelete: (id: string) => void;
}

const FILTERS: readonly RemindersFilter[] = ['incomplete', 'completed', 'all'] as const;
const FILTER_LABELS: Record<RemindersFilter, string> = {
  incomplete: 'Incomplete',
  completed: 'Completed',
  all: 'All',
};

export function RemindersQueryCard({
  filter,
  reminders,
  onFilterChange,
  onRefresh,
  onEdit,
  onDelete,
}: RemindersQueryCardProps) {
  const theme = useTheme();

  return (
    <ThemedView style={styles.container} type='backgroundElement' testID='eventkit-reminders'>
      <View style={styles.header}>
        <ThemedText type='subtitle'>Reminders</ThemedText>
        <Pressable style={styles.refresh} onPress={onRefresh} testID='eventkit-reminders-refresh'>
          <ThemedText type='link' themeColor='tintA'>
            Refresh
          </ThemedText>
        </Pressable>
      </View>

      <View style={styles.segments}>
        {FILTERS.map((f) => {
          const selected = f === filter;
          return (
            <Pressable
              key={f}
              style={[
                styles.segment,
                {
                  backgroundColor: selected ? theme.backgroundSelected : 'transparent',
                },
              ]}
              onPress={() => onFilterChange(f)}
              testID={`eventkit-reminders-filter-${f}`}
            >
              <ThemedText
                type={selected ? 'smallBold' : 'small'}
                themeColor={selected ? 'text' : 'textSecondary'}
              >
                {FILTER_LABELS[f]}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>

      {reminders.length === 0 ? (
        <ThemedText type='small' themeColor='textSecondary'>
          No reminders match
        </ThemedText>
      ) : (
        reminders.map((reminder) => (
          <ReminderRow key={reminder.id} reminder={reminder} onEdit={onEdit} onDelete={onDelete} />
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
