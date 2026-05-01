/**
 * RemindersList — Read-only list of reminder lists with a refresh action.
 */

import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

import type { CalendarSummary } from '../types';

interface RemindersListProps {
  lists: CalendarSummary[];
  onRefresh: () => void;
}

export function RemindersList({ lists, onRefresh }: RemindersListProps) {
  return (
    <ThemedView style={styles.container} type='backgroundElement' testID='eventkit-reminder-lists'>
      <View style={styles.header}>
        <ThemedText type='subtitle'>Reminder Lists</ThemedText>
        <Pressable
          style={styles.refresh}
          onPress={onRefresh}
          testID='eventkit-reminder-lists-refresh'
        >
          <ThemedText type='link' themeColor='tintA'>
            Refresh
          </ThemedText>
        </Pressable>
      </View>

      {lists.length === 0 ? (
        <ThemedText type='small' themeColor='textSecondary'>
          No lists
        </ThemedText>
      ) : (
        lists.map((list) => (
          <View key={list.id} style={styles.row} testID={`eventkit-reminder-list-${list.id}`}>
            <View style={[styles.swatch, { backgroundColor: list.color }]} />
            <ThemedText type='default' style={styles.rowText}>
              {list.title}
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.one,
  },
  swatch: {
    width: Spacing.three,
    height: Spacing.three,
    borderRadius: Spacing.two,
  },
  rowText: {
    flex: 1,
  },
});
