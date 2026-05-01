/**
 * EntitlementBanner — banner explaining the missing
 * `com.apple.developer.family-controls` entitlement.
 *
 * Renders nothing when the entitlement is available (FR-009).
 * Pure presentation: parent owns the `visible` prop.
 */

import React from 'react';
import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

export interface EntitlementBannerProps {
  readonly visible: boolean;
}

export function EntitlementBanner({ visible }: EntitlementBannerProps) {
  if (!visible) return null;
  return (
    <ThemedView accessibilityLabel='Entitlement banner' style={styles.container}>
      <ThemedText style={styles.title}>Entitlement required</ThemedText>
      <ThemedText style={styles.body}>
        The `com.apple.developer.family-controls` entitlement is not granted on this build. Every
        ScreenTime action will fail with a typed rejection. See{' '}
        <ThemedText style={styles.link}>specs/015-screentime-api/quickstart.md</ThemedText> for how
        to request the entitlement from Apple.
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.three,
    borderRadius: Spacing.two,
    backgroundColor: '#FFF3CD',
    gap: Spacing.one,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#856404',
  },
  body: {
    fontSize: 13,
    color: '#856404',
  },
  link: {
    fontSize: 13,
    fontWeight: '600',
    color: '#856404',
  },
});
