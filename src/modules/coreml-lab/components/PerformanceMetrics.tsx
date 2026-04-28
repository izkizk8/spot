/**
 * Performance Metrics component for CoreML Lab (feature 016).
 *
 * Renders inference duration in milliseconds and the compute units selected
 * by the model. Empty state when no inference has run yet.
 */

import React from 'react';
import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import type { ComputeUnit } from '@/native/coreml.types';

export interface PerformanceMetricsProps {
  inferenceMs: number | null;
  computeUnits: ComputeUnit[];
}

export function PerformanceMetrics({ inferenceMs, computeUnits }: PerformanceMetricsProps) {
  if (inferenceMs === null || computeUnits.length === 0) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText type="small" themeColor="textSecondary">
          — ms · —
        </ThemedText>
      </ThemedView>
    );
  }

  const unitsLabel = computeUnits
    .map((u) => {
      if (u === 'neuralEngine') return 'NeuralEngine';
      if (u === 'gpu') return 'GPU';
      return 'CPU';
    })
    .join('+');

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="small" themeColor="textSecondary">
        {inferenceMs} ms · {unitsLabel}
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
  },
});
