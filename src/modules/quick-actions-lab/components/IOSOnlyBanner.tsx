/**
 * IOSOnlyBanner — Shown on Android/Web to indicate the bridge does not
 * apply on those platforms.
 * Feature: 039-quick-actions
 */

import React from 'react';
import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

export function IOSOnlyBanner() {
  return (
    <ThemedView
      style={styles.container}
      type='backgroundElement'
      testID='quick-actions-ios-only-banner'
    >
      <ThemedText type='small' themeColor='tintB'>
        ⚠️ Quick Actions are an iOS Home Screen feature.
      </ThemedText>
      <ThemedText type='small' themeColor='textSecondary'>
        Android exposes only a limited shortcut surface and the web has no equivalent. Build a
        development client on iOS to drive this lab.
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.three,
    gap: Spacing.two,
    borderRadius: Spacing.two,
    marginBottom: Spacing.three,
  },
});
