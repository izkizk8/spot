/**
 * IOSOnlyBanner — cross-platform unsupported message.
 * Feature: 036-passkit-wallet
 */

import React from 'react';
import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

export function IOSOnlyBanner() {
  return (
    <ThemedView style={styles.container} accessibilityLabel="iOS-only feature banner">
      <ThemedText style={styles.title}>📱 iOS Only</ThemedText>
      <ThemedText style={styles.message}>
        Wallet (PassKit) is available on iOS only. This educational showcase demonstrates the API
        surface on all platforms, but passes can only be added and opened on iOS devices.
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.three,
    borderRadius: Spacing.two,
    borderWidth: 2,
    borderColor: '#8E8E93',
    marginBottom: Spacing.three,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: Spacing.two,
  },
  message: { fontSize: 14, opacity: 0.9 },
});
