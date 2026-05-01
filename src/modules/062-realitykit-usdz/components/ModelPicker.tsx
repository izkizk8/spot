/**
 * ModelPicker Component
 * Feature: 062-realitykit-usdz
 *
 * Lets the user select which bundled USDZ model to preview in AR.
 */
import React from 'react';
import { StyleSheet, TouchableOpacity, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

import type { ModelName } from '@/native/realitykit-usdz.types';

export const MODEL_CATALOG: ReadonlyArray<{ id: ModelName; label: string; emoji: string }> = [
  { id: 'toy_drummer', label: 'Toy Drummer', emoji: '🥁' },
  { id: 'toy_biplane', label: 'Toy Biplane', emoji: '✈️' },
  { id: 'gramophone', label: 'Gramophone', emoji: '🎙️' },
];

interface ModelPickerProps {
  value: ModelName;
  onChange: (id: ModelName) => void;
  style?: ViewStyle;
}

export default function ModelPicker({ value, onChange, style }: ModelPickerProps) {
  return (
    <ThemedView style={[styles.card, style]}>
      <ThemedText style={styles.heading}>Select Model</ThemedText>
      {MODEL_CATALOG.map((model) => (
        <TouchableOpacity
          key={model.id}
          style={[styles.option, value === model.id && styles.selected]}
          onPress={() => onChange(model.id)}
          accessibilityRole='radio'
          accessibilityState={{ checked: value === model.id }}
        >
          <ThemedText style={styles.optionText}>
            {model.emoji} {model.label}
          </ThemedText>
        </TouchableOpacity>
      ))}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: Spacing.three,
    borderRadius: 12,
    gap: Spacing.one,
  },
  heading: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: Spacing.one,
  },
  option: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.two,
    borderRadius: 8,
  },
  selected: {
    opacity: 0.6,
  },
  optionText: {
    fontSize: 15,
  },
});
