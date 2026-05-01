/**
 * IntentSimulator Component
 * Feature: 071-sirikit
 *
 * Display-only list of simulated SiriKit intents.
 */

import React from 'react';
import { StyleSheet, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import type { IntentDomain, IntentItem } from '@/native/sirikit.types';

interface IntentSimulatorProps {
  intents: readonly IntentItem[];
  onSimulate: (domain: IntentDomain, utterance: string) => void;
  onHandle: (id: string) => void;
  loading: boolean;
  style?: ViewStyle;
}

export default function IntentSimulator({ intents, style }: IntentSimulatorProps) {
  return (
    <ThemedView style={[styles.container, style]}>
      <ThemedText style={styles.title}>Intent Simulator</ThemedText>
      {intents.length === 0 ? (
        <ThemedText style={styles.help}>No intents simulated yet.</ThemedText>
      ) : (
        intents.map((item) => (
          <ThemedView key={item.id} style={styles.row}>
            <ThemedText style={styles.utterance}>{item.utterance}</ThemedText>
            <ThemedText style={styles.help}>
              {item.domain} · {item.status}
            </ThemedText>
            {item.response !== null ? (
              <ThemedText style={styles.help}>Response: {item.response}</ThemedText>
            ) : null}
          </ThemedView>
        ))
      )}
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
  row: {
    paddingVertical: Spacing.one,
    gap: Spacing.half,
  },
  utterance: {
    fontSize: 15,
    fontWeight: '600',
  },
  help: {
    fontSize: 13,
    opacity: 0.8,
  },
});
