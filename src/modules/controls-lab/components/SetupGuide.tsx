/**
 * SetupGuide Component
 * Feature: 087-controls
 *
 * Explains how to build and add controls to Control Center.
 */
import React from 'react';
import { StyleSheet, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

interface SetupGuideProps {
  style?: ViewStyle;
}

export default function SetupGuide({ style }: SetupGuideProps) {
  return (
    <ThemedView style={[styles.container, style]}>
      <ThemedText style={styles.title}>Setup Guide</ThemedText>
      <ThemedText style={styles.step}>1. Create a Widget Extension target in Xcode.</ThemedText>
      <ThemedText style={styles.step}>
        2. Declare a ControlWidget conforming to the ControlWidgetConfiguration protocol.
      </ThemedText>
      <ThemedText style={styles.step}>
        3. Implement ControlValueProvider to supply current state (iOS 18+).
      </ThemedText>
      <ThemedText style={styles.step}>
        4. Define an AppIntent that performs the action when the control is tapped.
      </ThemedText>
      <ThemedText style={styles.step}>
        5. Add the control to Control Center via Settings → Control Center.
      </ThemedText>
      <ThemedText style={styles.note}>Note: Controls require iOS 18.0+ and Xcode 16+.</ThemedText>
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
    fontSize: 14,
  },
  note: {
    fontSize: 13,
    opacity: 0.7,
    fontStyle: 'italic',
  },
});
