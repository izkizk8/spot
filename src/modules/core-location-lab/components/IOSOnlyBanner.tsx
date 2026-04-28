/**
 * IOSOnlyBanner component (feature 025).
 *
 * Displays a banner indicating that a feature is iOS-only.
 */
import React from 'react';
import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

export interface IOSOnlyBannerProps {
  reason: string;
}

const reasonCopy: Record<string, string> = {
  'region-monitoring':
    "Region monitoring (geofencing) is only available on iOS. This feature uses Apple's Core Location framework for precise boundary detection.",
};

export function IOSOnlyBanner({ reason }: IOSOnlyBannerProps) {
  const copy = reasonCopy[reason] ?? `This feature is only available on iOS.`;

  return (
    <ThemedView style={styles.banner} testID="ios-only-banner">
      <ThemedText style={styles.badge}>iOS only</ThemedText>
      <ThemedText themeColor="textSecondary" style={styles.copy}>
        {copy}
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#F5F5F7',
    padding: Spacing.three,
    borderRadius: Spacing.two,
    gap: Spacing.two,
    alignItems: 'center',
  },
  badge: {
    backgroundColor: '#007AFF',
    color: '#FFFFFF',
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
    borderRadius: Spacing.one,
    fontSize: 12,
    fontWeight: '600',
    overflow: 'hidden',
  },
  copy: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
