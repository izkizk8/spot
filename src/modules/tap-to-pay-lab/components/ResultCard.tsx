/**
 * ResultCard Component
 * Feature: 051-tap-to-pay
 *
 * Displays last payment result (success/declined/error).
 */

import React from 'react';
import { StyleSheet, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

import type { PaymentResult } from '@/native/taptopay.types';

interface ResultCardProps {
  result: PaymentResult | null;
  style?: ViewStyle;
}

export default function ResultCard({ result, style }: ResultCardProps) {
  if (!result) {
    return (
      <ThemedView style={[styles.container, style]}>
        <ThemedText style={styles.title}>Last Result</ThemedText>
        <ThemedText style={styles.noResult}>No payment attempts yet</ThemedText>
      </ThemedView>
    );
  }

  const outcomeColor =
    result.outcome === 'success' ? 'green' : result.outcome === 'declined' ? 'orange' : 'red';

  return (
    <ThemedView style={[styles.container, style]}>
      <ThemedText style={styles.title}>Last Result</ThemedText>
      <ThemedView style={styles.row}>
        <ThemedText style={[styles.outcomePill, { color: outcomeColor }]}>
          {result.outcome}
        </ThemedText>
      </ThemedView>

      {result.outcome === 'success' && (
        <>
          {result.transactionId && (
            <ThemedText style={styles.detail}>Transaction ID: {result.transactionId}</ThemedText>
          )}
          {result.amount !== undefined && result.currency && (
            <ThemedText style={styles.detail}>
              Amount: {result.amount} {result.currency}
            </ThemedText>
          )}
        </>
      )}

      {result.outcome === 'declined' && result.declinedReason && (
        <ThemedText style={styles.detail}>Reason: {result.declinedReason}</ThemedText>
      )}

      {result.outcome === 'error' && result.errorMessage && (
        <ThemedText style={styles.detail}>Error: {result.errorMessage}</ThemedText>
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
  noResult: {
    fontSize: 14,
    opacity: 0.6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  outcomePill: {
    fontSize: 16,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  detail: {
    fontSize: 14,
  },
});
