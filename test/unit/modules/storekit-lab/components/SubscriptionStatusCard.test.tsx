/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render } from '@testing-library/react-native';

import SubscriptionStatusCard from '@/modules/storekit-lab/components/SubscriptionStatusCard';
import type { SubscriptionStatusInfo } from '@/native/storekit.types';

describe('SubscriptionStatusCard', () => {
  it('renders an empty state when there are no statuses', () => {
    const { getByTestId } = render(<SubscriptionStatusCard statuses={[]} />);
    expect(getByTestId('storekit-subscription-status-card-empty')).toBeTruthy();
  });

  it('renders a row per subscription status', () => {
    const statuses: readonly SubscriptionStatusInfo[] = [
      {
        productId: 'com.acme.sub.monthly',
        state: 'subscribed',
        willAutoRenew: true,
        expirationDate: 1800000000000,
      },
      {
        productId: 'com.acme.sub.season',
        state: 'expired',
        willAutoRenew: false,
        expirationDate: null,
      },
    ];
    const { getByTestId } = render(<SubscriptionStatusCard statuses={statuses} />);
    statuses.forEach((s) => {
      expect(getByTestId(`storekit-subscription-status-card-row-${s.productId}`)).toBeTruthy();
    });
  });
});
