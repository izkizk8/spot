/**
 * StatsCard Component
 * Feature: 053-swiftdata
 *
 * Renders priority counts and the completion rate as a small bar
 * chart. The completion rate is rendered as a fixed-width progress
 * bar so the visual stays JS-pure (no Skia / Reanimated chart deps).
 */

import React from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

import type { TaskStats } from '../task-types';

interface StatsCardProps {
  stats: TaskStats;
  style?: ViewStyle;
}

function pct(rate: number): string {
  return `${Math.round(rate * 100)}%`;
}

export default function StatsCard({ stats, style }: StatsCardProps) {
  const ratePct = Math.max(0, Math.min(1, stats.completionRate));
  return (
    <ThemedView style={[styles.container, style]}>
      <ThemedText style={styles.title}>Stats</ThemedText>
      <ThemedText style={styles.row}>
        Total {stats.total} · Active {stats.active} · Completed {stats.completed}
      </ThemedText>
      <ThemedText style={styles.row}>
        High {stats.byPriority.high} · Med {stats.byPriority.medium} · Low {stats.byPriority.low}
      </ThemedText>
      <ThemedText style={styles.row}>Completion rate {pct(ratePct)}</ThemedText>
      <ThemedView
        accessibilityLabel="Completion rate bar"
        accessibilityRole="progressbar"
        accessibilityValue={{ now: Math.round(ratePct * 100), min: 0, max: 100 }}
        style={styles.barTrack}
      >
        <View style={[styles.barFill, { width: `${ratePct * 100}%` }]} />
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.three,
    gap: Spacing.one,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  row: {
    fontSize: 14,
    opacity: 0.85,
  },
  barTrack: {
    height: 8,
    backgroundColor: '#E5E5EA',
    borderRadius: 4,
    overflow: 'hidden',
    marginTop: Spacing.one,
  },
  barFill: {
    height: '100%',
    backgroundColor: '#34C759',
  },
});
