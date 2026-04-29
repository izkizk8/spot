/**
 * CalendarsList — Read-only list of available calendars with a refresh action.
 */

import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

import type { CalendarSummary } from '../types';

interface CalendarsListProps {
  calendars: CalendarSummary[];
  onRefresh: () => void;
}

export function CalendarsList({ calendars, onRefresh }: CalendarsListProps) {
  return (
    <ThemedView style={styles.container} type="backgroundElement" testID="eventkit-calendars">
      <View style={styles.header}>
        <ThemedText type="subtitle">Calendars</ThemedText>
        <Pressable
          style={styles.refresh}
          onPress={onRefresh}
          testID="eventkit-calendars-refresh"
        >
          <ThemedText type="link" themeColor="tintA">
            Refresh
          </ThemedText>
        </Pressable>
      </View>

      {calendars.length === 0 ? (
        <ThemedText type="small" themeColor="textSecondary">
          No calendars
        </ThemedText>
      ) : (
        calendars.map((cal) => (
          <View key={cal.id} style={styles.row} testID={`eventkit-calendar-${cal.id}`}>
            <View style={[styles.swatch, { backgroundColor: cal.color }]} />
            <View style={styles.rowText}>
              <ThemedText type="default">{cal.title}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {cal.type}
              </ThemedText>
            </View>
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
