/**
 * IOSOnlyBanner — Speech-recognition module banner for non-iOS platforms.
 *
 * Renders an alert-role themed banner explaining that speech recognition
 * is iOS-only on this build (FR-022 / FR-023, NFR-004).
 */

import React from 'react';
import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

export default function IOSOnlyBanner() {
  return (
    <ThemedView style={styles.container} type="backgroundElement" accessibilityRole="alert">
      <ThemedText type="small" themeColor="textSecondary" style={styles.text}>
        ⚠️ Speech Recognition is iOS-only on this build — open this module on an iOS 10+ device to
        see live transcription.
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.three,
    borderRadius: Spacing.two,
  },
  text: {
    lineHeight: 20,
  },
});
