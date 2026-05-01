/**
 * IOSOnlyBanner — feature 032 / T038.
 */

import React from 'react';
import { StyleSheet, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

interface IOSOnlyBannerProps {
  readonly style?: ViewStyle;
}

export default function IOSOnlyBanner({ style }: IOSOnlyBannerProps) {
  return (
    <ThemedView style={[styles.container, style]} accessibilityRole='alert'>
      <ThemedText style={styles.text}>
        Quick Look preview is iOS-only. Documents can still be picked, listed, and shared.
      </ThemedText>
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
