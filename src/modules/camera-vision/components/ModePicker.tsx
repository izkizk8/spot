/**
 * Mode Picker component for Camera Vision (feature 017).
 *
 * Four-segment control for selecting the Vision analysis mode.
 */

import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import type { VisionMode } from '../vision-types';

export interface ModePickerProps {
  mode: VisionMode;
  onModeChange: (mode: VisionMode) => void;
  disabled?: boolean;
}

const MODES: Array<{ value: VisionMode; label: string }> = [
  { value: 'faces', label: 'Faces' },
  { value: 'text', label: 'Text' },
  { value: 'barcodes', label: 'Barcodes' },
  { value: 'off', label: 'Off' },
];

export function ModePicker({ mode, onModeChange, disabled = false }: ModePickerProps) {
  return (
    <ThemedView style={styles.container}>
      {MODES.map((m) => (
        <Pressable
          key={m.value}
          style={[
            styles.segment,
            mode === m.value && styles.segmentSelected,
            disabled && styles.segmentDisabled,
          ]}
          onPress={() => {
            if (!disabled) {
              onModeChange(m.value);
            }
          }}
          disabled={disabled}
        >
          <ThemedText
            themeColor={mode === m.value ? 'tintA' : 'text'}
            style={[styles.label, disabled && styles.labelDisabled]}
          >
            {m.label}
          </ThemedText>
        </Pressable>
      ))}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    gap: Spacing.two,
  },
  segment: {
    flex: 1,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.two,
    borderRadius: Spacing.one,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentSelected: {
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
  },
  segmentDisabled: {
    opacity: 0.5,
  },
  label: {
    fontSize: 14,
    textAlign: 'center',
  },
  labelDisabled: {
    opacity: 0.5,
  },
});
