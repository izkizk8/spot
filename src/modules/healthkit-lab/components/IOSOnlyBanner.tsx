/**
 * IOSOnlyBanner — HealthKit Lab (Android / web).
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
      testID='healthkit-ios-only-banner'
    >
      <ThemedText type='small' themeColor='tintB'>
        ⚠️ HealthKit is an iOS-only framework.
      </ThemedText>
      <ThemedText type='small' themeColor='textSecondary'>
        HealthKit is Apple&apos;s health-and-fitness data store. There is no first-party Android or
        web equivalent (Google Fit / Web Sensor APIs cover only a small subset). Run this lab on an
        iOS device or simulator to authorize, query, and write samples.
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
