/**
 * ContentTypePicker — feature 033 / T023.
 *
 * Segmented control over ShareContent kind values.
 */

import React from 'react';
import { Pressable, StyleSheet, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

interface ContentTypePickerProps {
  readonly value: 'text' | 'url' | 'image' | 'file';
  readonly onChange: (next: 'text' | 'url' | 'image' | 'file') => void;
  readonly style?: ViewStyle;
}

const SEGMENTS: ReadonlyArray<{ value: 'text' | 'url' | 'image' | 'file'; label: string }> = [
  { value: 'text', label: 'Text' },
  { value: 'url', label: 'URL' },
  { value: 'image', label: 'Image' },
  { value: 'file', label: 'File' },
];

export default function ContentTypePicker({ value, onChange, style }: ContentTypePickerProps) {
  return (
    <ThemedView style={[styles.container, style]} accessibilityRole='tablist'>
      {SEGMENTS.map((seg) => {
        const selected = seg.value === value;
        return (
          <Pressable
            key={seg.value}
            accessibilityRole='tab'
            accessibilityState={{ selected }}
            onPress={() => onChange(seg.value)}
            style={[styles.segment, selected && styles.segmentSelected]}
          >
            <ThemedText style={[styles.label, selected && styles.labelSelected]}>
              {seg.label}
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
    borderRadius: Spacing.two,
    padding: Spacing.half,
    gap: Spacing.half,
  },
  segment: {
    flex: 1,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.one,
    alignItems: 'center',
  },
  segmentSelected: {
    backgroundColor: '#007AFF',
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
  },
  labelSelected: {
    color: '#fff',
    fontWeight: '600',
  },
});
