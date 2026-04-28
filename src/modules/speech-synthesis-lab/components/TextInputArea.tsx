/**
 * TextInputArea — multiline TextInput with optional word-highlight overlay.
 *
 * US1 (T028) provides the baseline (no overlay). US5 (T051) adds the
 * Reanimated highlight overlay that respects `useReducedMotion()`.
 */

import React from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { Spacing } from '@/constants/theme';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useTheme } from '@/hooks/use-theme';

export interface TextInputAreaProps {
  value: string;
  onChangeText: (s: string) => void;
  /** When set, render the highlight overlay over `value[location, location+length)`. */
  currentWordRange?: { location: number; length: number } | null;
  accessibilityLabel?: string;
}

export default function TextInputArea({
  value,
  onChangeText,
  currentWordRange,
  accessibilityLabel = 'Text to speak',
}: TextInputAreaProps) {
  const theme = useTheme();
  const reduced = useReducedMotion();
  const opacity = useSharedValue(0);

  const hasRange = currentWordRange != null && currentWordRange.length > 0;

  React.useEffect(() => {
    if (hasRange) {
      opacity.value = reduced ? 1 : withTiming(1, { duration: 100 });
    } else {
      opacity.value = reduced ? 0 : withTiming(0, { duration: 100 });
    }
  }, [hasRange, reduced, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const highlighted = hasRange
    ? value.substring(currentWordRange!.location, currentWordRange!.location + currentWordRange!.length)
    : '';

  return (
    <View style={styles.container}>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        multiline
        numberOfLines={4}
        textAlignVertical="top"
        accessibilityLabel={accessibilityLabel}
        style={[
          styles.input,
          { color: theme.text, backgroundColor: theme.backgroundElement, borderColor: theme.backgroundSelected },
        ]}
        placeholderTextColor={theme.textSecondary}
        placeholder="Type something to speak..."
      />
      {hasRange ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.overlay,
            { backgroundColor: theme.backgroundSelected },
            animatedStyle,
          ]}
          accessibilityElementsHidden
          // testID kept terse so screen-reader users get the underlying TextInput
          testID="text-input-highlight-overlay"
        >
          <Animated.Text style={[styles.overlayText, { color: theme.text }]}>
            {highlighted}
          </Animated.Text>
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  input: {
    minHeight: 96,
    padding: Spacing.three,
    borderRadius: Spacing.one,
    borderWidth: 1,
    fontSize: 16,
    lineHeight: 22,
  },
  overlay: {
    position: 'absolute',
    top: Spacing.two,
    left: Spacing.three,
    paddingHorizontal: Spacing.one,
    borderRadius: Spacing.half,
    opacity: 0,
  },
  overlayText: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600',
  },
});
