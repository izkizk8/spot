/**
 * ResultCard — Renders the most recent biometric authenticate attempt.
 *
 * Surfaces success, error type, and warning, plus an ISO timestamp. When
 * `result === null`, renders a "No result yet" placeholder.
 */

import React from 'react';
import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

import type { AuthAttempt } from '../hooks/useBiometricAuth';

interface ResultCardProps {
  result: AuthAttempt | null;
}

export default function ResultCard({ result }: ResultCardProps) {
  return (
    <ThemedView style={styles.container} type="backgroundElement" testID="localauth-result">
      <ThemedText type="subtitle" style={styles.title}>
        Last Result
      </ThemedText>

      {result === null ? (
        <ThemedText type="small" themeColor="textSecondary">
          No result yet
        </ThemedText>
      ) : result.success ? (
        <>
          <ThemedText type="default" testID="localauth-result-status">
            ✅ Success
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary" testID="localauth-result-timestamp">
            {result.timestamp}
          </ThemedText>
        </>
      ) : (
        <>
          <ThemedText
            type="default"
            themeColor={result.error === 'user_cancel' ? 'textSecondary' : 'tintB'}
            testID="localauth-result-status"
          >
            {result.error === 'user_cancel' ? 'ℹ️ Cancelled' : `⚠️ ${result.error ?? 'unknown'}`}
          </ThemedText>
          {result.warning && (
            <ThemedText type="small" themeColor="textSecondary">
              Warning: {result.warning}
            </ThemedText>
          )}
          <ThemedText type="small" themeColor="textSecondary" testID="localauth-result-timestamp">
            {result.timestamp}
          </ThemedText>
        </>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.three,
    borderRadius: Spacing.two,
    gap: Spacing.two,
  },
  title: {
    marginBottom: Spacing.one,
  },
});
