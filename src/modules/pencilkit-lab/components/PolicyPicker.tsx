/**
 * PolicyPicker Component
 * Feature: 082-pencilkit
 *
 * Chip selector for the three PKCanvasView.drawingPolicy values.
 */

import React from 'react';
import { Pressable, StyleSheet, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

import type { DrawingPolicy } from '@/native/pencilkit.types';

interface PolicyPickerProps {
  value: DrawingPolicy;
  onChange: (policy: DrawingPolicy) => void;
  style?: ViewStyle;
}

const OPTIONS: readonly { id: DrawingPolicy; label: string }[] = [
  { id: 'default', label: 'Default' },
  { id: 'anyInput', label: 'Any Input' },
  { id: 'pencilOnly', label: 'Pencil Only' },
];

export default function PolicyPicker({ value, onChange, style }: PolicyPickerProps) {
  return (
    <ThemedView style={[styles.container, style]}>
      <ThemedText style={styles.title}>Drawing Policy</ThemedText>
      <ThemedView style={styles.row}>
        {OPTIONS.map((opt) => {
          const active = opt.id === value;
          return (
            <Pressable
              key={opt.id}
              accessibilityRole='button'
              accessibilityLabel={`Policy ${opt.label}`}
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
