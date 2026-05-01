/**
 * IOSOnlyBanner — Shown on web to indicate Contacts is iOS/Android-only.
 */

import React from 'react';
import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

export function IOSOnlyBanner() {
  return (
    <ThemedView style={styles.container} type='backgroundElement' testID='contacts-ios-only-banner'>
      <ThemedText type='small' themeColor='tintB'>
        ⚠️ Contacts access is only available on iOS and Android.
      </ThemedText>
      <ThemedText type='small' themeColor='textSecondary'>
        This module showcases native Contacts framework integration. Web has no equivalent API.
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
