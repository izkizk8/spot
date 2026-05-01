/**
 * Model Picker component for CoreML Lab (feature 016).
 *
 * Displays the available models from the registry. V1 contains only
 * MobileNetV2; future models can be added without screen-side changes.
 */

import React from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import type { ModelDescriptor } from '../model-registry';

export interface ModelPickerProps {
  models: readonly ModelDescriptor[];
  selectedModelId: string;
  onSelect: (modelId: string) => void;
}

export function ModelPicker({ models, selectedModelId, onSelect }: ModelPickerProps) {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type='subtitle' style={styles.label}>
        Model
      </ThemedText>
      {models.map((model) => (
        <Pressable
          key={model.name}
          style={[styles.option, model.name === selectedModelId && styles.optionSelected]}
          onPress={() => onSelect(model.name)}
        >
          <ThemedText
            themeColor={model.name === selectedModelId ? 'tintA' : 'text'}
            style={styles.optionText}
          >
            {model.displayName}
          </ThemedText>
        </Pressable>
      ))}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
  },
  label: {
    marginBottom: Spacing.two,
  },
  option: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.one,
  },
  optionSelected: {
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
  },
  optionText: {
    fontSize: 16,
  },
});
