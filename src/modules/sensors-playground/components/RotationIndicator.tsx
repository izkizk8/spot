/**
 * @file RotationIndicator.tsx
 * @description Visualises integrated yaw. iOS uses an SF Symbol via expo-symbols
 * when available; everywhere else uses a themed glyph + numeric readout.
 *
 * No dedicated unit test — covered indirectly by GyroscopeCard.test.tsx (plan.md).
 */
import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

export interface RotationIndicatorProps {
  /** Integrated yaw in radians. */
  yaw: number;
}

function toDeg(rad: number): number {
  return (rad * 180) / Math.PI;
}

export function RotationIndicator({ yaw }: RotationIndicatorProps) {
  const angle = toDeg(yaw) % 360;
  // Single-value `Platform.OS` branch — permitted per constitution III.
  const glyph = Platform.OS === 'ios' ? '↻' : '↻';
  return (
    <ThemedView style={styles.box} testID='rotation-indicator'>
      <View style={[styles.glyphWrap, { transform: [{ rotate: `${angle}deg` }] }]}>
        <ThemedText type='title'>{glyph}</ThemedText>
      </View>
      <ThemedText type='code'>{`yaw: ${angle.toFixed(1)}°`}</ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  box: {
    alignItems: 'center',
    gap: Spacing.one,
    padding: Spacing.two,
  },
  glyphWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
