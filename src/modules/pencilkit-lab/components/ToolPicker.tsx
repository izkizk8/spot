/**
 * ToolPicker Component
 * Feature: 082-pencilkit
 *
 * Chip selector for the six PencilKit tool variants.
 */

import React from 'react';
import { Pressable, StyleSheet, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

import type { ToolType } from '@/native/pencilkit.types';

interface ToolPickerProps {
  value: ToolType;
  onChange: (tool: ToolType) => void;
  style?: ViewStyle;
}

const OPTIONS: readonly { id: ToolType; label: string }[] = [
  { id: 'pen', label: 'Pen' },
  { id: 'pencil', label: 'Pencil' },
  { id: 'marker', label: 'Marker' },
  { id: 'crayon', label: 'Crayon' },
  { id: 'eraser', label: 'Eraser' },
  { id: 'lasso', label: 'Lasso' },
];

export default function ToolPicker({ value, onChange, style }: ToolPickerProps) {
  return (
    <ThemedView style={[styles.container, style]}>
      <ThemedText style={styles.title}>Tool</ThemedText>
      <ThemedView style={styles.row}>
        {OPTIONS.map((opt) => {
          const active = opt.id === value;
          return (
            <Pressable
              key={opt.id}
              accessibilityRole="button"
              accessibilityLabel={`Tool ${opt.label}`}
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
