import React, { useCallback } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';

import { play } from '../haptic-driver';
import type { HapticIntensity, HapticKind } from '../types';

export interface HapticButtonProps {
  readonly kind: HapticKind;
  readonly intensity?: HapticIntensity;
  readonly label: string;
}

export function HapticButton({ kind, intensity, label }: HapticButtonProps) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const handlePress = useCallback(() => {
    scale.value = withSequence(withTiming(1.08, { duration: 90 }), withTiming(1, { duration: 90 }));
    opacity.value = withSequence(
      withTiming(0.7, { duration: 90 }),
      withTiming(1, { duration: 90 }),
    );
    // Cast accommodates the 3 overloads (kind/intensity coupling enforced at call sites).
    void (play as (k: HapticKind, i?: HapticIntensity) => Promise<void>)(kind, intensity);
  }, [kind, intensity, scale, opacity]);

  return (
    <Animated.View style={[styles.wrapper, animatedStyle]}>
      <Pressable onPress={handlePress} style={styles.pressable} accessibilityRole="button">
        <ThemedText type="smallBold">{label}</ThemedText>
      </Pressable>
    </Animated.View>
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
