/**
 * IOSOnlyBanner — feature 031 / T035.
 */

import React from 'react';
import { StyleSheet, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

interface IOSOnlyBannerProps {
  readonly style?: ViewStyle;
  readonly reason?: 'older-ios' | 'system-disabled';
}

const COPY: Record<string, string> = {
  'older-ios': 'This device is running an iOS version older than 9. Spotlight indexing is unavailable.',
  'system-disabled': 'Spotlight indexing is disabled or unavailable on this device.',
};

const DEFAULT_COPY = 'Spotlight indexing requires iOS 9+';

export default function IOSOnlyBanner({ style, reason }: IOSOnlyBannerProps) {
  const text = reason ? COPY[reason] : DEFAULT_COPY;
  return (
    <ThemedView style={[styles.container, style]} accessibilityRole="alert">
      <ThemedText style={styles.text}>{text}</ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.three,
    borderRadius: Spacing.two,
    backgroundColor: '#FF9500',
  },
  text: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
  },
});
