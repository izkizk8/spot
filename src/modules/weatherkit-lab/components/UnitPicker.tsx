/**
 * UnitPicker — WeatherKit Lab (feature 046).
 *
 * Three-way segmented control for the WeatherKit unit system:
 * Metric / Imperial / Scientific. Pure presentational + controlled.
 */

import React, { useCallback } from 'react';
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import type { UnitSystem } from '@/native/weatherkit.types';

export const UNIT_OPTIONS: readonly { id: UnitSystem; label: string }[] = Object.freeze([
  { id: 'metric', label: 'Metric' },
  { id: 'imperial', label: 'Imperial' },
  { id: 'scientific', label: 'Scientific' },
]);

interface UnitPickerProps {
  readonly style?: ViewStyle;
  readonly selected: UnitSystem;
  readonly onSelect: (u: UnitSystem) => void;
}

export default function UnitPicker({ style, selected, onSelect }: UnitPickerProps) {
  const handle = useCallback((u: UnitSystem) => () => onSelect(u), [onSelect]);

  return (
    <ThemedView
      style={[styles.container, style]}
      type="backgroundElement"
      testID="weatherkit-unit-picker"
    >
      <ThemedText type="smallBold">Units</ThemedText>
      <View style={styles.row}>
        {UNIT_OPTIONS.map((o) => {
          const isSelected = o.id === selected;
          return (
            <Pressable
              key={o.id}
              onPress={handle(o.id)}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              testID={`weatherkit-unit-${o.id}`}
              style={[styles.button, isSelected && styles.buttonSelected]}
            >
              <ThemedText type={isSelected ? 'smallBold' : 'small'}>{o.label}</ThemedText>
            </Pressable>
          );
        })}
      </View>
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
    gap: Spacing.one,
  },
  button: {
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.two,
    borderRadius: Spacing.one,
  },
  buttonSelected: {
    backgroundColor: 'rgba(120,120,255,0.15)',
  },
});
