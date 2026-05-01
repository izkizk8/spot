/**
 * MicButton — large round mic toggle (US1, T035).
 *
 * - Idle: static mic icon
 * - Listening (no reduced-motion): subtle scale + opacity pulse via reanimated
 * - Listening (reduced-motion): static "active" indicator (NFR-005, FR-006)
 * - accessibilityRole="button" + accessibilityState={ disabled, selected: listening } (NFR-004)
 */

import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useReducedMotion } from '@/hooks/useReducedMotion';

export interface MicButtonProps {
  listening: boolean;
  disabled?: boolean;
  onPress: () => void;
}

export default function MicButton({ listening, disabled = false, onPress }: MicButtonProps) {
  const reduced = useReducedMotion();
  const scale = useSharedValue(1);

  React.useEffect(() => {
    if (listening && !reduced) {
      scale.value = withTiming(1.08, { duration: 600 });
    } else {
      scale.value = withTiming(1, { duration: 200 });
    }
  }, [listening, reduced, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    if (disabled) return;
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      accessibilityRole='button'
      accessibilityLabel={listening ? 'Stop microphone' : 'Start microphone'}
      accessibilityState={{ disabled, selected: listening }}
      style={styles.pressable}
    >
      <Animated.View
        style={[
          styles.button,
          listening && styles.buttonListening,
          disabled && styles.buttonDisabled,
          listening && reduced && styles.buttonStaticActive,
          animatedStyle,
        ]}
      >
        <ThemedText type='title' themeColor={listening ? 'background' : 'text'} style={styles.icon}>
          {listening ? '■' : '●'}
        </ThemedText>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.three,
  },
  button: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E5E5EA',
  },
  buttonListening: {
    backgroundColor: '#FF3B30',
  },
  buttonStaticActive: {
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  icon: {
    fontSize: 32,
    lineHeight: 36,
  },
});
