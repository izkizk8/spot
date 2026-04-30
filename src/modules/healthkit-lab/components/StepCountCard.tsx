/**
 * StepCountCard — HealthKit Lab (feature 043).
 *
 * Renders the last 7 days of daily-step buckets as a horizontal bar
 * chart. Each bar's width is proportional to that day's value relative
 * to the highest bucket in the window. Reuses the rendering technique
 * from feature 011 (sensors-playground BarChart) but bound to a 7-day
 * histogram rather than an XYZ axis.
 */

import React from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

import type { DailyStep } from '../sample-types';

interface StepCountCardProps {
  readonly steps7d: readonly DailyStep[];
  readonly style?: ViewStyle;
}

function maxValue(samples: readonly DailyStep[]): number {
  let m = 0;
  for (const s of samples) {
    if (Number.isFinite(s.steps) && s.steps > m) m = s.steps;
  }
  return m;
}

function shortDay(iso: string): string {
  // Pull the trailing two characters of the YYYY-MM-DD slice: the day.
  if (iso.length >= 10) return iso.slice(8, 10);
  return iso;
}

export default function StepCountCard({ steps7d, style }: StepCountCardProps) {
  const peak = maxValue(steps7d);

  return (
    <ThemedView style={[styles.container, style]} testID="healthkit-step-card">
      <ThemedText style={styles.heading}>Daily steps — last 7 days</ThemedText>
      {steps7d.length === 0 ? (
        <ThemedText type="small" themeColor="textSecondary" testID="healthkit-step-empty">
          No step data yet. Authorize HealthKit to populate this card.
        </ThemedText>
      ) : (
        <View testID="healthkit-step-chart" style={styles.chart}>
          {steps7d.map((d) => {
            const widthPct = peak > 0 ? Math.max(2, (d.steps / peak) * 100) : 0;
            return (
              <View key={d.date} style={styles.row} testID={`healthkit-step-row-${d.date}`}>
                <ThemedText type="small" themeColor="textSecondary" style={styles.label}>
                  {shortDay(d.date)}
                </ThemedText>
                <View style={styles.track}>
                  <View
                    testID={`healthkit-step-fill-${d.date}`}
                    style={[styles.fill, { width: `${widthPct}%` }]}
                  />
                </View>
                <ThemedText type="small" style={styles.value}>
                  {d.steps.toLocaleString()}
                </ThemedText>
              </View>
            );
          })}
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
  chart: {
    gap: Spacing.one,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  label: {
    width: 28,
  },
  track: {
    flex: 1,
    height: 10,
    backgroundColor: '#E0E1E6',
    borderRadius: Spacing.half,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: '#FF2D55',
  },
  value: {
    minWidth: 64,
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
  },
});
