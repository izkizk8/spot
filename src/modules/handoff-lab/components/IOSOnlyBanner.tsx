/**
 * IOSOnlyBanner — Shown on Android/Web to indicate Handoff is iOS-only.
 */

import React from 'react';
import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

export default function IOSOnlyBanner() {
  return (
    <ThemedView style={styles.container} type="backgroundElement" testID="handoff-ios-only-banner">
      <ThemedText type="small" themeColor="tintB">
        ⚠️ Handoff & Continuity is only available on iOS.
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        This module demonstrates NSUserActivity — the iOS primitive behind Handoff (cross-device
        continuation), state restoration, Spotlight indexing reuse, and Siri prediction. Android and
        Web have no equivalent API.
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
