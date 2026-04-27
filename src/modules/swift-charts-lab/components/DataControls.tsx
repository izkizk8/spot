/**
 * T013: DataControls.tsx — US2 dataset mutation controls
 *
 * Themed row of Pressables: Randomize, Add point, Remove point, gradient toggle.
 */

import React from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

export interface DataControlsProps {
  readonly onRandomize: () => void;
  readonly onAdd: () => void;
  readonly addDisabled: boolean;
  readonly onRemove: () => void;
  readonly removeDisabled: boolean;
  readonly gradientEnabled: boolean;
  readonly onToggleGradient: () => void;
}

export function DataControls({
  onRandomize,
  onAdd,
  addDisabled,
  onRemove,
  removeDisabled,
  gradientEnabled,
  onToggleGradient,
}: DataControlsProps) {
  return (
    <ThemedView style={styles.container}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Randomize data"
        onPress={onRandomize}
        style={styles.button}
      >
        <ThemedText style={styles.buttonText}>Randomize</ThemedText>
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Add point"
        accessibilityState={{ disabled: addDisabled }}
        onPress={addDisabled ? undefined : onAdd}
        style={[styles.button, addDisabled && styles.buttonDisabled]}
      >
        <ThemedText style={[styles.buttonText, addDisabled && styles.buttonTextDisabled]}>
          Add point
        </ThemedText>
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Remove point"
        accessibilityState={{ disabled: removeDisabled }}
        onPress={removeDisabled ? undefined : onRemove}
        style={[styles.button, removeDisabled && styles.buttonDisabled]}
      >
        <ThemedText style={[styles.buttonText, removeDisabled && styles.buttonTextDisabled]}>
          Remove point
        </ThemedText>
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Show foreground style ${gradientEnabled ? 'on' : 'off'}`}
        accessibilityState={{ checked: gradientEnabled }}
        onPress={onToggleGradient}
        style={[styles.button, gradientEnabled && styles.buttonActive]}
      >
        <ThemedText style={[styles.buttonText, gradientEnabled && styles.buttonTextActive]}>
          {gradientEnabled ? '✓ Gradient' : 'Gradient'}
        </ThemedText>
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    padding: Spacing.two,
    borderRadius: Spacing.two,
  },
  button: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.one,
    backgroundColor: '#E0E1E6',
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  buttonActive: {
    backgroundColor: '#007AFF',
  },
  buttonText: {
    fontSize: 14,
    color: '#1C1C1E',
  },
  buttonTextDisabled: {
    color: '#8E8E93',
  },
  buttonTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

