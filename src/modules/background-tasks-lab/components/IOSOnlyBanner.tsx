/**
 * IOSOnlyBanner — feature 030 / T031.
 */

import React from 'react';
import { StyleSheet, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

interface IOSOnlyBannerProps {
  readonly style?: ViewStyle;
  readonly reason?: 'platform' | 'older-ios';
}

const COPY: Record<NonNullable<IOSOnlyBannerProps['reason']>, string> = {
  platform: 'Background Tasks require iOS 13+',
  'older-ios': 'This device is running an iOS version older than 13. Background Tasks are unavailable.',
};

export default function IOSOnlyBanner({ style, reason = 'platform' }: IOSOnlyBannerProps) {
  return (
    <ThemedView style={[styles.container, style]} accessibilityRole="alert">
      <ThemedText style={styles.text}>{COPY[reason]}</ThemedText>
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
