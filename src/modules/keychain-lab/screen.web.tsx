/**
 * Keychain Services Lab — Web screen (feature 023, T030).
 *
 * Renders only the IOSOnlyBanner. No interactive surfaces, and crucially no
 * import of the native bridge — `useKeychainItems` and `keychain-store` are
 * intentionally NOT imported here so the Web bundle never references the
 * native keychain module (NFR-005).
 *
 * Covers FR-005, US5-AS1, NFR-005.
 */

import React from 'react';
import { StyleSheet } from 'react-native';

import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

import IOSOnlyBanner from './components/IOSOnlyBanner';

export default function KeychainLabScreenWeb() {
  return (
    <ThemedView style={styles.container}>
      <IOSOnlyBanner />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: Spacing.three, gap: Spacing.three },
});
