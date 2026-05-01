/**
 * IOSOnlyBanner — StoreKit Lab (Android / Web).
 */

import React from 'react';
import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

export default function IOSOnlyBanner() {
  return (
    <ThemedView style={styles.container} type='backgroundElement' testID='storekit-ios-only-banner'>
      <ThemedText type='small' themeColor='tintB'>
        ⚠️ StoreKit 2 is an iOS-only Apple framework.
      </ThemedText>
      <ThemedText type='small' themeColor='textSecondary'>
        Product, Transaction, and AppStore are exposed on iOS / iPadOS only. Open this lab on an
        iPhone or iPad with a StoreKit Configuration file in Xcode (or App Store Connect catalog) to
        exercise the sandbox flow.
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
