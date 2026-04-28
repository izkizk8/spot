import React from 'react';
import { StyleSheet } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

interface IOSOnlyBannerProps {
  reason: 'search' | 'lookaround' | 'ios-version';
}

const COPY = {
  search: 'MKLocalSearch is iOS only. This feature is not available on this platform.',
  lookaround: 'Look Around is iOS only. This feature is not available on this platform.',
  'ios-version': 'Look Around requires iOS 16+. This feature is not available on your device.',
};

export function IOSOnlyBanner({ reason }: IOSOnlyBannerProps) {
  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.text}>{COPY[reason]}</ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    textAlign: 'center',
  },
});
