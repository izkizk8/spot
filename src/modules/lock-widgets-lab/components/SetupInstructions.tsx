/**
 * SetupInstructions — numbered list of steps for adding the lock-screen widget on-device.
 *
 * Displays ≥5 steps mentioning long-press, customizer, widget family, and "spot".
 * Accepts an optional `style` prop for layout flexibility.
 *
 * @see specs/027-lock-screen-widgets/tasks.md T028, T033
 * @see specs/027-lock-screen-widgets/spec.md FR-LW-035, FR-LW-036
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
      <ThemedText style={styles.heading}>Set up on your Lock Screen</ThemedText>
      <ThemedText style={styles.step}>
        1. On your iOS 16+ device, long-press the Lock Screen to enter edit mode.
      </ThemedText>
      <ThemedText style={styles.step}>
        2. Tap "Customize" to open the Lock Screen customizer.
      </ThemedText>
      <ThemedText style={styles.step}>
        3. Tap the widget area below the clock to add or edit widgets.
      </ThemedText>
      <ThemedText style={styles.step}>
        4. Scroll to find the "spot" entry in the widget gallery.
      </ThemedText>
      <ThemedText style={styles.step}>
        5. Select a widget family: Rectangular, Circular, or Inline.
      </ThemedText>
      <ThemedText style={styles.step}>
        6. Tap "Done" to save your Lock Screen configuration.
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
