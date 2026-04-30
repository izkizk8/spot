/**
 * IOSOnlyBanner — CarPlay Lab (Android / Web).
 */

import React from 'react';
import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

export default function IOSOnlyBanner() {
  return (
    <ThemedView style={styles.container} type="backgroundElement" testID="carplay-ios-only-banner">
      <ThemedText type="small" themeColor="tintB">
        ⚠️ CarPlay is an iOS-only Apple framework.
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        CarPlay scenes are surfaced through `CPTemplateApplicationScene` on iOS only. There is no
        first-party Android or Web equivalent. Open this lab on an iOS device or simulator with the
        Xcode CarPlay simulator (I/O → External Displays → CarPlay) to preview the templates.
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
