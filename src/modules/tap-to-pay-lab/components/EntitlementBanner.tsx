/**
 * EntitlementBanner Component
 * Feature: 051-tap-to-pay
 *
 * Displays entitlement status and link to Apple Tap to Pay program.
 */

import React from 'react';
import { Linking, Pressable, StyleSheet, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

interface EntitlementBannerProps {
  status: 'granted' | 'missing' | 'unknown';
  style?: ViewStyle;
}

const APPLE_PROGRAM_URL = 'https://register.apple.com/tap-to-pay-on-iphone';

export default function EntitlementBanner({ status, style }: EntitlementBannerProps) {
  const statusEmoji = status === 'granted' ? '✓' : status === 'missing' ? '✗' : '?';
  const statusColor = status === 'granted' ? 'green' : status === 'missing' ? 'red' : 'gray';

  const handlePress = () => {
    void Linking.openURL(APPLE_PROGRAM_URL);
  };

  return (
    <ThemedView style={[styles.container, style]}>
      <ThemedText style={styles.title}>Entitlement Status</ThemedText>
      <ThemedView style={styles.statusRow}>
        <ThemedText style={[styles.statusPill, { color: statusColor }]}>{statusEmoji}</ThemedText>
        <ThemedText style={styles.statusText}>
          {status === 'granted' && 'Entitlement granted'}
          {status === 'missing' && 'Entitlement missing'}
          {status === 'unknown' && 'Entitlement status unknown'}
        </ThemedText>
      </ThemedView>
      <ThemedText style={styles.explanation}>
        The com.apple.developer.proximity-reader.payment.acceptance entitlement is Apple-restricted
        and requires enrollment in the Tap to Pay program.
      </ThemedText>
      <Pressable onPress={handlePress} style={styles.linkButton}>
        <ThemedText style={styles.linkText}>Apply for Tap to Pay Program</ThemedText>
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.three,
    gap: Spacing.two,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  statusPill: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  statusText: {
    fontSize: 16,
  },
  explanation: {
    fontSize: 14,
    opacity: 0.8,
  },
  linkButton: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  linkText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
