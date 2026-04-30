/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render } from '@testing-library/react-native';

import TransactionHistory from '@/modules/storekit-lab/components/TransactionHistory';
import type { StoreKitTransaction } from '@/native/storekit.types';

describe('TransactionHistory', () => {
  it('renders an empty state when there are no transactions', () => {
    const { getByTestId } = render(<TransactionHistory history={[]} />);
    expect(getByTestId('storekit-transaction-history-empty')).toBeTruthy();
  });

  it('renders a row per transaction', () => {
    const history: readonly StoreKitTransaction[] = [
      {
        id: 'tx-1',
        productId: 'com.acme.coins',
        productType: 'consumable',
        purchaseDate: 1700000000000,
        expirationDate: null,
        isUpgraded: false,
      },
      {
        id: 'tx-2',
        productId: 'com.acme.sub',
        productType: 'autoRenewable',
        purchaseDate: 1700000000000,
        expirationDate: 1800000000000,
        isUpgraded: true,
      },
    ];
    const { getByTestId } = render(<TransactionHistory history={history} />);
    history.forEach((t) => {
      expect(getByTestId(`storekit-transaction-history-row-${t.id}`)).toBeTruthy();
    });
  });
});
