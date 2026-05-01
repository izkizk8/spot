/**
 * DrawingCanvas Component
 * Feature: 082-pencilkit
 *
 * Educational placeholder for the native PKCanvasView surface. The
 * real PKCanvasView is a UIKit view hosted by the iOS module — this
 * placeholder shows where the canvas would render in the JS tree and
 * surfaces the live stroke count.
 */

import React from 'react';
import { StyleSheet, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

import type { DrawingStats } from '@/native/pencilkit.types';

interface DrawingCanvasProps {
  stats: DrawingStats;
  style?: ViewStyle;
}

export default function DrawingCanvas({ stats, style }: DrawingCanvasProps) {
  return (
    <ThemedView style={[styles.container, style]}>
      <ThemedText style={styles.title}>Canvas</ThemedText>
      <ThemedView style={styles.canvas} accessibilityLabel='PencilKit drawing canvas placeholder'>
        <ThemedText style={styles.canvasIcon}>✏️</ThemedText>
        <ThemedText style={styles.canvasHeading}>Apple Pencil drawing canvas</ThemedText>
        <ThemedText style={styles.canvasHint}>
          Draw here with Apple Pencil or finger. The native PKCanvasView is hosted by the iOS
          module.
        </ThemedText>
        <ThemedText style={styles.canvasMeta}>Strokes: {stats.strokeCount}</ThemedText>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.three,
    gap: Spacing.two,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  canvas: {
    minHeight: 220,
    borderWidth: 1,
    borderColor: '#CCCCCC',
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
  },
  canvasIcon: {
    fontSize: 36,
  },
  canvasHeading: {
    fontSize: 15,
    fontWeight: '600',
  },
  canvasHint: {
    fontSize: 13,
    opacity: 0.75,
    textAlign: 'center',
  },
  canvasMeta: {
    fontSize: 13,
    opacity: 0.85,
    marginTop: Spacing.one,
  },
});
