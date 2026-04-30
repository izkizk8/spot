/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render } from '@testing-library/react-native';

import EntitlementsList from '@/modules/storekit-lab/components/EntitlementsList';
import type { EntitlementSummary } from '@/native/storekit.types';

describe('EntitlementsList', () => {
  it('renders an empty state when there are no entitlements', () => {
    const { getByTestId } = render(<EntitlementsList entitlements={[]} />);
    expect(getByTestId('storekit-entitlements-list-empty')).toBeTruthy();
  });

  it('renders a row per entitlement', () => {
    const ents: readonly EntitlementSummary[] = [
      {
        productId: 'com.acme.unlock',
        productType: 'nonConsumable',
        purchaseDate: 1700000000000,
        expirationDate: null,
      },
      {
        productId: 'com.acme.sub',
        productType: 'autoRenewable',
        purchaseDate: 1700000000000,
        expirationDate: 1800000000000,
      },
    ];
    const { getByTestId } = render(<EntitlementsList entitlements={ents} />);
    ents.forEach((e) => {
      expect(getByTestId(`storekit-entitlements-list-row-${e.productId}`)).toBeTruthy();
    });
  });
});
