/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, waitFor } from '@testing-library/react-native';

import { __setStoreKitBridgeForTests } from '@/modules/storekit-lab/hooks/useStoreKit';
import type { StoreKitBridge } from '@/native/storekit.types';

const mockBridge: StoreKitBridge = {
  products: jest.fn(async () => []),
  purchase: jest.fn(async () => ({
    outcome: 'success' as const,
    transaction: null,
    errorMessage: null,
  })),
  currentEntitlements: jest.fn(async () => []),
  transactionHistory: jest.fn(async () => []),
  subscriptionStatuses: jest.fn(async () => []),
  restore: jest.fn(async () => undefined),
};

beforeEach(() => {
  __setStoreKitBridgeForTests(mockBridge);
});

afterEach(() => {
  __setStoreKitBridgeForTests(null);
  jest.clearAllMocks();
});

import StoreKitLabScreen from '@/modules/storekit-lab/screen';

describe('storekit-lab screen (iOS)', () => {
  it('renders all primary sections', () => {
    const { getByTestId } = render(<StoreKitLabScreen />);
    expect(getByTestId('storekit-capability-card')).toBeTruthy();
    expect(getByTestId('storekit-products-list')).toBeTruthy();
    expect(getByTestId('storekit-entitlements-list')).toBeTruthy();
    expect(getByTestId('storekit-transaction-history')).toBeTruthy();
    expect(getByTestId('storekit-subscription-status-card')).toBeTruthy();
    expect(getByTestId('storekit-restore-button')).toBeTruthy();
    expect(getByTestId('storekit-setup-instructions')).toBeTruthy();
  });

  it('triggers a load on mount via the bridge', async () => {
    render(<StoreKitLabScreen />);
    await waitFor(() => {
      expect(mockBridge.products).toHaveBeenCalled();
    });
    expect(mockBridge.currentEntitlements).toHaveBeenCalled();
    expect(mockBridge.transactionHistory).toHaveBeenCalled();
    expect(mockBridge.subscriptionStatuses).toHaveBeenCalled();
  });
});
