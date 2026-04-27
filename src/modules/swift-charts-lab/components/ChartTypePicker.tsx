/**
 * T008: ChartTypePicker.tsx — US1 chart-type segmented control
 *
 * Four-segment picker: Line / Bar / Area / Point.
 * Follows the themed Pressable row pattern from sensors-playground.
 */

import React from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import type { ChartType } from '../data';
import { CHART_TYPES } from '../data';

export interface ChartTypePickerProps {
  readonly value: ChartType;
  readonly onChange: (next: ChartType) => void;
}

export function ChartTypePicker({ value, onChange }: ChartTypePickerProps) {
  return (
    <ThemedView style={styles.container}>
      {CHART_TYPES.map((type) => {
        const isSelected = value === type;
        const label = type.charAt(0).toUpperCase() + type.slice(1);
        return (
          <Pressable
            key={type}
            accessibilityRole="button"
            accessibilityLabel={`Chart type: ${label}`}
            accessibilityState={{ selected: isSelected }}
            onPress={() => onChange(type)}
            style={[styles.segment, isSelected && styles.segmentSelected]}
          >
            <ThemedText style={[styles.segmentText, isSelected && styles.segmentTextSelected]}>
              {label}
            </ThemedText>
          </Pressable>
        );
      })}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: Spacing.two,
    padding: Spacing.two,
    borderRadius: Spacing.two,
  },
  segment: {
    flex: 1,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.two,
    borderRadius: Spacing.one,
    backgroundColor: '#E0E1E6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentSelected: {
    backgroundColor: '#007AFF',
  },
  segmentText: {
    fontSize: 14,
    color: '#1C1C1E',
  },
  segmentTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
