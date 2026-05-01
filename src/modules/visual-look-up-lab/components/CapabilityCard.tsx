/**
 * CapabilityCard Component
 * Feature: 060-visual-look-up
 *
 * Surfaces VisionKit Visual Look Up availability status and the
 * most recently analysed image URI.
 */

import React from 'react';
import { StyleSheet, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

interface CapabilityCardProps {
  supported: boolean | null;
  lastImageUri: string | null;
  style?: ViewStyle;
}

export default function CapabilityCard({ supported, lastImageUri, style }: CapabilityCardProps) {
  return (
    <ThemedView style={[styles.container, style]}>
      <ThemedText style={styles.title}>Visual Look Up Capability</ThemedText>
      {supported === null ? (
        <ThemedText style={styles.help}>Support status not checked yet.</ThemedText>
      ) : supported ? (
        <>
          <ThemedText style={styles.value}>Supported</ThemedText>
          <ThemedText style={styles.help}>
            VisionKit ImageAnalysisInteraction is available on this device.
          </ThemedText>
        </>
      ) : (
        <ThemedText style={styles.help}>
          Visual Look Up requires iOS 15 or later and is unavailable on this device.
        </ThemedText>
      )}
      {lastImageUri !== null && (
        <ThemedText style={styles.uri} numberOfLines={1}>
          Last image: {lastImageUri}
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
  uri: {
    fontSize: 12,
    opacity: 0.6,
  },
});
