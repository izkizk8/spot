/**
 * @file BarChart.tsx
 * @description 3-row sliding-window bar chart from RN Views.
 * Each row's bar width is proportional to the absolute value of the
 * latest `window` samples on that axis, normalised to a 0..100 scale.
 */
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

export interface XYZ {
  x: number;
  y: number;
  z: number;
}

export interface BarChartProps {
  samples: readonly XYZ[];
  /** How many of the most-recent samples to consider for the bar width. */
  window: number;
  /** Multiplier from raw value to percentage. Defaults to 50 (so 1g → ~50%). */
  scale?: number;
}

const AXES: readonly (keyof XYZ)[] = ['x', 'y', 'z'];

function maxAbs(samples: readonly XYZ[], axis: keyof XYZ): number {
  let m = 0;
  for (let i = 0; i < samples.length; i++) {
    const v = Math.abs(samples[i][axis]);
    if (v > m) m = v;
  }
  return m;
}

export function BarChart({ samples, window, scale = 50 }: BarChartProps) {
  const recent = samples.slice(Math.max(0, samples.length - window));
  return (
    <ThemedView style={styles.container} testID='bar-chart'>
      {AXES.map((axis) => {
        const value = recent.length === 0 ? 0 : maxAbs(recent, axis);
        const widthPct = Math.max(0, Math.min(100, value * scale));
        return (
          <View key={axis} style={styles.row} testID={`bar-row-${axis}`}>
            <View
              testID={`bar-fill-${axis}`}
              // single-value dynamic style — permitted per constitution IV
              style={[styles.fill, { width: `${widthPct}%` }]}
            />
          </View>
        );
      })}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.one,
    paddingVertical: Spacing.one,
  },
  row: {
    height: 8,
    backgroundColor: '#E0E1E6',
    borderRadius: Spacing.half,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: '#007AFF',
  },
});
