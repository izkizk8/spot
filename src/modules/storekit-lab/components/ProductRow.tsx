/**
 * ProductRow — StoreKit Lab (feature 050).
 *
 * One row inside ProductsList. Renders the product metadata and
 * a Buy button that delegates to the parent.
 */

import React, { useCallback } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import type { StoreKitProduct } from '@/native/storekit.types';

import { formatPrice } from '../demo-products';

interface ProductRowProps {
  readonly style?: ViewStyle;
  readonly product: StoreKitProduct;
  readonly busy: boolean;
  readonly onPurchase: (productId: string) => void;
}

export default function ProductRow({ style, product, busy, onPurchase }: ProductRowProps) {
  const onPress = useCallback(() => {
    onPurchase(product.id);
  }, [onPurchase, product.id]);

  return (
    <ThemedView
      style={[styles.container, style]}
      type='backgroundElement'
      testID={`storekit-product-row-${product.id}`}
    >
      <View style={styles.header}>
        <ThemedText type='smallBold' testID={`storekit-product-row-${product.id}-name`}>
          {product.displayName || product.id}
        </ThemedText>
        <ThemedText type='small' testID={`storekit-product-row-${product.id}-price`}>
          {formatPrice(product)}
        </ThemedText>
      </View>
      <ThemedText
        type='small'
        themeColor='textSecondary'
        testID={`storekit-product-row-${product.id}-type`}
      >
        Type: {product.type}
      </ThemedText>
      <ThemedText type='small' themeColor='textSecondary'>
        {product.description}
      </ThemedText>
      <Pressable
        onPress={onPress}
        disabled={busy}
        accessibilityRole='button'
        accessibilityState={{ disabled: busy, busy }}
        testID={`storekit-product-row-${product.id}-buy`}
        style={[styles.buyBtn, busy && styles.buyBtnDisabled]}
      >
        {busy ? (
          <ActivityIndicator
            color='#ffffff'
            testID={`storekit-product-row-${product.id}-spinner`}
          />
        ) : (
          <ThemedText type='small' style={styles.buyLabel}>
            Buy
          </ThemedText>
        )}
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.three,
    gap: Spacing.one,
    borderRadius: Spacing.two,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  buyBtn: {
    backgroundColor: '#0a84ff',
    borderRadius: Spacing.two,
    paddingVertical: Spacing.two,
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  buyBtnDisabled: {
    opacity: 0.4,
  },
  buyLabel: {
    color: '#ffffff',
    fontWeight: '700',
  },
});
