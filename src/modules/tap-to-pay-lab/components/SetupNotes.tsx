/**
 * SetupNotes Component
 * Feature: 051-tap-to-pay
 *
 * Setup instructions checklist for Tap to Pay integration.
 */

import React from 'react';
import { Linking, Pressable, StyleSheet, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

interface SetupNotesProps {
  style?: ViewStyle;
}

const APPLE_PROGRAM_URL = 'https://register.apple.com/tap-to-pay-on-iphone';

export default function SetupNotes({ style }: SetupNotesProps) {
  const handleLinkPress = () => {
    void Linking.openURL(APPLE_PROGRAM_URL);
  };

  return (
    <ThemedView style={[styles.container, style]}>
      <ThemedText style={styles.title}>Setup Instructions</ThemedText>

      <ThemedView style={styles.step}>
        <ThemedText style={styles.stepNumber}>1.</ThemedText>
        <ThemedView style={styles.stepContent}>
          <ThemedText style={styles.stepText}>Enroll in Apple Tap to Pay program</ThemedText>
          <Pressable onPress={handleLinkPress}>
            <ThemedText style={styles.link}>Apply here →</ThemedText>
          </Pressable>
        </ThemedView>
      </ThemedView>

      <ThemedView style={styles.step}>
        <ThemedText style={styles.stepNumber}>2.</ThemedText>
        <ThemedText style={styles.stepText}>
          Integrate a PSP SDK (Stripe Terminal, Adyen, or Square)
        </ThemedText>
      </ThemedView>

      <ThemedView style={styles.step}>
        <ThemedText style={styles.stepNumber}>3.</ThemedText>
        <ThemedText style={styles.stepText}>
          Add entitlement via with-tap-to-pay plugin in app.json
        </ThemedText>
      </ThemedView>

      <ThemedView style={styles.step}>
        <ThemedText style={styles.stepNumber}>4.</ThemedText>
        <ThemedText style={styles.stepText}>
          Test on supported iPhone (XS or later with iOS 16+)
        </ThemedText>
      </ThemedView>
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
    marginBottom: Spacing.one,
  },
  step: {
    flexDirection: 'row',
    gap: Spacing.two,
    alignItems: 'flex-start',
  },
  stepNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    width: 24,
  },
  stepContent: {
    flex: 1,
    gap: Spacing.one,
  },
  stepText: {
    fontSize: 14,
    flex: 1,
  },
  link: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
});
