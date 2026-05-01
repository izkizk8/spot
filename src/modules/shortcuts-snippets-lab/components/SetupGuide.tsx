/**
 * SetupGuide Component
 * Feature: 072-shortcuts-snippets
 *
 * Educational notes on Shortcuts integration setup.
 */

import React from 'react';
import { StyleSheet, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

interface SetupGuideProps {
  style?: ViewStyle;
}

const STEPS = [
  'Add Siri & Shortcuts capability in Xcode (Target → Signing & Capabilities).',
  'Create an Intents UI Extension target alongside the Intents Extension.',
  'Implement IntentHandler in the Intents Extension to process custom intents.',
  'Override configure(with:context:completion:) in IntentViewController for snippets.',
  'Donate shortcuts via INInteraction.donate() or NSUserActivity with isEligibleForPrediction.',
  'Present INUIAddVoiceShortcutViewController from the main app for user phrase customisation.',
];

export default function SetupGuide({ style }: SetupGuideProps) {
  return (
    <ThemedView style={[styles.container, style]}>
      <ThemedText style={styles.title}>Setup Guide</ThemedText>
      {STEPS.map((step, index) => (
        <ThemedView key={index} style={styles.step}>
          <ThemedText style={styles.num}>{index + 1}.</ThemedText>
          <ThemedText style={styles.text}>{step}</ThemedText>
        </ThemedView>
      ))}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.three,
    gap: Spacing.two,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  step: {
    flexDirection: 'row',
    gap: Spacing.one,
    alignItems: 'flex-start',
  },
  num: {
    fontSize: 14,
    fontWeight: '600',
    minWidth: 20,
  },
  text: {
    fontSize: 14,
    flex: 1,
    opacity: 0.85,
  },
});
