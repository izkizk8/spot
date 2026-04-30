/**
 * @jest-environment node
 *
 * Pure-helper tests for `supported-networks.ts`. Exercises the
 * frozen catalog, amount validation, total calculation, and the
 * payment-request validator without touching native code.
 */

import {
  AUTHORIZATION_STATUSES,
  DEFAULT_REQUEST,
  isValidAmount,
  NETWORK_CATALOG,
  SUPPORTED_NETWORKS,
  totalAmount,
  validateRequest,
} from '@/modules/apple-pay-lab/supported-networks';

describe('SUPPORTED_NETWORKS catalog', () => {
  it('lists the documented five networks in spec order', () => {
    expect(SUPPORTED_NETWORKS).toEqual(['Visa', 'MasterCard', 'AmEx', 'Discover', 'ChinaUnionPay']);
  });

  it('is frozen', () => {
    expect(Object.isFrozen(SUPPORTED_NETWORKS)).toBe(true);
  });
});

describe('NETWORK_CATALOG', () => {
  it('has one entry per supported network', () => {
    expect(NETWORK_CATALOG.map((d) => d.id)).toEqual([...SUPPORTED_NETWORKS]);
  });

  it('every entry exposes a non-empty display name and initials', () => {
    NETWORK_CATALOG.forEach((d) => {
      expect(d.displayName.length).toBeGreaterThan(0);
      expect(d.initials.length).toBeGreaterThan(0);
    });
  });

  it('is deeply frozen', () => {
    expect(Object.isFrozen(NETWORK_CATALOG)).toBe(true);
    NETWORK_CATALOG.forEach((d) => expect(Object.isFrozen(d)).toBe(true));
  });
});

describe('AUTHORIZATION_STATUSES', () => {
  it('contains success / failure / cancelled', () => {
    expect(AUTHORIZATION_STATUSES).toEqual(['success', 'failure', 'cancelled']);
  });

  it('is frozen', () => {
    expect(Object.isFrozen(AUTHORIZATION_STATUSES)).toBe(true);
  });
});

describe('isValidAmount', () => {
  it.each([
    ['0', true],
    ['12', true],
    ['12.5', true],
    ['12.50', true],
    ['0.99', true],
    ['', false],
    ['12.', false],
    ['12.345', false],
    ['-1', false],
    ['abc', false],
    ['1,50', false],
  ])('isValidAmount(%j) === %j', (input, expected) => {
    expect(isValidAmount(input)).toBe(expected);
  });
});

describe('totalAmount', () => {
  it('sums valid amounts and formats with two fractional digits', () => {
    expect(
      totalAmount([
        { label: 'A', amount: '4.50' },
        { label: 'B', amount: '3.25' },
      ]),
    ).toBe('7.75');
  });

  it('treats invalid amounts as zero', () => {
    expect(
      totalAmount([
        { label: 'A', amount: '4.50' },
        { label: 'B', amount: 'oops' },
      ]),
    ).toBe('4.50');
  });

  it('returns "0.00" for an empty list', () => {
    expect(totalAmount([])).toBe('0.00');
  });
});

describe('validateRequest', () => {
  it('returns null for a valid default request', () => {
    expect(validateRequest(DEFAULT_REQUEST)).toBeNull();
  });

  it('rejects an empty merchant id', () => {
    expect(validateRequest({ ...DEFAULT_REQUEST, merchantIdentifier: '' })).toMatch(
      /Merchant identifier/,
    );
  });

  it('rejects a merchant id that does not start with "merchant."', () => {
    expect(validateRequest({ ...DEFAULT_REQUEST, merchantIdentifier: 'wrong.example' })).toMatch(
      /start with/,
    );
  });

  it('rejects an invalid country code', () => {
    expect(validateRequest({ ...DEFAULT_REQUEST, countryCode: 'usa' })).toMatch(/Country/);
  });

  it('rejects an invalid currency code', () => {
    expect(validateRequest({ ...DEFAULT_REQUEST, currencyCode: 'US' })).toMatch(/Currency/);
  });

  it('rejects an empty network list', () => {
    expect(validateRequest({ ...DEFAULT_REQUEST, supportedNetworks: [] })).toMatch(/network/i);
  });

  it('rejects an empty summary item list', () => {
    expect(validateRequest({ ...DEFAULT_REQUEST, summaryItems: [] })).toMatch(/summary item/i);
  });

  it('rejects a summary item with an empty label', () => {
    expect(
      validateRequest({
        ...DEFAULT_REQUEST,
        summaryItems: [{ label: '', amount: '1.00' }],
      }),
    ).toMatch(/label/);
  });

  it('rejects a summary item with an invalid amount', () => {
    expect(
      validateRequest({
        ...DEFAULT_REQUEST,
        summaryItems: [{ label: 'X', amount: 'oops' }],
      }),
    ).toMatch(/amount/);
  });
});
