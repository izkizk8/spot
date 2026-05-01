/**
 * IOSOnlyBanner Component
 * Feature: 057-photokit
 *
 * Gate banner for non-iOS platforms.
 */

import React from 'react';
import { Platform, StyleSheet, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

interface IOSOnlyBannerProps {
  style?: ViewStyle;
}

export default function IOSOnlyBanner({ style }: IOSOnlyBannerProps) {
  const currentPlatform =
    Platform.OS === 'web' ? 'Web' : Platform.OS === 'android' ? 'Android' : 'iOS';

  return (
    <ThemedView style={[styles.container, style]}>
      <ThemedText style={styles.icon}>⚠️</ThemedText>
      <ThemedText style={styles.title}>iOS Only Feature</ThemedText>
      <ThemedText style={styles.message}>
        PHPickerViewController is iOS 14+ only. This feature is not available on {currentPlatform}.
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.four,
    alignItems: 'center',
    gap: Spacing.two,
  },
  icon: {
    fontSize: 48,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.8,
  },
});
