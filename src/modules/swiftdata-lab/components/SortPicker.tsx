/**
 * SortPicker Component
 * Feature: 053-swiftdata
 *
 * Segmented control for the three task sort modes.
 */

import React from 'react';
import { Pressable, StyleSheet, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

import type { TaskSort } from '@/native/swiftdata.types';

interface SortPickerProps {
  value: TaskSort;
  onChange: (sort: TaskSort) => void;
  style?: ViewStyle;
}

const OPTIONS: readonly { id: TaskSort; label: string }[] = [
  { id: 'created', label: 'Created' },
  { id: 'priority', label: 'Priority' },
  { id: 'dueDate', label: 'Due date' },
];

export default function SortPicker({ value, onChange, style }: SortPickerProps) {
  return (
    <ThemedView style={[styles.container, style]}>
      <ThemedText style={styles.title}>Sort</ThemedText>
      <ThemedView style={styles.row}>
        {OPTIONS.map((opt) => {
          const active = opt.id === value;
          return (
            <Pressable
              key={opt.id}
              accessibilityRole='button'
              accessibilityLabel={`Sort by ${opt.label}`}
              accessibilityState={{ selected: active }}
              onPress={() => onChange(opt.id)}
              style={[styles.chip, active && styles.chipActive]}
            >
              <ThemedText style={[styles.chipText, active && styles.chipTextActive]}>
                {opt.label}
              </ThemedText>
            </Pressable>
          );
        })}
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.three,
    gap: Spacing.two,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  chip: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#CCCCCC',
  },
  chipActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
});
