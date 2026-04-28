/**
 * Stats Bar component for Camera Vision (feature 017).
 *
 * Displays FPS, analysis time, and detected count.
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

export interface StatsBarProps {
  fps: number;
  lastAnalysisMs: number | null;
  detected: number;
}

export function StatsBar({ fps, lastAnalysisMs, detected }: StatsBarProps) {
  return (
    <ThemedView style={styles.container}>
      <View style={styles.stat}>
        <ThemedText type="default" style={styles.label}>
          FPS:
        </ThemedText>
        <ThemedText type="default" style={styles.value}>
          {fps.toFixed(1)}
        </ThemedText>
      </View>

      <View style={styles.stat}>
        <ThemedText type="default" style={styles.label}>
          Analysis:
        </ThemedText>
        <ThemedText type="default" style={styles.value}>
          {lastAnalysisMs !== null ? `${lastAnalysisMs} ms` : '—'}
        </ThemedText>
      </View>

      <View style={styles.stat}>
        <ThemedText type="default" style={styles.label}>
          Detected:
        </ThemedText>
        <ThemedText type="default" style={styles.value}>
          {detected}
        </ThemedText>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    justifyContent: 'space-around',
  },
  stat: {
    flexDirection: 'row',
    gap: Spacing.one,
  },
  label: {
    fontSize: 12,
    opacity: 0.7,
  },
  value: {
    fontSize: 12,
    fontWeight: '600',
  },
});
