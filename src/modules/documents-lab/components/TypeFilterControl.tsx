/**
 * TypeFilterControl — feature 032 / T036.
 *
 * Segmented control over DocumentFilter values.
 */

import React from 'react';
import { Pressable, StyleSheet, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

import type { DocumentFilter } from '../mime-types';

interface TypeFilterControlProps {
  readonly value: DocumentFilter;
  readonly onChange: (next: DocumentFilter) => void;
  readonly style?: ViewStyle;
}

const SEGMENTS: ReadonlyArray<{ value: DocumentFilter; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'images', label: 'Images' },
  { value: 'text', label: 'Text' },
  { value: 'pdf', label: 'PDF' },
];

export default function TypeFilterControl({ value, onChange, style }: TypeFilterControlProps) {
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
