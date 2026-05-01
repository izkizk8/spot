/**
 * IOSOnlyBanner — banner shown on Android / Web / iOS < 17.
 *
 * Pure presentational. Sets accessibilityRole='alert' so screen readers
 * announce on mount. Visibility is owned by the screen variant.
 *
 * @see specs/028-standby-mode/tasks.md T027, T034
 * @see specs/028-standby-mode/spec.md FR-SB-027, NFR-SB-007
 */

import React from 'react';
import { StyleSheet, ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

export const IOS_ONLY_BANNER_TEXT = 'StandBy Mode is iOS 17+ only';

export interface IOSOnlyBannerProps {
  readonly style?: ViewStyle;
}

export function IOSOnlyBanner({ style }: IOSOnlyBannerProps = {}) {
  return (
    <ThemedView style={[styles.banner, style]} accessibilityRole='alert'>
      <ThemedText style={styles.bannerText}>{IOS_ONLY_BANNER_TEXT}</ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  banner: {
    padding: Spacing.three,
    borderRadius: Spacing.two,
    backgroundColor: '#FFF3CD',
  },
  bannerText: {
    fontSize: 14,
    color: '#856404',
  },
});
