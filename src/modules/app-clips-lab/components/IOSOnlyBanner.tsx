/**
 * IOSOnlyBanner — App Clips Lab (Android / web).
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
      testID="app-clips-ios-only-banner"
    >
      <ThemedText type="small" themeColor="tintB">
        ⚠️ App Clips is an iOS-only feature.
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        App Clips are lightweight slices (&lt;10MB) of an iOS 14+ app, invoked via App Clip Codes,
        NFC tags, QR codes, Smart App Banners, Maps place cards, or shared links in Messages.
        Android and web have no analogous platform mechanism; this lab focuses on the Apple
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
