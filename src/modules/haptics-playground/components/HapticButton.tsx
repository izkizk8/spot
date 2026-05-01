import React, { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { Keyframe } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';

import { play } from '../haptic-driver';
import type { HapticIntensity, HapticKind } from '../types';

export interface HapticButtonProps {
  readonly kind: HapticKind;
  readonly intensity?: HapticIntensity;
  readonly label: string;
}

const pulseKeyframe = new Keyframe({
  0: { transform: [{ scale: 1 }], opacity: 1 },
  50: { transform: [{ scale: 1.08 }], opacity: 0.7 },
  100: { transform: [{ scale: 1 }], opacity: 1 },
});

export function HapticButton({ kind, intensity, label }: HapticButtonProps) {
  const [pulseKey, setPulseKey] = useState(0);

  const handlePress = useCallback(() => {
    setPulseKey((k) => k + 1);
    void (play as (k: HapticKind, i?: HapticIntensity) => Promise<void>)(kind, intensity);
  }, [kind, intensity]);

  return (
    <View style={styles.wrapper}>
      <Animated.View key={pulseKey} entering={pulseKeyframe.duration(180)}>
        <Pressable onPress={handlePress} style={styles.pressable} accessibilityRole='button'>
          <ThemedText type='smallBold'>{label}</ThemedText>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    margin: Spacing.one,
  },
  pressable: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.two,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(127,127,127,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  },
});
