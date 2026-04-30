/**
 * CapabilityCard — Apple Pay Lab (feature 049).
 *
 * Renders the overall `canMakePayments` flag plus a per-network
 * support grid. Pure presentational + controlled.
 */

import React from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import type { SupportedNetwork } from '@/native/applepay.types';

import { NETWORK_CATALOG } from '../supported-networks';

interface CapabilityCardProps {
  readonly style?: ViewStyle;
  readonly canMakePayments: boolean;
  readonly perNetwork: Readonly<Record<SupportedNetwork, boolean>>;
}

export default function CapabilityCard({
  style,
  canMakePayments,
  perNetwork,
}: CapabilityCardProps) {
  return (
    <ThemedView
      style={[styles.container, style]}
      type="backgroundElement"
      testID="apple-pay-capability-card"
    >
      <ThemedText type="smallBold">Apple Pay capability</ThemedText>
      <ThemedText type="small" testID="apple-pay-capability-overall">
        {canMakePayments
          ? '✅ canMakePayments() returned true.'
          : '⛔ canMakePayments() returned false. Apple Pay is unavailable on this device.'}
      </ThemedText>
      <View style={styles.grid} testID="apple-pay-capability-networks">
        {NETWORK_CATALOG.map((n) => {
          const ok = perNetwork[n.id];
          return (
            <View key={n.id} style={styles.row}>
              <ThemedText type="small" themeColor="textSecondary" style={styles.rowLabel}>
                {n.displayName}
              </ThemedText>
              <ThemedText type="small" testID={`apple-pay-capability-network-${n.id}`}>
                {ok ? '✅' : '⛔'}
              </ThemedText>
            </View>
          );
        })}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.three,
    gap: Spacing.two,
    borderRadius: Spacing.two,
  },
  grid: {
    gap: Spacing.one,
    marginTop: Spacing.two,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rowLabel: {
    flex: 1,
  },
});
