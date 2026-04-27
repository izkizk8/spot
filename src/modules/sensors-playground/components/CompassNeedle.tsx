/**
 * @file CompassNeedle.tsx
 * @description Needle rotated to atan2(y, x). Holds previous angle when |xy| < ε.
 */
import React, { useRef } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

export interface CompassNeedleProps {
  x: number;
  y: number;
}

const EPSILON = 1e-3;

export function CompassNeedle({ x, y }: CompassNeedleProps) {
  const lastAngleRef = useRef(0);
  const magnitude = Math.sqrt(x * x + y * y);
  let angle = lastAngleRef.current;
  if (magnitude >= EPSILON) {
    angle = (Math.atan2(y, x) * 180) / Math.PI;
    lastAngleRef.current = angle;
  }
  return (
    <ThemedView style={styles.ring} testID="compass-needle">
      <View
        testID="compass-needle-inner"
        style={[styles.needle, { transform: [{ rotate: `${angle}deg` }] }]}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  ring: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: '#B0B4BA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  needle: {
    width: 4,
    height: 28,
    backgroundColor: '#FF9500',
    borderRadius: Spacing.half,
  },
});
