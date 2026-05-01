/**
 * WorkoutCard — HealthKit Lab (feature 043).
 *
 * Lists the last 10 workouts with activity name, duration, and active
 * calories. Empty state when no workouts have been queried yet.
 */

import React from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

import { type WorkoutSummary, formatDuration } from '../sample-types';

interface WorkoutCardProps {
  readonly workouts: readonly WorkoutSummary[];
  readonly style?: ViewStyle;
}

export default function WorkoutCard({ workouts, style }: WorkoutCardProps) {
  return (
    <ThemedView style={[styles.container, style]} testID='healthkit-workouts-card'>
      <ThemedText style={styles.heading}>Recent workouts</ThemedText>
      {workouts.length === 0 ? (
        <ThemedText type='small' themeColor='textSecondary' testID='healthkit-workouts-empty'>
          No workouts logged in the visible window.
        </ThemedText>
      ) : (
        <View style={styles.list}>
          {workouts.map((w) => (
            <View key={w.id} style={styles.row} testID={`healthkit-workout-${w.id}`}>
              <View style={styles.rowMain}>
                <ThemedText type='smallBold'>{w.activityName}</ThemedText>
                <ThemedText type='small' themeColor='textSecondary'>
                  {w.start}
                </ThemedText>
              </View>
              <View style={styles.rowMeta}>
                <ThemedText type='small'>{formatDuration(w.duration)}</ThemedText>
                <ThemedText type='small' themeColor='textSecondary'>
                  {Math.round(w.calories)} kcal
                </ThemedText>
              </View>
            </View>
          ))}
        </View>
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
  heading: {
    fontSize: 18,
    fontWeight: '600',
  },
  list: {
    gap: Spacing.one,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.one,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: Spacing.two,
  },
  rowMain: {
    flex: 1,
    gap: Spacing.half,
  },
  rowMeta: {
    alignItems: 'flex-end',
    gap: Spacing.half,
  },
});
