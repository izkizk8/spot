/**
 * HistoryLog — Renders the most recent biometric authenticate attempts.
 *
 * Newest-first. Capped to 10 entries by the hook before reaching this
 * component.
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

import type { AuthAttempt } from '../hooks/useBiometricAuth';

interface HistoryLogProps {
  history: AuthAttempt[];
}

function describe(a: AuthAttempt): string {
  if (a.success) return '✓ success';
  if (a.error === 'user_cancel') return 'ℹ cancelled';
  return `✗ ${a.error ?? 'unknown'}`;
}

export default function HistoryLog({ history }: HistoryLogProps) {
  return (
    <ThemedView style={styles.container} type="backgroundElement" testID="localauth-history">
      <ThemedText type="subtitle" style={styles.title}>
        History (last {history.length})
      </ThemedText>

      {history.length === 0 ? (
        <ThemedText type="small" themeColor="textSecondary">
          No attempts yet
        </ThemedText>
      ) : (
        history.map((entry) => (
          <View
            key={`${entry.timestamp}-${entry.success}`}
            style={styles.row}
            testID="localauth-history-row"
          >
            <ThemedText type="small">{describe(entry)}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {entry.timestamp}
            </ThemedText>
          </View>
        ))
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.three,
    borderRadius: Spacing.two,
    gap: Spacing.one,
  },
  title: {
    marginBottom: Spacing.one,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.half,
  },
});
