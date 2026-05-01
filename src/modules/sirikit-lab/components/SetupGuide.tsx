/**
 * SetupGuide Component
 * Feature: 071-sirikit
 *
 * Inline notes describing how to wire up SiriKit Custom Intents
 * in a real Expo prebuild: INExtension target, Info.plist keys,
 * and vocabulary registration.
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
      <ThemedText style={styles.title}>Setup</ThemedText>
      <ThemedText style={styles.body}>
        1. Add an Intents extension target (INExtension) to the Xcode project. Each intent type
        subclasses INIntent and pairs with a handler conforming to the matching INIntentHandling
        protocol.
      </ThemedText>
      <ThemedText style={styles.body}>
        2. Set NSSiriUsageDescription in the host app Info.plist. The with-sirikit Expo config
        plugin seeds a default copy when the key is absent.
      </ThemedText>
      <ThemedText style={styles.body}>
        3. Register vocabulary at runtime with INVocabulary (user-specific terms) and ship an
        AppIntentVocabulary.plist for app-specific terms.
      </ThemedText>
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
  body: {
    fontSize: 14,
    opacity: 0.85,
  },
});
