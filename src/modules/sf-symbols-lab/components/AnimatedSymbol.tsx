/**
 * @file AnimatedSymbol.tsx
 * @description Single test seam wrapping expo-symbols' SymbolView (T009)
 * Per contracts/animated-symbol.md.
 */

import React, { useEffect } from 'react';
import { Platform, StyleSheet, Text } from 'react-native';
import Reanimated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import type { AnimatedSymbolProps } from '../types';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

/**
 * AnimatedSymbol - the single component in this module that imports expo-symbols.
 * Wraps SymbolView with per-effect mapping and cross-platform fallback.
 */
export function AnimatedSymbol(props: AnimatedSymbolProps): JSX.Element {
  const {
    name,
    secondaryName,
    effect,
    speed,
    repeat,
    tintColor,
    size,
    playToken,
  } = props;

  // Non-iOS fallback: plain text glyph
  if (Platform.OS !== 'ios') {
    return (
      <ThemedView style={styles.fallbackContainer}>
        <Text
          style={[
            styles.fallbackText,
            { color: tintColor, fontSize: size * 0.5 },
          ]}
        >
          {name}
        </Text>
      </ThemedView>
    );
  }

  // iOS: Import SymbolView dynamically at render time
  const { SymbolView } = require('expo-symbols');

  // Build animationSpec based on effect and playToken
  const animationSpec = playToken > 0 ? buildAnimationSpec(effect, speed, repeat) : undefined;

  // Emulated effects: Replace, Appear, Disappear use Reanimated
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (playToken === 0) {
      opacity.value = 1;
      return;
    }

    if (effect === 'appear') {
      opacity.value = 0;
      opacity.value = withTiming(1, { duration: 250 });
    } else if (effect === 'disappear') {
      opacity.value = 1;
      opacity.value = withTiming(0, { duration: 250 });
    } else if (effect === 'replace' && secondaryName) {
      // Crossfade: 1 -> 0 (100ms), swap name, 0 -> 1 (100ms)
      opacity.value = withTiming(0, { duration: 100 });
      setTimeout(() => {
        opacity.value = withTiming(1, { duration: 100 });
      }, 100);
    }
  }, [playToken, effect, secondaryName, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  // For Replace effect, use secondaryName after crossfade
  const displayName = effect === 'replace' && secondaryName && playToken > 0 
    ? secondaryName 
    : name;

  return (
    <Reanimated.View style={[styles.container, animatedStyle]}>
      <SymbolView
        name={displayName}
        tintColor={tintColor}
        size={size}
        animationSpec={animationSpec}
      />
    </Reanimated.View>
  );
}

/**
 * Build animationSpec per contracts/animated-symbol.md mapping table.
 */
function buildAnimationSpec(
  effect: AnimatedSymbolProps['effect'],
  speed: AnimatedSymbolProps['speed'],
  repeat: AnimatedSymbolProps['repeat'],
) {
  const speedValue = speed === 'slow' ? 0.5 : speed === 'fast' ? 2.0 : 1.0;
  const repeating = repeat !== 'once';
  const repeatCount = repeat === 'thrice' ? 3 : undefined;

  // Emulated effects (Replace, Appear, Disappear) don't pass animationSpec
  if (effect === 'replace' || effect === 'appear' || effect === 'disappear') {
    return undefined;
  }

  // Variable Color uses variableAnimationSpec instead of effect
  if (effect === 'variable-color') {
    return {
      variableAnimationSpec: {
        iterative: true,
        reversing: true,
      },
      repeating,
      repeatCount,
      speed: speedValue,
    };
  }

  // Bounce, Pulse, Scale use native AnimationType
  return {
    effect: {
      type: effect, // 'bounce' | 'pulse' | 'scale'
    },
    repeating,
    repeatCount,
    speed: speedValue,
  };
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.three,
  },
  fallbackText: {
    fontWeight: '600',
    textAlign: 'center',
  },
});
