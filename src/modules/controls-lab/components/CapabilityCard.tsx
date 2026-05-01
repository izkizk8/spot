/**
 * CapabilityCard Component
 * Feature: 087-controls
 *
 * Surfaces which Control Center APIs are available on the current device.
 */
import React from 'react';
import { StyleSheet, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

import type { ControlsCapabilities } from '@/native/controls.types';

interface CapabilityCardProps {
  capabilities: ControlsCapabilities | null;
  style?: ViewStyle;
}

export default function CapabilityCard({ capabilities, style }: CapabilityCardProps) {
  return (
    <ThemedView style={[styles.container, style]}>
      <ThemedText style={styles.title}>Controls Capability</ThemedText>
      {capabilities === null ? (
        <ThemedText style={styles.help}>Capabilities not loaded yet.</ThemedText>
      ) : (
        <>
          <ThemedText style={styles.help}>iOS {capabilities.osVersion}</ThemedText>
          <ThemedText style={styles.row}>
            ControlWidget (iOS 18+): {capabilities.controlWidget ? '✅' : '❌'}
          </ThemedText>
          <ThemedText style={styles.row}>
            ControlValueProvider (iOS 18+): {capabilities.valueProvider ? '✅' : '❌'}
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
  row: {
    fontSize: 14,
  },
  help: {
    fontSize: 14,
    opacity: 0.8,
  },
});
