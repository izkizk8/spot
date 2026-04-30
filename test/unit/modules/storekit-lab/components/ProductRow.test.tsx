/**
 * @jest-environment jsdom
 */

import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import ProductRow from '@/modules/storekit-lab/components/ProductRow';
import type { StoreKitProduct } from '@/native/storekit.types';

const product: StoreKitProduct = {
  id: 'com.acme.coins',
  type: 'consumable',
  displayName: '100 Coins',
  description: 'Replenishable.',
  displayPrice: '$0.99',
  price: '0.99',
  currencyCode: 'USD',
};

describe('ProductRow', () => {
  it('renders the product metadata', () => {
    const { getByTestId } = render(
      <ProductRow product={product} busy={false} onPurchase={() => {}} />,
    );
    expect(getByTestId(`storekit-product-row-${product.id}`)).toBeTruthy();
    expect(getByTestId(`storekit-product-row-${product.id}-name`).props.children).toBe('100 Coins');
    expect(getByTestId(`storekit-product-row-${product.id}-price`).props.children).toBe('$0.99');
    expect(getByTestId(`storekit-product-row-${product.id}-type`).props.children).toEqual([
      'Type: ',
      'consumable',
    ]);
  });

  it('fires onPurchase with the product id when Buy is pressed', () => {
    const onPurchase = jest.fn();
    const { getByTestId } = render(
      <ProductRow product={product} busy={false} onPurchase={onPurchase} />,
    );
    fireEvent.press(getByTestId(`storekit-product-row-${product.id}-buy`));
    expect(onPurchase).toHaveBeenCalledWith(product.id);
  });

  it('disables the Buy button and shows a spinner when busy', () => {
    const onPurchase = jest.fn();
    const { getByTestId } = render(
      <ProductRow product={product} busy={true} onPurchase={onPurchase} />,
    );
    fireEvent.press(getByTestId(`storekit-product-row-${product.id}-buy`));
    expect(onPurchase).not.toHaveBeenCalled();
    expect(getByTestId(`storekit-product-row-${product.id}-spinner`)).toBeTruthy();
    const btn = getByTestId(`storekit-product-row-${product.id}-buy`);
    expect(btn.props.accessibilityState.busy).toBe(true);
    expect(btn.props.accessibilityState.disabled).toBe(true);
  });

  it('falls back to product id when displayName is empty', () => {
    const { getByTestId } = render(
      <ProductRow product={{ ...product, displayName: '' }} busy={false} onPurchase={() => {}} />,
    );
    expect(getByTestId(`storekit-product-row-${product.id}-name`).props.children).toBe(product.id);
  });
});
