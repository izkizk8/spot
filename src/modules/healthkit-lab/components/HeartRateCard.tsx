/**
 * HeartRateCard — HealthKit Lab (feature 043).
 *
 * Shows the most-recent heart-rate sample, a 24h sparkline rendered
 * with plain RN Views (one bar per sample, height proportional to the
 * sample value), and a "Add manual reading" button that pushes a
 * synthetic 72bpm sample through the hook.
 */

import React, { useCallback } from 'react';
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import type { HeartRateSample } from '../sample-types';

interface HeartRateCardProps {
  readonly samples: readonly HeartRateSample[];
  readonly latest: HeartRateSample | null;
  readonly onAddManualReading: (bpm: number) => void;
  readonly style?: ViewStyle;
}

const MANUAL_BPM = 72;

export default function HeartRateCard({
  samples,
  latest,
  onAddManualReading,
  style,
}: HeartRateCardProps) {
  const theme = useTheme();

  const handleAdd = useCallback(() => {
    onAddManualReading(MANUAL_BPM);
  }, [onAddManualReading]);

  let peak = 0;
  for (const s of samples) {
    if (Number.isFinite(s.bpm) && s.bpm > peak) peak = s.bpm;
  }

  return (
    <ThemedView style={[styles.container, style]} testID='healthkit-hr-card'>
      <ThemedText style={styles.heading}>Heart rate</ThemedText>
      {latest !== null ? (
        <View testID='healthkit-hr-latest'>
          <ThemedText style={styles.bigValue}>
            {latest.bpm}
            <ThemedText type='small' themeColor='textSecondary'>
              {' '}
              bpm
            </ThemedText>
          </ThemedText>
          <ThemedText type='small' themeColor='textSecondary'>
            {latest.timestamp}
          </ThemedText>
        </View>
      ) : (
        <ThemedText type='small' themeColor='textSecondary' testID='healthkit-hr-empty'>
          No heart-rate samples in the last 24 hours.
        </ThemedText>
      )}
      <View style={styles.sparkline} testID='healthkit-hr-sparkline'>
        {samples.map((s, i) => {
          const heightPct = peak > 0 ? Math.max(4, (s.bpm / peak) * 100) : 0;
          return (
            <View
              key={`${s.timestamp}-${i}`}
              testID={`healthkit-hr-bar-${i}`}
              style={[styles.bar, { height: `${heightPct}%` }]}
            />
          );
        })}
      </View>
      <Pressable
        testID='healthkit-hr-manual-btn'
        onPress={handleAdd}
        style={[styles.cta, { backgroundColor: theme.tintA }]}
      >
        <ThemedText type='smallBold' themeColor='background'>
          Add manual reading ({MANUAL_BPM} bpm)
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
  bigValue: {
    fontSize: 32,
    fontWeight: '700',
  },
  sparkline: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 48,
    gap: 2,
    marginTop: Spacing.one,
  },
  bar: {
    flex: 1,
    backgroundColor: '#FF2D55',
    borderRadius: 1,
  },
  cta: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.one,
    alignItems: 'center',
    marginTop: Spacing.two,
  },
});
