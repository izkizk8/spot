/**
 * FilterPreview Component
 * Feature: 064-core-image
 *
 * Shows the URI of the last applied filter result. On a real device
 * this would be an <Image> — in the showcase we display the URI string
 * and processing time to keep the component test-friendly without
 * requiring a live CIFilter output.
 */
import React from 'react';
import { StyleSheet, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

import type { FilterResult } from '@/native/core-image.types';

interface FilterPreviewProps {
  result: FilterResult | null;
  style?: ViewStyle;
}

export default function FilterPreview({ result, style }: FilterPreviewProps) {
  return (
    <ThemedView style={[styles.container, style]}>
      <ThemedText style={styles.title}>Filter Result</ThemedText>
      {result === null ? (
        <ThemedText style={styles.placeholder}>
          No result yet — select a filter and tap Apply.
        </ThemedText>
      ) : (
        <>
          <ThemedText style={styles.label}>Filter: {result.filterId}</ThemedText>
          <ThemedText style={styles.label} numberOfLines={2} ellipsizeMode="middle">
            URI: {result.outputUri}
          </ThemedText>
          <ThemedText style={styles.label}>
            Processing time: {result.processingTimeMs} ms
          </ThemedText>
        </>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.three,
    gap: Spacing.one,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  placeholder: {
    fontSize: 14,
    opacity: 0.6,
    fontStyle: 'italic',
  },
  label: {
    fontSize: 13,
    opacity: 0.85,
  },
});
