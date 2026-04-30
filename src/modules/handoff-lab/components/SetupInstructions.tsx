/**
 * SetupInstructions — feature 040 / T035 / US5.
 *
 * Static documentary card listing the 8 cross-device test steps from
 * specs/040-handoff-continuity/quickstart.md §5.
 */

import React from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

interface SetupInstructionsProps {
  readonly style?: ViewStyle;
}

const STEPS: readonly string[] = [
  'Sign both devices into the same iCloud account.',
  'Enable Handoff in Settings → General → AirPlay & Handoff (iOS 13+) on both devices.',
  'Turn Bluetooth on for both devices and bring them within ~10 m.',
  'Wake both devices (the lock screen counts as awake on iOS).',
  'Install the same spot build on both devices (must contain the same NSUserActivityTypes entry).',
  'On Device A, open this lab and tap "Become current" with the default activity.',
  'On Device B, look for the Handoff hint on the lock screen, app switcher, or Mac Dock.',
  'Tap the hint on Device B → spot launches → a new row appears in Incoming Activity Log.',
];

export default function SetupInstructions({ style }: SetupInstructionsProps) {
  return (
    <ThemedView style={[styles.container, style]}>
      <ThemedText style={styles.heading}>Setup Instructions</ThemedText>
      {STEPS.map((step, index) => (
        <View key={index} style={styles.row} testID={`setup-step-${index}`}>
          <ThemedText type="smallBold" style={styles.num}>
            {index + 1}.
          </ThemedText>
          <ThemedText type="small" style={styles.body}>
            {step}
          </ThemedText>
        </View>
      ))}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.three,
    borderRadius: Spacing.two,
    gap: Spacing.two,
  },
  heading: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: Spacing.one,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.two,
    alignItems: 'flex-start',
  },
  num: {
    minWidth: 20,
  },
  body: {
    flex: 1,
    lineHeight: 20,
  },
});
