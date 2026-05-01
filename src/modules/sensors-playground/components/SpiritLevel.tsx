/**
 * @file SpiritLevel.tsx
 * @description Inner disc translates from pitch (Y) and roll (X), clamped to outer-ring radius.
 */
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedView } from '@/components/themed-view';

export interface SpiritLevelProps {
  /** Pitch in radians. */
  pitch: number;
  /** Roll in radians. */
  roll: number;
}

const OUTER = 64;
const INNER = 16;
/** Maximum translation = (OUTER - INNER)/2 so the disc cannot exit the ring. */
const MAX_OFFSET = (OUTER - INNER) / 2;
/** π/4 maps to full deflection. */
const FULL_TILT = Math.PI / 4;

function clamp(v: number, min: number, max: number): number {
  if (v < min) return min;
  if (v > max) return max;
  return v;
}

export function SpiritLevel({ pitch, roll }: SpiritLevelProps) {
  // roll → translateX, pitch → translateY (positive pitch tilts forward = disc moves down).
  const tx = clamp((roll / FULL_TILT) * MAX_OFFSET, -MAX_OFFSET, MAX_OFFSET);
  const ty = clamp((pitch / FULL_TILT) * MAX_OFFSET, -MAX_OFFSET, MAX_OFFSET);
  return (
    <ThemedView style={styles.ring} testID='spirit-level'>
      <View
        testID='spirit-level-disc'
        style={[styles.disc, { transform: [{ translateX: tx }, { translateY: ty }] }]}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  ring: {
    width: OUTER,
    height: OUTER,
    borderRadius: OUTER / 2,
    borderWidth: 1,
    borderColor: '#B0B4BA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  disc: {
    width: INNER,
    height: INNER,
    borderRadius: INNER / 2,
    backgroundColor: '#007AFF',
  },
});

export const __TEST_ONLY__ = { MAX_OFFSET, FULL_TILT };
