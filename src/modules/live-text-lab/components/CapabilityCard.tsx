/**
 * CapabilityCard Component
 * Feature: 080-live-text
 *
 * Surfaces which Live Text APIs are available on the current device.
 */

import React from 'react';
import { StyleSheet, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

import type { LiveTextCapabilities } from '@/native/live-text.types';

interface CapabilityCardProps {
  capabilities: LiveTextCapabilities | null;
  style?: ViewStyle;
}

export default function CapabilityCard({ capabilities, style }: CapabilityCardProps) {
  return (
    <ThemedView style={[styles.container, style]}>
      <ThemedText style={styles.title}>Live Text Capability</ThemedText>
      {capabilities === null ? (
        <ThemedText style={styles.help}>Capabilities not loaded yet.</ThemedText>
      ) : (
        <>
          <ThemedText style={styles.help}>iOS {capabilities.osVersion}</ThemedText>
          <ThemedText style={styles.row}>
            Vision OCR (iOS 13+): {capabilities.visionOCR ? '✅' : '❌'}
          </ThemedText>
          <ThemedText style={styles.row}>
            DataScanner (iOS 16+): {capabilities.dataScanner ? '✅' : '❌'}
          </ThemedText>
          <ThemedText style={styles.row}>
            Image Analysis (iOS 16+): {capabilities.imageAnalysis ? '✅' : '❌'}
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
