import React from 'react';
import { StyleSheet, type ViewStyle } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

interface SetupInstructionsProps {
  style?: ViewStyle;
}

export default function SetupInstructions({ style }: SetupInstructionsProps) {
  const steps = [
    'Open Settings on your iOS device',
    'Navigate to Focus',
    'Select any existing focus or create a new one',
    'Tap "Add Filter"',
    'Search for "spot"',
    'Select "Showcase Mode"',
    'Choose your desired Mode and Accent Color parameters',
    'Tap Done to save the filter configuration',
  ];

  return (
    <ThemedView style={[styles.container, style]}>
      <ThemedText style={styles.heading}>Set up the filter</ThemedText>
      <ThemedText style={styles.intro}>
        Follow these steps to bind the Showcase Mode filter to any Focus:
      </ThemedText>
      {steps.map((step, index) => (
        <ThemedText key={index} style={styles.step}>
          {index + 1}. {step}
        </ThemedText>
      ))}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.three,
    borderRadius: Spacing.two,
  },
  heading: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: Spacing.two,
  },
  intro: {
    fontSize: 14,
    marginBottom: Spacing.three,
    opacity: 0.8,
  },
  step: {
    fontSize: 14,
    marginBottom: Spacing.two,
    lineHeight: 20,
  },
});
