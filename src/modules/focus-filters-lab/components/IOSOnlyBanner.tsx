import React from 'react';
import { StyleSheet, type ViewStyle } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

interface IOSOnlyBannerProps {
  style?: ViewStyle;
}

export default function IOSOnlyBanner({ style }: IOSOnlyBannerProps) {
  return (
    <ThemedView style={[styles.container, style]} accessibilityRole="alert">
      <ThemedText style={styles.text}>Focus Filters require iOS 16+</ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.md,
    borderRadius: Spacing.sm,
    backgroundColor: '#FF9500',
  },
  text: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
  },
});
