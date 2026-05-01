/**
 * LocationPicker — WeatherKit Lab (feature 046).
 *
 * Lets the user pick a preset city from the frozen catalog. Pure
 * presentational + controlled: the parent owns the selected id.
 */

import React, { useCallback } from 'react';
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

import { PRESET_CITIES, type PresetCity } from '../preset-cities';

interface LocationPickerProps {
  readonly style?: ViewStyle;
  readonly selectedCityId: string;
  readonly onSelect: (id: string) => void;
}

export default function LocationPicker({ style, selectedCityId, onSelect }: LocationPickerProps) {
  const handleSelect = useCallback((id: string) => () => onSelect(id), [onSelect]);

  return (
    <ThemedView
      style={[styles.container, style]}
      type='backgroundElement'
      testID='weatherkit-location-picker'
    >
      <ThemedText type='smallBold'>Location</ThemedText>
      <ThemedText type='small' themeColor='textSecondary'>
        Pick a preset city to fetch a live WeatherKit forecast.
      </ThemedText>
      <View style={styles.list}>
        {PRESET_CITIES.map((c: PresetCity) => {
          const selected = c.id === selectedCityId;
          return (
            <Pressable
              key={c.id}
              onPress={handleSelect(c.id)}
              accessibilityRole='button'
              accessibilityState={{ selected }}
              testID={`weatherkit-city-${c.id}`}
              style={[styles.row, selected && styles.rowSelected]}
            >
              <ThemedText type='smallBold'>{c.label}</ThemedText>
              <ThemedText type='small' themeColor='textSecondary'>
                {c.country} · {c.latitude.toFixed(2)}, {c.longitude.toFixed(2)}
              </ThemedText>
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
  list: {
    gap: Spacing.one,
  },
  row: {
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.two,
    borderRadius: Spacing.one,
  },
  rowSelected: {
    backgroundColor: 'rgba(120,120,255,0.15)',
  },
});
