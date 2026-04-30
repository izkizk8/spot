/**
 * EntitlementsList — StoreKit Lab (feature 050).
 *
 * Renders `Transaction.currentEntitlements` (the snapshot of
 * the user's currently active purchases). Pure presentational.
 */

import React from 'react';
import { StyleSheet, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import type { EntitlementSummary } from '@/native/storekit.types';

interface EntitlementsListProps {
  readonly style?: ViewStyle;
  readonly entitlements: readonly EntitlementSummary[];
}

function formatDate(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) return '—';
  return new Date(ms).toISOString();
}

export default function EntitlementsList({ style, entitlements }: EntitlementsListProps) {
  return (
    <ThemedView
      style={[styles.container, style]}
      type="backgroundElement"
      testID="storekit-entitlements-list"
    >
      <ThemedText type="smallBold">Active entitlements</ThemedText>
      {entitlements.length === 0 ? (
        <ThemedText
          type="small"
          themeColor="textSecondary"
          testID="storekit-entitlements-list-empty"
        >
          No active entitlements. Make a purchase to populate this list.
        </ThemedText>
      ) : (
        entitlements.map((e) => (
          <ThemedView
            key={e.productId}
            style={styles.row}
            type="backgroundElement"
            testID={`storekit-entitlements-list-row-${e.productId}`}
          >
            <ThemedText type="small">{e.productId}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {e.productType} • purchased {formatDate(e.purchaseDate)}
              {e.expirationDate ? ` • expires ${formatDate(e.expirationDate)}` : ''}
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
