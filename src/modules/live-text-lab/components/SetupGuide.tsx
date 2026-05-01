/**
 * SetupGuide Component
 * Feature: 080-live-text
 *
 * Setup and educational notes for the Live Text lab.
 */

import React from 'react';
import { StyleSheet, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

interface SetupGuideProps {
  style?: ViewStyle;
}

export default function SetupGuide({ style }: SetupGuideProps) {
  return (
    <ThemedView style={[styles.container, style]}>
      <ThemedText style={styles.title}>Setup Guide</ThemedText>
      <ThemedText style={styles.step}>
        1. <ThemedText style={styles.bold}>VNRecognizeTextRequest (iOS 13+)</ThemedText> — Available
        on all supported devices. Pass a base64 PNG/JPEG to the bridge.
      </ThemedText>
      <ThemedText style={styles.step}>
        2. <ThemedText style={styles.bold}>DataScannerViewController (iOS 16+)</ThemedText> — Live
        camera. Add NSCameraUsageDescription via the with-live-text Expo plugin.
      </ThemedText>
      <ThemedText style={styles.step}>
        3. <ThemedText style={styles.bold}>ImageAnalysisInteraction (iOS 16+)</ThemedText> — Attach
        to a UIImageView for system long-press text overlay (copy, translate, look up).
      </ThemedText>
      <ThemedText style={styles.note}>
        The native Swift module (ExpoLiveText) is the implementation seam. This JS layer is fully
        testable via the bridge mock injected by __setLiveTextBridgeForTests.
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.three,
    gap: Spacing.two,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  step: {
    fontSize: 14,
    lineHeight: 20,
  },
  bold: {
    fontWeight: '600',
  },
  note: {
    fontSize: 12,
    opacity: 0.7,
    marginTop: Spacing.one,
  },
});
