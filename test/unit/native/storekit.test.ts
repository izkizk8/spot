/**
 * @jest-environment node
 *
 * Bridge contract tests for `src/native/storekit.ts` and the
 * Android / Web variants. Validates the JS surface without
 * loading the iOS native module.
 */

import {
  PRODUCT_TYPES,
  PURCHASE_OUTCOMES,
  StoreKitNotSupported,
  SUBSCRIPTION_STATES,
} from '@/native/storekit.types';

describe('storekit.types', () => {
  it('PRODUCT_TYPES catalog covers all four StoreKit 2 product types', () => {
    expect(PRODUCT_TYPES).toEqual(['consumable', 'nonConsumable', 'autoRenewable', 'nonRenewing']);
    expect(Object.isFrozen(PRODUCT_TYPES)).toBe(true);
  });

  it('PURCHASE_OUTCOMES exposes the documented outcomes', () => {
    expect(PURCHASE_OUTCOMES).toEqual(['success', 'userCancelled', 'pending']);
    expect(Object.isFrozen(PURCHASE_OUTCOMES)).toBe(true);
  });

  it('SUBSCRIPTION_STATES is frozen and covers the documented states', () => {
    expect(Object.isFrozen(SUBSCRIPTION_STATES)).toBe(true);
    expect(SUBSCRIPTION_STATES).toEqual([
      'subscribed',
      'expired',
      'inBillingRetry',
      'inGracePeriod',
      'revoked',
    ]);
  });

  it('StoreKitNotSupported has the documented code and name', () => {
    const e = new StoreKitNotSupported();
    expect(e.code).toBe('STOREKIT_NOT_SUPPORTED');
    expect(e.name).toBe('StoreKitNotSupported');
    expect(e).toBeInstanceOf(Error);
  });

  it('StoreKitNotSupported accepts a custom message', () => {
    const e = new StoreKitNotSupported('boom');
    expect(e.message).toBe('boom');
  });
});

describe('storekit.android', () => {
  let android: typeof import('@/native/storekit.android');

  beforeAll(() => {
    android = require('@/native/storekit.android');
  });

  it('products() rejects with StoreKitNotSupported', async () => {
    await expect(android.products(['x'])).rejects.toBeInstanceOf(StoreKitNotSupported);
  });

  it('purchase() rejects with StoreKitNotSupported', async () => {
    await expect(android.purchase('x')).rejects.toBeInstanceOf(StoreKitNotSupported);
  });

  it('currentEntitlements() rejects with StoreKitNotSupported', async () => {
    await expect(android.currentEntitlements()).rejects.toBeInstanceOf(StoreKitNotSupported);
  });

  it('transactionHistory() rejects with StoreKitNotSupported', async () => {
    await expect(android.transactionHistory()).rejects.toBeInstanceOf(StoreKitNotSupported);
  });

  it('subscriptionStatuses() rejects with StoreKitNotSupported', async () => {
    await expect(android.subscriptionStatuses()).rejects.toBeInstanceOf(StoreKitNotSupported);
  });

  it('restore() rejects with StoreKitNotSupported', async () => {
    await expect(android.restore()).rejects.toBeInstanceOf(StoreKitNotSupported);
  });

  it('exposes a default storekit aggregate', () => {
    expect(typeof android.storekit.products).toBe('function');
    expect(android.default).toBe(android.storekit);
  });
});

describe('storekit.web', () => {
  let web: typeof import('@/native/storekit.web');

  beforeAll(() => {
    web = require('@/native/storekit.web');
  });

  it('products() rejects with StoreKitNotSupported', async () => {
    await expect(web.products(['x'])).rejects.toBeInstanceOf(StoreKitNotSupported);
  });

  it('purchase() rejects with StoreKitNotSupported', async () => {
    await expect(web.purchase('x')).rejects.toBeInstanceOf(StoreKitNotSupported);
  });

  it('currentEntitlements() rejects with StoreKitNotSupported', async () => {
    await expect(web.currentEntitlements()).rejects.toBeInstanceOf(StoreKitNotSupported);
  });

  it('restore() rejects with StoreKitNotSupported', async () => {
    await expect(web.restore()).rejects.toBeInstanceOf(StoreKitNotSupported);
  });
});

describe('storekit.ts (iOS variant) — null native module path', () => {
  let ios: typeof import('@/native/storekit');
  let TypesNotSupported: typeof StoreKitNotSupported;

  beforeAll(() => {
    jest.resetModules();
    jest.doMock('expo-modules-core', () => ({
      requireOptionalNativeModule: () => null,
    }));
    jest.doMock('react-native', () => ({
      Platform: { OS: 'ios' },
    }));
    ios = require('@/native/storekit');
    TypesNotSupported = require('@/native/storekit.types').StoreKitNotSupported;
  });

  afterAll(() => {
    jest.dontMock('expo-modules-core');
    jest.dontMock('react-native');
    jest.resetModules();
  });

  it('products() rejects with StoreKitNotSupported when the native module is missing', async () => {
    await expect(ios.products(['x'])).rejects.toBeInstanceOf(TypesNotSupported);
  });

  it('purchase() rejects with StoreKitNotSupported when the native module is missing', async () => {
    await expect(ios.purchase('x')).rejects.toBeInstanceOf(TypesNotSupported);
  });

  it('currentEntitlements() rejects with StoreKitNotSupported when the native module is missing', async () => {
    await expect(ios.currentEntitlements()).rejects.toBeInstanceOf(TypesNotSupported);
  });

  it('transactionHistory() rejects with StoreKitNotSupported when the native module is missing', async () => {
    await expect(ios.transactionHistory()).rejects.toBeInstanceOf(TypesNotSupported);
  });

  it('subscriptionStatuses() rejects with StoreKitNotSupported when the native module is missing', async () => {
    await expect(ios.subscriptionStatuses()).rejects.toBeInstanceOf(TypesNotSupported);
  });

  it('restore() rejects with StoreKitNotSupported when the native module is missing', async () => {
    await expect(ios.restore()).rejects.toBeInstanceOf(TypesNotSupported);
  });
});

describe('storekit.ts (iOS variant) — non-iOS platform path', () => {
  let ios: typeof import('@/native/storekit');
  let TypesNotSupported: typeof StoreKitNotSupported;

  beforeAll(() => {
    jest.resetModules();
    jest.doMock('expo-modules-core', () => ({
      requireOptionalNativeModule: () => null,
    }));
    jest.doMock('react-native', () => ({
      Platform: { OS: 'android' },
    }));
    ios = require('@/native/storekit');
    TypesNotSupported = require('@/native/storekit.types').StoreKitNotSupported;
  });

  afterAll(() => {
    jest.dontMock('expo-modules-core');
    jest.dontMock('react-native');
    jest.resetModules();
  });

  it('products() rejects on non-iOS platforms', async () => {
    await expect(ios.products(['x'])).rejects.toBeInstanceOf(TypesNotSupported);
  });
});
