/**
 * DrawingStats Component
 * Feature: 082-pencilkit
 *
 * Surfaces stroke count, serialized data length, and bounding-box
 * dimensions for the current PKDrawing.
 */

import React from 'react';
import { StyleSheet, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

import type { DrawingStats as DrawingStatsType } from '@/native/pencilkit.types';

interface DrawingStatsProps {
  stats: DrawingStatsType;
  style?: ViewStyle;
}

export default function DrawingStats({ stats, style }: DrawingStatsProps) {
  return (
    <ThemedView style={[styles.container, style]}>
      <ThemedText style={styles.title}>Drawing Stats</ThemedText>
      <ThemedText style={styles.row}>Strokes {stats.strokeCount}</ThemedText>
      <ThemedText style={styles.row}>Data length {stats.dataLength} bytes</ThemedText>
      <ThemedText style={styles.row}>
        Bounds {Math.round(stats.boundingWidth)} × {Math.round(stats.boundingHeight)} pt
      </ThemedText>
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
});
