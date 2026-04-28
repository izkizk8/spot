/**
 * Predictions Chart component for CoreML Lab (feature 016).
 *
 * Displays top-N predictions as animated horizontal bars, sorted descending
 * by confidence. Uses react-native-reanimated for smooth animations with
 * reduced-motion support.
 */

import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  useReducedMotion,
} from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { Prediction } from '@/native/coreml.types';

export interface PredictionsChartProps {
  predictions: Prediction[];
}

function PredictionBar({
  prediction,
  maxConfidence,
}: {
  prediction: Prediction;
  maxConfidence: number;
}) {
  const theme = useTheme();
  const reducedMotion = useReducedMotion();
  const widthProgress = useSharedValue(0);

  useEffect(() => {
    widthProgress.value = reducedMotion
      ? prediction.confidence / maxConfidence
      : withTiming(prediction.confidence / maxConfidence, { duration: 300 });
  }, [prediction.confidence, maxConfidence, reducedMotion, widthProgress]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${widthProgress.value * 100}%`,
  }));

  const percentage = (prediction.confidence * 100).toFixed(1);

  return (
    <ThemedView style={styles.barContainer}>
      <ThemedView style={styles.barLabelRow}>
        <ThemedText type="small" style={styles.barLabel} numberOfLines={1}>
          {prediction.label}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.barPercentage}>
          {percentage}%
        </ThemedText>
      </ThemedView>
      <ThemedView style={styles.barTrack}>
        <Animated.View style={[styles.barFill, { backgroundColor: theme.tintA }, animatedStyle]} />
      </ThemedView>
    </ThemedView>
  );
}

export function PredictionsChart({ predictions }: PredictionsChartProps) {
  if (predictions.length === 0) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText type="small" themeColor="textSecondary" style={styles.emptyState}>
          No predictions yet. Pick an image and run inference.
        </ThemedText>
      </ThemedView>
    );
  }

  const maxConfidence = predictions.length > 0 ? predictions[0].confidence : 1;

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="subtitle" style={styles.title}>
        Top Predictions
      </ThemedText>
      {predictions.slice(0, 5).map((pred, idx) => (
        <PredictionBar
          key={`${pred.label}-${idx}`}
          prediction={pred}
          maxConfidence={maxConfidence}
        />
      ))}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
  },
  title: {
    marginBottom: Spacing.two,
  },
  emptyState: {
    textAlign: 'center',
    paddingVertical: Spacing.four,
  },
  barContainer: {
    marginBottom: Spacing.two,
  },
  barLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.half,
  },
  barLabel: {
    flex: 1,
  },
  barPercentage: {
    marginLeft: Spacing.two,
  },
  barTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
});
