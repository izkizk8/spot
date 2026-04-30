/**
 * CounterActivity — SharePlay Lab (feature 047).
 *
 * Live shared-counter demo. Renders the current counter value plus
 * +/- buttons that delegate to the parent (which is responsible
 * for routing the new value through `bridge.sendCounter`). Pure
 * presentational + controlled.
 */

import React, { useCallback } from 'react';
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

interface CounterActivityProps {
  readonly style?: ViewStyle;
  readonly value: number;
  readonly onChange: (next: number) => void;
  readonly disabled?: boolean;
}

export default function CounterActivity({
  style,
  value,
  onChange,
  disabled = false,
}: CounterActivityProps) {
  const decrement = useCallback(() => {
    if (disabled) return;
    onChange(value - 1);
  }, [value, onChange, disabled]);
  const increment = useCallback(() => {
    if (disabled) return;
    onChange(value + 1);
  }, [value, onChange, disabled]);

  return (
    <ThemedView
      style={[styles.container, style]}
      type="backgroundElement"
      testID="shareplay-counter-activity"
    >
      <ThemedText type="smallBold">Shared counter</ThemedText>
      <ThemedText type="title" testID="shareplay-counter-value">
        {value}
      </ThemedText>
      <View style={styles.row}>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled }}
          onPress={decrement}
          disabled={disabled}
          testID="shareplay-counter-minus"
          style={[styles.button, disabled && styles.buttonDisabled]}
        >
          <ThemedText type="smallBold">–</ThemedText>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled }}
          onPress={increment}
          disabled={disabled}
          testID="shareplay-counter-plus"
          style={[styles.button, disabled && styles.buttonDisabled]}
        >
          <ThemedText type="smallBold">+</ThemedText>
        </Pressable>
      </View>
      <ThemedText type="small" themeColor="textSecondary">
        Updates broadcast through GroupSessionMessenger to every participant.
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.three,
    gap: Spacing.two,
    borderRadius: Spacing.two,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  button: {
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.one,
    backgroundColor: 'rgba(120,120,255,0.15)',
    minWidth: 56,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.4,
  },
});
