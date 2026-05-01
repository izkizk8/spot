/**
 * EntitlementBanner — placeholder entitlement warning.
 * Feature: 036-passkit-wallet
 */

import React from 'react';
import { Linking, StyleSheet, TouchableOpacity } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

interface Props {
  readonly isPlaceholder: boolean;
}

export function EntitlementBanner({ isPlaceholder }: Props) {
  if (!isPlaceholder) {
    return null;
  }

  const handleQuickstartPress = () => {
    // Link to quickstart.md in the specs directory
    Linking.openURL(
      'https://github.com/izkizk8/spot/blob/main/specs/036-passkit-wallet/quickstart.md',
    );
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.title}>⚠️ Pass Type ID Required</ThemedText>
      <ThemedText style={styles.message}>
        This app is configured with a placeholder Pass Type ID. To test with real passes, register a
        Pass Type ID in your Apple Developer account and update app.json.
      </ThemedText>
      <TouchableOpacity
        onPress={handleQuickstartPress}
        accessibilityRole='link'
        style={styles.link}
      >
        <ThemedText style={styles.linkText}>See quickstart.md for instructions →</ThemedText>
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.three,
    borderRadius: Spacing.two,
    borderWidth: 2,
    borderColor: '#FF9500',
    marginBottom: Spacing.three,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: Spacing.two,
    color: '#FF9500',
  },
  message: { fontSize: 14, opacity: 0.9, marginBottom: Spacing.two },
  link: { alignSelf: 'flex-start' },
  linkText: { fontSize: 12, color: '#007AFF', fontWeight: '600' },
});
