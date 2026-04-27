/**
 * ShortcutsGuideCard — numbered steps + Open Shortcuts button.
 *
 * If onOpenShortcuts is omitted, the button calls
 * Linking.openURL('shortcuts://') directly and surfaces failure inline.
 */

import React, { useState } from 'react';
import { Linking, Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

export interface ShortcutsGuideCardProps {
  readonly onOpenShortcuts?: () => void | Promise<void>;
}

const STEPS: readonly string[] = [
  'Open Shortcuts.',
  'Find "Spot" in the app actions list.',
  'Run "Log mood" with a mood, "Get last mood", or "Greet user".',
  'Return to Spot — your entry appears in Mood History.',
];

export function ShortcutsGuideCard({ onOpenShortcuts }: ShortcutsGuideCardProps) {
  const [error, setError] = useState<string | null>(null);

  const defaultOpen = async (): Promise<void> => {
    try {
      await Linking.openURL('shortcuts://');
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to open Shortcuts');
    }
  };

  const handlePress = async (): Promise<void> => {
    if (onOpenShortcuts) {
      try {
        await onOpenShortcuts();
        setError(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to open Shortcuts');
      }
      return;
    }
    await defaultOpen();
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.heading}>Shortcuts integration guide</ThemedText>
      <ThemedText style={styles.body}>
        The three intents — Log mood, Get last mood, Greet user — appear under Spot in the Shortcuts
        app. Use them to drive the in-app event log from outside the app.
      </ThemedText>
      <ThemedView style={styles.steps}>
        {STEPS.map((step, i) => (
          <ThemedText key={i} style={styles.step}>
            {i + 1}. {step}
          </ThemedText>
        ))}
      </ThemedView>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Open Shortcuts app"
        onPress={handlePress}
        style={styles.button}
      >
        <ThemedText style={styles.buttonText}>Open Shortcuts</ThemedText>
      </Pressable>
      {error != null && (
        <ThemedText style={styles.error} testID="shortcuts-error">
          {error}
        </ThemedText>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Spacing.two,
    borderWidth: 1,
    borderColor: '#D0D1D6',
  },
  heading: {
    fontSize: 16,
    fontWeight: '600',
  },
  body: {
    fontSize: 14,
  },
  steps: {
    gap: Spacing.half,
  },
  step: {
    fontSize: 14,
  },
  button: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.one,
    backgroundColor: '#007AFF',
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  error: {
    fontSize: 12,
    color: '#D70015',
  },
});
