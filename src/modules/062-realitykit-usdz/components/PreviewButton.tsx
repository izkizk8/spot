/**
 * PreviewButton Component
 * Feature: 062-realitykit-usdz
 *
 * Tappable button that triggers AR Quick Look for the selected model.
 */
import React from 'react';
import { ActivityIndicator, StyleSheet, TouchableOpacity, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

interface PreviewButtonProps {
  loading: boolean;
  onPress: () => void;
  style?: ViewStyle;
}

export default function PreviewButton({ loading, onPress, style }: PreviewButtonProps) {
  return (
    <ThemedView style={[styles.card, style]}>
      <TouchableOpacity
        style={[styles.button, loading && styles.disabled]}
        onPress={onPress}
        disabled={loading}
        accessibilityRole='button'
        accessibilityLabel='Open AR Quick Look'
      >
        {loading ? (
          <ActivityIndicator color='#fff' />
        ) : (
          <ThemedText style={styles.label}>Open AR Quick Look</ThemedText>
        )}
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: Spacing.three,
    borderRadius: 12,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: 10,
    alignItems: 'center',
  },
  disabled: {
    opacity: 0.5,
  },
  label: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
