/**
 * IOSOnlyBanner — Local Auth banner for the Web platform.
 *
 * Renders an alert-role themed banner explaining that the biometric flow is
 * disabled on Web. Mirrors the 021 per-module banner pattern.
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
        ⚠️ Local Authentication is unavailable on the Web — open this module on iOS (Face ID / Touch
        ID / Optic ID) or Android (Fingerprint / Face) to see the live biometric flow.
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
