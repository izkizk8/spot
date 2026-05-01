/**
 * IOSOnlyBanner — HomeKit Lab (Android / web).
 */

import React from 'react';
import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

export default function IOSOnlyBanner() {
  return (
    <ThemedView style={styles.container} type='backgroundElement' testID='homekit-ios-only-banner'>
      <ThemedText type='small' themeColor='tintB'>
        ⚠️ HomeKit is an iOS-only framework.
      </ThemedText>
      <ThemedText type='small' themeColor='textSecondary'>
        HomeKit is Apple&apos;s smart-home framework backed by `HMHomeManager`. There is no
        first-party Android or Web equivalent. Run this lab on an iOS device or simulator with the
        HomeKit Accessory Simulator on macOS to add fake accessories.
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
