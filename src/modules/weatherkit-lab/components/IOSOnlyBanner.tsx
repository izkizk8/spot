/**
 * IOSOnlyBanner — WeatherKit Lab (Android / Web).
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
      type='backgroundElement'
      testID='weatherkit-ios-only-banner'
    >
      <ThemedText type='small' themeColor='tintB'>
        ⚠️ WeatherKit is an iOS 16+ Apple framework.
      </ThemedText>
      <ThemedText type='small' themeColor='textSecondary'>
        WeatherKit is exposed through `WeatherService.shared` on iOS / iPadOS / macOS only. There is
        no first-party Android or Web equivalent. Open this lab on iOS 16 or newer to fetch live
        forecasts and alerts.
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
