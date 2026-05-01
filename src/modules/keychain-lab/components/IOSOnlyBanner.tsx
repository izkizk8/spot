/**
 * IOSOnlyBanner — Keychain Lab banner for non-iOS platforms.
 *
 * Renders an alert-role themed banner explaining that the full keychain flow
 * is available only on iOS. Mirrors the per-module banner pattern from 021/022.
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
        ⚠️ Keychain Services is unavailable on the Web — open this module on iOS to see the full
        keychain integration with explicit ACL flags and access groups.
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
