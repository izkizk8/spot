/**
 * TransactionHistory — StoreKit Lab (feature 050).
 *
 * Renders the `Transaction.all` snapshot. Pure presentational.
 */

import React from 'react';
import { StyleSheet, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import type { StoreKitTransaction } from '@/native/storekit.types';

interface TransactionHistoryProps {
  readonly style?: ViewStyle;
  readonly history: readonly StoreKitTransaction[];
}

function formatDate(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) return '—';
  return new Date(ms).toISOString();
}

export default function TransactionHistory({ style, history }: TransactionHistoryProps) {
  return (
    <ThemedView
      style={[styles.container, style]}
      type="backgroundElement"
      testID="storekit-transaction-history"
    >
      <ThemedText type="smallBold">Transaction history</ThemedText>
      {history.length === 0 ? (
        <ThemedText
          type="small"
          themeColor="textSecondary"
          testID="storekit-transaction-history-empty"
        >
          No transactions yet.
        </ThemedText>
      ) : (
        history.map((t) => (
          <ThemedView
            key={t.id}
            style={styles.row}
            type="backgroundElement"
            testID={`storekit-transaction-history-row-${t.id}`}
          >
            <ThemedText type="small">
              {t.productId} ({t.productType})
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              tx {t.id} • {formatDate(t.purchaseDate)}
              {t.expirationDate ? ` → ${formatDate(t.expirationDate)}` : ''}
              {t.isUpgraded ? ' • upgraded' : ''}
            </ThemedText>
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
    borderRadius: Spacing.two,
  },
  row: {
    gap: Spacing.one,
  },
});
