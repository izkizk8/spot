/**
 * QuickLookFallback — feature 032 / T037.
 *
 * Inline fallback shown when Quick Look is unavailable (Android / Web /
 * iOS without QuickLook native module). Offers a Share action.
 */

import React from 'react';
import { Pressable, StyleSheet, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

interface QuickLookFallbackProps {
  readonly onShare?: () => void;
  readonly style?: ViewStyle;
}

export default function QuickLookFallback({ onShare, style }: QuickLookFallbackProps) {
  return (
    <ThemedView style={[styles.container, style]}>
      <ThemedText style={styles.text}>
        Quick Look preview is only available on iOS. Use Share to open this file in another app.
      </ThemedText>
      {onShare ? (
        <Pressable accessibilityRole="button" onPress={onShare} style={styles.button}>
          <ThemedText style={styles.buttonText}>Share</ThemedText>
        </Pressable>
      ) : null}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.three,
    borderRadius: Spacing.two,
    gap: Spacing.two,
  },
  text: {
    fontSize: 14,
    opacity: 0.85,
  },
  button: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.two,
    backgroundColor: '#007AFF',
    alignSelf: 'flex-start',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
});
