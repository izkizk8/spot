/**
 * IOSOnlyBanner — Sign in with Apple module banner for non-iOS platforms.
 *
 * Renders an alert-role themed banner explaining that Sign in with Apple
 * is iOS 13+ only on this build.
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
        ⚠️ Sign in with Apple is iOS 13+ only on this build — open this module on an iOS 13+ device
        to see the live authentication flow.
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
