/**
 * IOSOnlyBanner — Alert banner shown on non-iOS platforms explaining that
 * EventKit-backed controls are disabled.
 */

import React from 'react';
import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

export function IOSOnlyBanner() {
  return (
    <ThemedView
      style={styles.container}
      type="backgroundElement"
      accessibilityRole="alert"
      testID="eventkit-ios-only-banner"
    >
      <ThemedText type="small" themeColor="textSecondary" style={styles.text}>
        EventKit is iOS-only — controls below are disabled
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.three,
    borderRadius: Spacing.two,
  },
  text: {
    lineHeight: 20,
  },
});
