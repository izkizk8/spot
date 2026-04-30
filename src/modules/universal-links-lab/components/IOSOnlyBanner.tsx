/**
 * IOSOnlyBanner — Universal Links Lab (Android / web).
 */

import React from 'react';
import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

export default function IOSOnlyBanner() {
  return (
    <ThemedView
      style={styles.container}
      type="backgroundElement"
      testID="universal-links-ios-only-banner"
    >
      <ThemedText type="small" themeColor="tintB">
        ⚠️ Universal Links is an iOS-only feature.
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        Universal Links route a tapped https URL into an installed iOS 9+ app via the
        apple-app-site-association file and the `applinks:` Associated Domains entitlement. Android
        App Links and Web have similar but distinct mechanisms; this lab focuses on the Apple
        platform.
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.three,
    gap: Spacing.two,
    borderRadius: Spacing.two,
    marginBottom: Spacing.three,
  },
});
