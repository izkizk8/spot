/**
 * CapabilityCard — SharePlay Lab (feature 047).
 *
 * Renders the GroupActivities capability state plus a snapshot of
 * the current session status. Pure presentational + controlled.
 */

import React from 'react';
import { StyleSheet, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import type { SessionStatus } from '@/native/shareplay.types';

interface CapabilityCardProps {
  readonly style?: ViewStyle;
  readonly available: boolean;
  readonly status: SessionStatus;
}

export default function CapabilityCard({ style, available, status }: CapabilityCardProps) {
  return (
    <ThemedView
      style={[styles.container, style]}
      type="backgroundElement"
      testID="shareplay-capability-card"
    >
      <ThemedText type="smallBold">GroupActivities capability</ThemedText>
      <ThemedText type="small" testID="shareplay-capability-available">
        {available
          ? '✅ GroupActivities framework is available on this device.'
          : '⛔ GroupActivities framework is not available on this device.'}
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary" testID="shareplay-capability-status">
        Active session status: {status}
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.three,
    gap: Spacing.two,
    borderRadius: Spacing.two,
  },
});
