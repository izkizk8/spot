/**
 * ExplainerCard — feature 040 / T022 / US1.
 *
 * Renders the canonical explainer for NSUserActivity / Handoff /
 * Spotlight reuse / Siri prediction.
 */

import React from 'react';
import { StyleSheet, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

interface ExplainerCardProps {
  readonly style?: ViewStyle;
}

export default function ExplainerCard({ style }: ExplainerCardProps) {
  return (
    <ThemedView style={[styles.container, style]}>
      <ThemedText style={styles.heading}>About Handoff & Continuity</ThemedText>
      <ThemedText style={styles.body}>
        NSUserActivity is the unifying iOS primitive behind Handoff (cross-device continuation),
        state restoration, Spotlight indexing reuse (see feature 031), and Siri prediction. A single
        activity definition can power all four surfaces simultaneously.
      </ThemedText>
      <ThemedText style={styles.body}>
        Handoff requires four runtime conditions on both devices: same iCloud account, Bluetooth on,
        the Handoff toggle enabled in Settings, and both devices awake within ~10 m. Without all
        four, the receiving device shows nothing.
      </ThemedText>
      <ThemedText style={styles.note}>
        Note on prediction: Siri may surface the activity in Suggestions when
        `isEligibleForPrediction` is true. The OS, not your app, decides when to surface it.
      </ThemedText>
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
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.85,
  },
  note: {
    fontSize: 13,
    lineHeight: 18,
    opacity: 0.7,
    fontStyle: 'italic',
  },
});
