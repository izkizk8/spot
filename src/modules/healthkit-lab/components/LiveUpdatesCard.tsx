/**
 * LiveUpdatesCard — HealthKit Lab (feature 043).
 *
 * Toggles the underlying HKObserverQuery subscription on / off and
 * shows a counter of received updates. Pressing the toggle calls back
 * into the parent (the screen / hook); the counter re-renders as the
 * hook emits new values.
 */

import React from 'react';
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface LiveUpdatesCardProps {
  readonly observerActive: boolean;
  readonly observerUpdateCount: number;
  readonly onToggle: () => void;
  readonly style?: ViewStyle;
}

export default function LiveUpdatesCard({
  observerActive,
  observerUpdateCount,
  onToggle,
  style,
}: LiveUpdatesCardProps) {
  const theme = useTheme();

  return (
    <ThemedView style={[styles.container, style]} testID="healthkit-live-card">
      <ThemedText style={styles.heading}>Live updates (HKObserverQuery)</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        While the observer is active the JS side increments a counter on every step-count update
        delivered by HealthKit. Updates may be coalesced and may not arrive in foreground at all if
        the user is not currently moving.
      </ThemedText>
      <View style={styles.row}>
        <ThemedText type="smallBold" testID="healthkit-live-status">
          {observerActive ? 'Active' : 'Inactive'}
        </ThemedText>
        <ThemedText type="small" testID="healthkit-live-count">
          {observerUpdateCount} updates received
        </ThemedText>
      </View>
      <Pressable
        testID="healthkit-live-toggle"
        onPress={onToggle}
        style={[styles.cta, { backgroundColor: observerActive ? theme.tintB : theme.tintA }]}
      >
        <ThemedText type="smallBold" themeColor="background">
          {observerActive ? 'Stop observing' : 'Start observing'}
        </ThemedText>
      </Pressable>
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
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.one,
  },
  cta: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.one,
    alignItems: 'center',
    marginTop: Spacing.two,
  },
});
