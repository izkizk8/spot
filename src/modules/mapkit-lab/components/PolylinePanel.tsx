import React from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface PolylinePanelProps {
  hasPolyline: boolean;
  onDraw: () => void;
  onClear: () => void;
}

export function PolylinePanel({ hasPolyline, onDraw, onClear }: PolylinePanelProps) {
  const theme = useTheme();
  const clearDisabled = !hasPolyline;

  return (
    <ThemedView style={styles.container}>
      <Pressable
        accessibilityRole='button'
        onPress={onDraw}
        testID='polyline-draw-button'
        style={[styles.button, { backgroundColor: theme.tintA }]}
      >
        <ThemedText type='smallBold' style={{ color: '#ffffff' }}>
          Draw sample loop
        </ThemedText>
      </Pressable>

      <Pressable
        accessibilityRole='button'
        accessibilityState={{ disabled: clearDisabled }}
        disabled={clearDisabled}
        onPress={onClear}
        testID='polyline-clear-button'
        style={[
          styles.button,
          {
            backgroundColor: theme.backgroundElement,
            opacity: clearDisabled ? 0.5 : 1,
          },
        ]}
      >
        <ThemedText
          type='smallBold'
          style={{ color: clearDisabled ? theme.textSecondary : theme.text }}
        >
          Clear
        </ThemedText>
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.three,
    gap: Spacing.three,
  },
  button: {
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.two,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
