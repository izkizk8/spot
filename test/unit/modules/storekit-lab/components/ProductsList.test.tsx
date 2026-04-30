/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render } from '@testing-library/react-native';

import ProductsList from '@/modules/storekit-lab/components/ProductsList';
import type { StoreKitProduct } from '@/native/storekit.types';

const products: readonly StoreKitProduct[] = [
  {
    id: 'com.acme.a',
    type: 'consumable',
    displayName: 'A',
    description: 'a',
    displayPrice: '$0.99',
    price: '0.99',
    currencyCode: 'USD',
  },
  {
    id: 'com.acme.b',
    type: 'autoRenewable',
    displayName: 'B',
    description: 'b',
    displayPrice: '$1.99',
    price: '1.99',
    currencyCode: 'USD',
  },
];

describe('ProductsList', () => {
  it('renders a spinner while loading', () => {
    const { getByTestId } = render(
      <ProductsList
        products={[]}
        loading={true}
        purchasingProductId={null}
        onPurchase={() => {}}
      />,
    );
    expect(getByTestId('storekit-products-list-spinner')).toBeTruthy();
  });

  it('renders the empty state when not loading and no products', () => {
    const { getByTestId } = render(
      <ProductsList
        products={[]}
        loading={false}
        purchasingProductId={null}
        onPurchase={() => {}}
      />,
    );
    expect(getByTestId('storekit-products-list-empty')).toBeTruthy();
  });

  it('renders one row per product', () => {
    const { getByTestId } = render(
      <ProductsList
        products={products}
        loading={false}
        purchasingProductId={null}
        onPurchase={() => {}}
      />,
    );
    products.forEach((p) => {
      expect(getByTestId(`storekit-product-row-${p.id}`)).toBeTruthy();
    });
  });

  it('marks the purchasing row as busy', () => {
    const { getByTestId } = render(
      <ProductsList
        products={products}
        loading={false}
        purchasingProductId="com.acme.a"
        onPurchase={() => {}}
      />,
    );
    expect(getByTestId('storekit-product-row-com.acme.a-spinner')).toBeTruthy();
  });
});
