/**
 * IOSOnlyBanner — Apple Pay Lab (Android / Web).
 */

import React from 'react';
import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

export default function IOSOnlyBanner() {
  return (
    <ThemedView
      style={styles.container}
      type='backgroundElement'
      testID='apple-pay-ios-only-banner'
    >
      <ThemedText type='small' themeColor='tintB'>
        ⚠️ Apple Pay is an iOS-only Apple framework.
      </ThemedText>
      <ThemedText type='small' themeColor='textSecondary'>
        PKPaymentAuthorizationController is exposed on iOS / iPadOS only. There is no first-party
        Android or Web equivalent. Open this lab on an iPhone or iPad signed into iCloud with at
        least one card added to Wallet to exercise the sandbox flow.
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
