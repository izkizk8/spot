/**
 * SubscriptionStatusCard — StoreKit Lab (feature 050).
 *
 * Renders the renewal/state info for auto-renewable
 * subscriptions returned by the bridge. Pure presentational.
 */

import React from 'react';
import { StyleSheet, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import type { SubscriptionStatusInfo } from '@/native/storekit.types';

interface SubscriptionStatusCardProps {
  readonly style?: ViewStyle;
  readonly statuses: readonly SubscriptionStatusInfo[];
}

function formatDate(ms: number | null): string {
  if (ms === null || !Number.isFinite(ms) || ms <= 0) return '—';
  return new Date(ms).toISOString();
}

export default function SubscriptionStatusCard({ style, statuses }: SubscriptionStatusCardProps) {
  return (
    <ThemedView
      style={[styles.container, style]}
      type='backgroundElement'
      testID='storekit-subscription-status-card'
    >
      <ThemedText type='smallBold'>Subscription status</ThemedText>
      {statuses.length === 0 ? (
        <ThemedText
          type='small'
          themeColor='textSecondary'
          testID='storekit-subscription-status-card-empty'
        >
          No subscription status info. Configure auto-renewable products to see renewal state.
        </ThemedText>
      ) : (
        statuses.map((s) => (
          <ThemedView
            key={s.productId}
            style={styles.row}
            type='backgroundElement'
            testID={`storekit-subscription-status-card-row-${s.productId}`}
          >
            <ThemedText type='small'>{s.productId}</ThemedText>
            <ThemedText type='small' themeColor='textSecondary'>
              state: {s.state} • auto-renew: {s.willAutoRenew ? 'yes' : 'no'} • expires{' '}
              {formatDate(s.expirationDate)}
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
