/**
 * StoreKit Lab — iOS screen (feature 050).
 *
 * Composes the showcase sections: CapabilityCard,
 * ProductsList, EntitlementsList, TransactionHistory,
 * SubscriptionStatusCard, RestoreButton, SetupInstructions.
 * The native bridge is exercised through the `useStoreKit`
 * hook.
 */

import React, { useEffect } from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

import CapabilityCard from './components/CapabilityCard';
import EntitlementsList from './components/EntitlementsList';
import ProductsList from './components/ProductsList';
import RestoreButton from './components/RestoreButton';
import SetupInstructions from './components/SetupInstructions';
import SubscriptionStatusCard from './components/SubscriptionStatusCard';
import TransactionHistory from './components/TransactionHistory';
import { useStoreKit } from './hooks/useStoreKit';

export default function StoreKitLabScreen() {
  const sk = useStoreKit();
  const { loadProducts, refreshEntitlements, refreshHistory, refreshSubscriptionStatuses } = sk;

  useEffect(() => {
    void loadProducts();
    void refreshEntitlements();
    void refreshHistory();
    void refreshSubscriptionStatuses();
  }, [loadProducts, refreshEntitlements, refreshHistory, refreshSubscriptionStatuses]);

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <CapabilityCard
          style={styles.card}
          available={sk.products.length > 0}
          productIds={sk.productIds}
        />
        <ProductsList
          style={styles.card}
          products={sk.products}
          loading={sk.isLoading}
          purchasingProductId={
            sk.isPurchasing ? (sk.lastPurchase?.transaction?.productId ?? null) : null
          }
          onPurchase={(id) => {
            void sk.purchase(id);
          }}
        />
        <EntitlementsList style={styles.card} entitlements={sk.entitlements} />
        <TransactionHistory style={styles.card} history={sk.history} />
        <SubscriptionStatusCard style={styles.card} statuses={sk.subscriptionStatuses} />
        <RestoreButton
          style={styles.card}
          onPress={() => {
            void sk.restore();
          }}
          loading={sk.isRestoring}
        />
        <SetupInstructions style={styles.card} />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.three,
    gap: Spacing.three,
  },
  card: {
    marginBottom: Spacing.two,
  },
});
