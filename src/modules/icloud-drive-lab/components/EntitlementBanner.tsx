/**
 * EntitlementBanner Component
 * Feature: 070-icloud-drive
 *
 * Explains the Apple Developer account requirement and the manual
 * steps needed to enable the iCloud Drive entitlement.
 */

import React from 'react';
import { StyleSheet, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

interface EntitlementBannerProps {
  style?: ViewStyle;
}

export default function EntitlementBanner({ style }: EntitlementBannerProps) {
  return (
    <ThemedView style={[styles.container, style]}>
      <ThemedText style={styles.icon}>🔐</ThemedText>
      <ThemedText style={styles.title}>Entitlement Required</ThemedText>
      <ThemedText style={styles.body}>
        iCloud Drive access requires the{' '}
        <ThemedText style={styles.bold}>
          com.apple.developer.icloud-container-identifiers
        </ThemedText>{' '}
        entitlement, which is gated behind a paid Apple Developer Program membership.
      </ThemedText>
      <ThemedText style={styles.body}>
        To enable it: open Xcode → Signing &amp; Capabilities → + Capability → iCloud → check
        &quot;iCloud Documents&quot; and register your container in the Apple Developer portal.
      </ThemedText>
      <ThemedText style={styles.note}>
        This scaffold ships the correct plugin configuration. All bridge methods will throw{' '}
        <ThemedText style={styles.code}>ICloudDriveNotAvailable</ThemedText> until the entitlement
        is provisioned.
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.three,
    gap: Spacing.two,
    borderWidth: 1,
    borderColor: '#F59E0B',
    borderRadius: 10,
  },
  icon: {
    fontSize: 32,
    textAlign: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  body: {
    fontSize: 14,
    opacity: 0.9,
  },
  bold: {
    fontWeight: '600',
    fontSize: 14,
  },
  note: {
    fontSize: 12,
    opacity: 0.7,
  },
  code: {
    fontSize: 12,
    fontFamily: 'monospace',
  },
});
