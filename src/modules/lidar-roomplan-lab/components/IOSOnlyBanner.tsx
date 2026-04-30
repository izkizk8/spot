/**
 * IOSOnlyBanner — LiDAR / RoomPlan Lab (Android / Web).
 */

import React from 'react';
import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

export default function IOSOnlyBanner() {
  return (
    <ThemedView style={styles.container} type="backgroundElement" testID="roomplan-ios-only-banner">
      <ThemedText type="small" themeColor="tintB">
        ⚠️ RoomPlan is an iOS 16+ Apple framework requiring a LiDAR-equipped device.
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        RoomCaptureSession and RoomCaptureView are exposed on iOS / iPadOS only and require an
        on-device LiDAR scanner (Pro-class iPhones and iPads). There is no first-party Android or
        Web equivalent. Open this lab on a LiDAR-equipped iPhone or iPad running iOS 16 or newer.
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
