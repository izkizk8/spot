/**
 * useStoreKit hook tests.
 * Feature: 050-storekit-2
 *
 * The native bridge is mocked at the import boundary via
 * `__setStoreKitBridgeForTests`. The hook is exercised inside a
 * minimal React component via @testing-library/react-native.
 *
 * @jest-environment jsdom
 */

import React from 'react';
import { Text } from 'react-native';
import { act, render } from '@testing-library/react-native';

import {
  __setStoreKitBridgeForTests,
  useStoreKit,
  type UseStoreKitReturn,
} from '@/modules/storekit-lab/hooks/useStoreKit';
import { DEMO_PRODUCT_IDS } from '@/modules/storekit-lab/demo-products';
import type {
  EntitlementSummary,
  PurchaseResult,
  StoreKitBridge,
  StoreKitProduct,
  StoreKitTransaction,
  SubscriptionStatusInfo,
} from '@/native/storekit.types';

interface MockBridge extends StoreKitBridge {
  products: jest.Mock;
  purchase: jest.Mock;
  currentEntitlements: jest.Mock;
  transactionHistory: jest.Mock;
  subscriptionStatuses: jest.Mock;
  restore: jest.Mock;
}

function makeBridge(): MockBridge {
  const product: StoreKitProduct = {
    id: 'com.izkizk8.spot.coins.100',
    type: 'consumable',
    displayName: '100 Coins',
    description: 'Replenishable coins.',
    displayPrice: '$0.99',
    price: '0.99',
    currencyCode: 'USD',
  };
  const transaction: StoreKitTransaction = {
    id: 'tx-1',
    productId: product.id,
    productType: 'consumable',
    purchaseDate: 1700000000000,
    expirationDate: null,
    isUpgraded: false,
  };
  const entitlement: EntitlementSummary = {
    productId: 'com.izkizk8.spot.unlock.pro',
    productType: 'nonConsumable',
    purchaseDate: 1700000000000,
    expirationDate: null,
  };
  const status: SubscriptionStatusInfo = {
    productId: 'com.izkizk8.spot.sub.monthly',
    state: 'subscribed',
    willAutoRenew: true,
    expirationDate: 1800000000000,
  };
  const purchaseResult: PurchaseResult = {
    outcome: 'success',
    transaction,
    errorMessage: null,
  };
  return {
    products: jest.fn(
      async (_ids: readonly string[]): Promise<readonly StoreKitProduct[]> => [product],
    ),
    purchase: jest.fn(async (_id: string): Promise<PurchaseResult> => purchaseResult),
    currentEntitlements: jest.fn(async (): Promise<readonly EntitlementSummary[]> => [entitlement]),
    transactionHistory: jest.fn(async (): Promise<readonly StoreKitTransaction[]> => [transaction]),
    subscriptionStatuses: jest.fn(async (): Promise<readonly SubscriptionStatusInfo[]> => [status]),
    restore: jest.fn(async (): Promise<void> => undefined),
  };
}

const handle: { current: UseStoreKitReturn | null } = { current: null };

function Probe({ ids }: { ids?: readonly string[] }) {
  const r = useStoreKit(ids ? { productIds: ids } : undefined);
  React.useEffect(() => {
    handle.current = r;
  });
  return <Text testID="probe">probe</Text>;
}

