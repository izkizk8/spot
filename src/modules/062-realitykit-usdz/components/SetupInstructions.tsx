/**
 * SetupInstructions Component
 * Feature: 062-realitykit-usdz
 *
 * Informational card about native RealityKit requirements.
 */
import React from 'react';
import { StyleSheet, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

interface SetupInstructionsProps {
  style?: ViewStyle;
}

export default function SetupInstructions({ style }: SetupInstructionsProps) {
  return (
    <ThemedView style={[styles.card, style]}>
      <ThemedText style={styles.heading}>Setup Instructions</ThemedText>
      <ThemedText style={styles.body}>
        AR Quick Look requires iOS 13+ and an ARKit-capable device. No extra entitlements are needed
        — the system presents USDZ files via QLPreviewController automatically.
      </ThemedText>
      <ThemedText style={styles.body}>
        USDZ files can be bundled in the app or downloaded from a URL. This demo uses named models
        resolved by the native bridge.
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: Spacing.three,
    borderRadius: 12,
    gap: Spacing.two,
  },
  heading: {
    fontSize: 17,
    fontWeight: '600',
  },
  body: {
    fontSize: 14,
    opacity: 0.8,
    lineHeight: 20,
  },
});
