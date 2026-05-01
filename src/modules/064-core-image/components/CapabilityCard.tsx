/**
 * CapabilityCard Component
 * Feature: 064-core-image
 *
 * Surfaces CoreImage availability and the total CIFilter count
 * registered on the device.
 */
import React from 'react';
import { StyleSheet, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

import type { CICapabilities } from '@/native/core-image.types';

interface CapabilityCardProps {
  capabilities: CICapabilities | null;
  style?: ViewStyle;
}

export default function CapabilityCard({ capabilities, style }: CapabilityCardProps) {
  return (
    <ThemedView style={[styles.container, style]}>
      <ThemedText style={styles.title}>Core Image Capability</ThemedText>
      {capabilities === null ? (
        <ThemedText style={styles.help}>Capability info not loaded yet.</ThemedText>
      ) : capabilities.available ? (
        <>
          <ThemedText style={styles.value}>Available</ThemedText>
          <ThemedText style={styles.help}>
            Device filter count: {capabilities.filterCount}
          </ThemedText>
          <ThemedText style={styles.help}>
            Module filters: {capabilities.supportedFilters.join(', ')}
          </ThemedText>
        </>
      ) : (
        <ThemedText style={styles.help}>
          Core Image is unavailable on this device — requires iOS 13 or later.
        </ThemedText>
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
  value: {
    fontSize: 16,
    fontWeight: '600',
  },
  help: {
    fontSize: 14,
    opacity: 0.8,
  },
});