describe('useStoreKit', () => {
  let bridge: MockBridge;

  beforeEach(() => {
    handle.current = null;
    bridge = makeBridge();
    __setStoreKitBridgeForTests(bridge);
  });

  afterEach(() => {
    __setStoreKitBridgeForTests(null);
  });

  it('starts with the demo catalog ids and empty collections', () => {
    render(<Probe />);
    expect(handle.current?.productIds).toEqual(DEMO_PRODUCT_IDS);
    expect(handle.current?.products).toEqual([]);
    expect(handle.current?.entitlements).toEqual([]);
    expect(handle.current?.history).toEqual([]);
    expect(handle.current?.subscriptionStatuses).toEqual([]);
    expect(handle.current?.lastPurchase).toBeNull();
    expect(handle.current?.lastError).toBeNull();
    expect(handle.current?.isLoading).toBe(false);
    expect(handle.current?.isPurchasing).toBe(false);
    expect(handle.current?.isRestoring).toBe(false);
  });

  it('honours an operator-supplied productIds list', () => {
    render(<Probe ids={['x.y.z']} />);
    expect(handle.current?.productIds).toEqual(['x.y.z']);
  });

  it('loadProducts() forwards productIds to the bridge and stores the result', async () => {
    render(<Probe />);
    await act(async () => {
      await handle.current?.loadProducts();
    });
    expect(bridge.products).toHaveBeenCalledWith(DEMO_PRODUCT_IDS);
    expect(handle.current?.products).toHaveLength(1);
    expect(handle.current?.products[0]?.id).toBe('com.izkizk8.spot.coins.100');
    expect(handle.current?.lastError).toBeNull();
    expect(handle.current?.isLoading).toBe(false);
  });

  it('loadProducts() surfaces a bridge rejection as lastError + empty list', async () => {
    bridge.products.mockRejectedValueOnce(new Error('catalog offline'));
    render(<Probe />);
    await act(async () => {
      await handle.current?.loadProducts();
    });
    expect(handle.current?.lastError).toBe('catalog offline');
    expect(handle.current?.products).toEqual([]);
  });

  it('refreshEntitlements() stores entitlements returned by the bridge', async () => {
    render(<Probe />);
    await act(async () => {
      await handle.current?.refreshEntitlements();
    });
    expect(handle.current?.entitlements).toHaveLength(1);
    expect(handle.current?.entitlements[0]?.productId).toBe('com.izkizk8.spot.unlock.pro');
  });

  it('refreshEntitlements() surfaces a bridge rejection as lastError', async () => {
    bridge.currentEntitlements.mockRejectedValueOnce(new Error('boom'));
    render(<Probe />);
    await act(async () => {
      await handle.current?.refreshEntitlements();
    });
    expect(handle.current?.lastError).toBe('boom');
    expect(handle.current?.entitlements).toEqual([]);
  });

  it('refreshHistory() stores history returned by the bridge', async () => {
    render(<Probe />);
    await act(async () => {
      await handle.current?.refreshHistory();
    });
    expect(handle.current?.history).toHaveLength(1);
    expect(handle.current?.history[0]?.id).toBe('tx-1');
  });

  it('refreshSubscriptionStatuses() stores statuses returned by the bridge', async () => {
    render(<Probe />);
    await act(async () => {
      await handle.current?.refreshSubscriptionStatuses();
    });
    expect(handle.current?.subscriptionStatuses).toHaveLength(1);
    expect(handle.current?.subscriptionStatuses[0]?.productId).toBe('com.izkizk8.spot.sub.monthly');
  });

  it('purchase() forwards the id to the bridge, stores result, and refreshes entitlements/history', async () => {
    render(<Probe />);
    await act(async () => {
      await handle.current?.purchase('com.izkizk8.spot.coins.100');
    });
    expect(bridge.purchase).toHaveBeenCalledWith('com.izkizk8.spot.coins.100');
    expect(handle.current?.lastPurchase?.outcome).toBe('success');
    // success outcome triggers entitlements + history refresh.
    expect(bridge.currentEntitlements).toHaveBeenCalled();
    expect(bridge.transactionHistory).toHaveBeenCalled();
    expect(handle.current?.entitlements).toHaveLength(1);
    expect(handle.current?.history).toHaveLength(1);
    expect(handle.current?.isPurchasing).toBe(false);
  });

  it('purchase() short-circuits when productId is empty', async () => {
    render(<Probe />);
    await act(async () => {
      await handle.current?.purchase('');
    });
    expect(bridge.purchase).not.toHaveBeenCalled();
    expect(handle.current?.lastPurchase?.outcome).toBe('userCancelled');
    expect(handle.current?.lastError).toMatch(/Product id is required/);
  });

  it('purchase() surfaces a userCancelled outcome without errors', async () => {
    bridge.purchase.mockResolvedValueOnce({
      outcome: 'userCancelled',
      transaction: null,
      errorMessage: null,
    });
    render(<Probe />);
    await act(async () => {
      await handle.current?.purchase('com.izkizk8.spot.coins.100');
    });
    expect(handle.current?.lastPurchase?.outcome).toBe('userCancelled');
    expect(handle.current?.lastError).toBeNull();
    // Cancelled does NOT trigger refresh.
    expect(bridge.currentEntitlements).not.toHaveBeenCalled();
  });

  it('purchase() surfaces a pending outcome', async () => {
    bridge.purchase.mockResolvedValueOnce({
      outcome: 'pending',
      transaction: null,
      errorMessage: null,
    });
    render(<Probe />);
    await act(async () => {
      await handle.current?.purchase('com.izkizk8.spot.coins.100');
    });
    expect(handle.current?.lastPurchase?.outcome).toBe('pending');
  });

  it('purchase() surfaces a bridge rejection as a userCancelled result with errorMessage', async () => {
    bridge.purchase.mockRejectedValueOnce(new Error('network'));
    render(<Probe />);
    await act(async () => {
      await handle.current?.purchase('com.izkizk8.spot.coins.100');
    });
    expect(handle.current?.lastPurchase?.outcome).toBe('userCancelled');
    expect(handle.current?.lastPurchase?.errorMessage).toBe('network');
    expect(handle.current?.lastError).toBe('network');
  });

  it('purchase() surfaces a bridge result errorMessage as lastError', async () => {
    bridge.purchase.mockResolvedValueOnce({
      outcome: 'success',
      transaction: null,
      errorMessage: 'verification failed',
    });
    render(<Probe />);
    await act(async () => {
      await handle.current?.purchase('com.izkizk8.spot.coins.100');
    });
    expect(handle.current?.lastError).toBe('verification failed');
  });

  it('restore() invokes AppStore.sync() and refreshes entitlements + history', async () => {
    render(<Probe />);
    await act(async () => {
      await handle.current?.restore();
    });
    expect(bridge.restore).toHaveBeenCalledTimes(1);
    expect(bridge.currentEntitlements).toHaveBeenCalled();
    expect(bridge.transactionHistory).toHaveBeenCalled();
    expect(handle.current?.isRestoring).toBe(false);
  });

  it('restore() surfaces a bridge rejection as lastError', async () => {
    bridge.restore.mockRejectedValueOnce(new Error('sync failed'));
    render(<Probe />);
    await act(async () => {
      await handle.current?.restore();
    });
    expect(handle.current?.lastError).toBe('sync failed');
    expect(handle.current?.isRestoring).toBe(false);
  });

  it('reset() clears lastPurchase and lastError', async () => {
    render(<Probe />);
    await act(async () => {
      await handle.current?.purchase('com.izkizk8.spot.coins.100');
    });
    expect(handle.current?.lastPurchase).not.toBeNull();
    act(() => {
      handle.current?.reset();
    });
    expect(handle.current?.lastPurchase).toBeNull();
    expect(handle.current?.lastError).toBeNull();
  });
});
