/**
 * SetupInstructions — SharePlay Lab (feature 047).
 *
 * Educates the user on how to actually launch the showcase
 * activity (start a FaceTime call, then tap the activity in the
 * SharePlay menu). Pure presentational.
 */

import React from 'react';
import { StyleSheet, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

interface SetupInstructionsProps {
  readonly style?: ViewStyle;
}

export default function SetupInstructions({ style }: SetupInstructionsProps) {
  return (
    <ThemedView
      style={[styles.container, style]}
      type='backgroundElement'
      testID='shareplay-setup-instructions'
    >
      <ThemedText type='smallBold'>Setup</ThemedText>
      <ThemedText type='small'>
        1. Start (or join) a FaceTime call with another person on iOS 15+.
      </ThemedText>
      <ThemedText type='small'>
        2. Open this lab and tap "Start activity". Hand-off to the system happens through the
        ShareplayActivityViewController.
      </ThemedText>
      <ThemedText type='small'>
        3. The other participant taps the activity in the FaceTime SharePlay menu (or in Messages
        via the "Share via Messages" sheet) to join.
      </ThemedText>
      <ThemedText type='small' themeColor='textSecondary'>
        Once joined, the session status becomes <ThemedText type='smallBold'>active</ThemedText> and
        Counter +/- updates propagate via GroupSessionMessenger.
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
