/**
 * IOSOnlyBanner — SharePlay Lab (Android / Web).
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
      testID='shareplay-ios-only-banner'
    >
      <ThemedText type='small' themeColor='tintB'>
        ⚠️ SharePlay (GroupActivities) is an iOS 15+ Apple framework.
      </ThemedText>
      <ThemedText type='small' themeColor='textSecondary'>
        GroupActivities, GroupSession and GroupSessionMessenger are exposed on iOS, iPadOS, macOS,
        tvOS and visionOS only. There is no first-party Android or Web equivalent. Open this lab on
        iOS 15 or newer during a FaceTime call to launch the showcase activity.
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
