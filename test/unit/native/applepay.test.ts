/**
 * @jest-environment node
 *
 * Bridge contract tests for `src/native/applepay.ts` and the
 * Android / Web variants. Validates the JS surface without
 * loading the iOS native module.
 */

import {
  ApplePayNotSupported,
  AUTHORIZATION_STATUSES,
  SUPPORTED_NETWORKS,
  ZERO_CONTACT_FIELDS,
} from '@/native/applepay.types';

describe('applepay.types', () => {
  it('exports the canonical network catalog', () => {
    expect(SUPPORTED_NETWORKS).toEqual(['Visa', 'MasterCard', 'AmEx', 'Discover', 'ChinaUnionPay']);
  });

  it('SUPPORTED_NETWORKS is frozen', () => {
    expect(Object.isFrozen(SUPPORTED_NETWORKS)).toBe(true);
  });

  it('AUTHORIZATION_STATUSES is frozen', () => {
    expect(Object.isFrozen(AUTHORIZATION_STATUSES)).toBe(true);
    expect(AUTHORIZATION_STATUSES).toEqual(['success', 'failure', 'cancelled']);
  });

  it('ZERO_CONTACT_FIELDS is a frozen all-false record', () => {
    expect(Object.isFrozen(ZERO_CONTACT_FIELDS)).toBe(true);
    expect(ZERO_CONTACT_FIELDS).toEqual({
      billing: false,
      shipping: false,
      email: false,
      phone: false,
    });
  });

  it('ApplePayNotSupported has the documented code and name', () => {
    const e = new ApplePayNotSupported();
    expect(e.code).toBe('APPLE_PAY_NOT_SUPPORTED');
    expect(e.name).toBe('ApplePayNotSupported');
    expect(e).toBeInstanceOf(Error);
  });
});

describe('applepay.android', () => {
  let android: typeof import('@/native/applepay.android');

  beforeAll(() => {
    android = require('@/native/applepay.android');
  });

  it('canMakePayments() returns false', () => {
    expect(android.canMakePayments()).toBe(false);
  });

  it('canMakePaymentsUsingNetworks() returns false', () => {
    expect(android.canMakePaymentsUsingNetworks(['Visa'])).toBe(false);
  });

  it('presentPaymentRequest rejects with ApplePayNotSupported', async () => {
    await expect(
      android.presentPaymentRequest({
        merchantIdentifier: 'merchant.test',
        countryCode: 'US',
        currencyCode: 'USD',
        supportedNetworks: ['Visa'],
        summaryItems: [{ label: 'A', amount: '1.00' }],
        requiredContactFields: ZERO_CONTACT_FIELDS,
      }),
    ).rejects.toBeInstanceOf(ApplePayNotSupported);
  });

  it('exposes a default applepay aggregate', () => {
    expect(typeof android.applepay.canMakePayments).toBe('function');
    expect(android.default).toBe(android.applepay);
  });
});

describe('applepay.web', () => {
  let web: typeof import('@/native/applepay.web');

  beforeAll(() => {
    web = require('@/native/applepay.web');
  });

  it('canMakePayments() returns false', () => {
    expect(web.canMakePayments()).toBe(false);
  });

  it('canMakePaymentsUsingNetworks() returns false', () => {
    expect(web.canMakePaymentsUsingNetworks(SUPPORTED_NETWORKS)).toBe(false);
  });

  it('presentPaymentRequest rejects with ApplePayNotSupported', async () => {
    await expect(
      web.presentPaymentRequest({
        merchantIdentifier: 'merchant.test',
        countryCode: 'US',
        currencyCode: 'USD',
        supportedNetworks: ['Visa'],
        summaryItems: [{ label: 'A', amount: '1.00' }],
        requiredContactFields: ZERO_CONTACT_FIELDS,
      }),
    ).rejects.toBeInstanceOf(ApplePayNotSupported);
  });
});

describe('applepay.ts (iOS variant) — null native module path', () => {
  let ios: typeof import('@/native/applepay');
  let TypesNotSupported: typeof ApplePayNotSupported;

  beforeAll(() => {
    jest.resetModules();
    jest.doMock('expo-modules-core', () => ({
      requireOptionalNativeModule: () => null,
    }));
    jest.doMock('react-native', () => ({
      Platform: { OS: 'ios' },
    }));
    ios = require('@/native/applepay');
    TypesNotSupported = require('@/native/applepay.types').ApplePayNotSupported;
  });

  afterAll(() => {
    jest.dontMock('expo-modules-core');
    jest.dontMock('react-native');
    jest.resetModules();
  });

  it('canMakePayments() returns false when the native module is missing', () => {
    expect(ios.canMakePayments()).toBe(false);
  });

  it('canMakePaymentsUsingNetworks() returns false when the native module is missing', () => {
    expect(ios.canMakePaymentsUsingNetworks(['Visa'])).toBe(false);
  });

  it('presentPaymentRequest rejects with ApplePayNotSupported when the native module is missing', async () => {
    await expect(
      ios.presentPaymentRequest({
        merchantIdentifier: 'merchant.test',
        countryCode: 'US',
        currencyCode: 'USD',
        supportedNetworks: ['Visa'],
        summaryItems: [{ label: 'A', amount: '1.00' }],
        requiredContactFields: ZERO_CONTACT_FIELDS,
      }),
    ).rejects.toBeInstanceOf(TypesNotSupported);
  });
});
