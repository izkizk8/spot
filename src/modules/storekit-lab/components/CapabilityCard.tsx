/**
 * CapabilityCard — StoreKit Lab (feature 050).
 *
 * Renders the store-availability flag and the configured
 * product ids so the operator can confirm which products will
 * be requested.
 */

import React from 'react';
import { StyleSheet, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

interface CapabilityCardProps {
  readonly style?: ViewStyle;
  readonly available: boolean;
  readonly productIds: readonly string[];
}

export default function CapabilityCard({ style, available, productIds }: CapabilityCardProps) {
  return (
    <ThemedView
      style={[styles.container, style]}
      type="backgroundElement"
      testID="storekit-capability-card"
    >
      <ThemedText type="smallBold">StoreKit 2 capability</ThemedText>
      <ThemedText type="small" testID="storekit-capability-overall">
        {available
          ? '✅ Store available — products were returned by the bridge.'
          : '⚠️ Store empty or unavailable — load products and inspect the result.'}
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        Configured product ids ({productIds.length})
      </ThemedText>
      {productIds.map((id) => (
        <ThemedText key={id} type="small" testID={`storekit-capability-product-${id}`}>
          • {id}
        </ThemedText>
      ))}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.three,
    gap: Spacing.one,
    borderRadius: Spacing.two,
  },
});
