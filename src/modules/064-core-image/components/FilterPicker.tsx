/**
 * FilterPicker Component
 * Feature: 064-core-image
 *
 * Horizontal row of tappable chips — one per filter in the catalog.
 */
import React from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

import type { FilterId } from '@/native/core-image.types';
import { FILTER_CATALOG } from '../filter-types';

interface FilterPickerProps {
  value: FilterId;
  onChange: (id: FilterId) => void;
  style?: ViewStyle;
}

export default function FilterPicker({ value, onChange, style }: FilterPickerProps) {
  return (
    <ThemedView style={[styles.container, style]}>
      <ThemedText style={styles.label}>Filter</ThemedText>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scroll}>
        {FILTER_CATALOG.map((filter) => {
          const active = filter.id === value;
          return (
            <TouchableOpacity
              key={filter.id}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => onChange(filter.id)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
            >
              <ThemedText style={[styles.chipText, active && styles.chipTextActive]}>
                {filter.name}
              </ThemedText>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.three,
    gap: Spacing.two,
  },
  label: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  scroll: {
    flexGrow: 0,
  },
  chip: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(128,128,128,0.4)',
    marginRight: Spacing.two,
  },
  chipActive: {
    backgroundColor: 'rgba(0,122,255,0.15)',
    borderColor: 'rgba(0,122,255,0.8)',
  },
  chipText: {
    fontSize: 14,
  },
  chipTextActive: {
    fontWeight: '600',
  },
});
