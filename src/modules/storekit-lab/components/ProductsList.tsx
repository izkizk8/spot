/**
 * ProductsList — StoreKit Lab (feature 050).
 *
 * Renders the list of fetched products. Loading state shows a
 * spinner; empty state explains that no products were returned
 * (the operator likely has not configured a Configuration.storekit
 * file or App Store Connect catalog).
 */

import React from 'react';
import { ActivityIndicator, StyleSheet, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import type { StoreKitProduct } from '@/native/storekit.types';

import ProductRow from './ProductRow';

interface ProductsListProps {
  readonly style?: ViewStyle;
  readonly products: readonly StoreKitProduct[];
  readonly loading: boolean;
  readonly purchasingProductId: string | null;
  readonly onPurchase: (productId: string) => void;
}

export default function ProductsList({
  style,
  products,
  loading,
  purchasingProductId,
  onPurchase,
}: ProductsListProps) {
  return (
    <ThemedView
      style={[styles.container, style]}
      type='backgroundElement'
      testID='storekit-products-list'
    >
      <ThemedText type='smallBold'>Products</ThemedText>
      {loading ? (
        <ActivityIndicator testID='storekit-products-list-spinner' />
      ) : products.length === 0 ? (
        <ThemedText type='small' themeColor='textSecondary' testID='storekit-products-list-empty'>
          No products returned. Add a Configuration.storekit file in Xcode or wire up an App Store
          Connect catalog, then load again.
        </ThemedText>
      ) : (
        products.map((p) => (
          <ProductRow
            key={p.id}
            product={p}
            busy={purchasingProductId === p.id}
            onPurchase={onPurchase}
          />
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
});
