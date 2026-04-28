/**
 * SetupInstructions — numbered list of steps for entering StandBy on-device.
 *
 * Mentions Settings, StandBy, charging, landscape, lock, and the "spot" entry.
 *
 * @see specs/028-standby-mode/tasks.md T025, T032
 * @see specs/028-standby-mode/spec.md FR-SB-035, FR-SB-036
 */

import React from 'react';
import { StyleSheet, ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

export interface SetupInstructionsProps {
  readonly style?: ViewStyle;
  readonly accessibilityLabel?: string;
}

export function SetupInstructions({ style, accessibilityLabel }: SetupInstructionsProps = {}) {
  return (
    <ThemedView style={[styles.container, style]} accessibilityLabel={accessibilityLabel}>
      <ThemedText style={styles.heading}>Set up StandBy</ThemedText>
      <ThemedText style={styles.step}>
        1. On your iOS 17+ device, open Settings → StandBy and ensure StandBy is enabled.
      </ThemedText>
      <ThemedText style={styles.step}>
        2. Connect the iPhone to a charge source (MagSafe, wireless, or wired).
      </ThemedText>
      <ThemedText style={styles.step}>3. Rotate the device to landscape orientation.</ThemedText>
      <ThemedText style={styles.step}>
        4. Lock the device — StandBy automatically activates.
      </ThemedText>
      <ThemedText style={styles.step}>
        5. Swipe horizontally between StandBy panes to reach the widget pane.
      </ThemedText>
      <ThemedText style={styles.step}>
        6. Long-press the widget pane and pick the "spot" Spot StandBy widget to add it.
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.three,
    borderRadius: Spacing.two,
    borderWidth: 1,
    borderColor: '#D0D1D6',
    gap: Spacing.two,
  },
  heading: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: Spacing.one,
  },
  step: {
    fontSize: 14,
    lineHeight: 20,
  },
});
