/**
 * IOSOnlyBanner — Shared banner for Android/Web screens.
 *
 * Renders a themed warning banner explaining that Vision is iOS-only,
 * with an accessibility role="alert" for screen reader announcements.
 *
 * @see specs/017-camera-vision/tasks.md T021, T022
 */

import React from 'react';
import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

export default function IOSOnlyBanner() {
  return (
    <ThemedView style={styles.container} type='backgroundElement' accessibilityRole='alert'>
      <ThemedText type='small' themeColor='textSecondary' style={styles.text}>
        ⚠️ Vision is iOS-only — open this module on an iOS 13+ device to see live face / text /
        barcode detection.
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
