/**
 * Currency Codes Test
 * Feature: 051-tap-to-pay
 */

import { describe, expect, it } from '@jest/globals';

import { CURRENCIES } from '@/modules/tap-to-pay-lab/currency-codes';

describe('currency-codes', () => {
  it('has at least 20 currencies', () => {
    expect(CURRENCIES.length).toBeGreaterThanOrEqual(20);
  });

  it('has unique codes', () => {
    const codes = CURRENCIES.map((c) => c.code);
    const uniqueCodes = new Set(codes);
    expect(uniqueCodes.size).toBe(codes.length);
  });

  it('has valid minorUnits (0, 2, or 3)', () => {
    CURRENCIES.forEach((c) => {
      expect([0, 2, 3]).toContain(c.minorUnits);
    });
  });

  it('includes key currencies', () => {
    const codes = CURRENCIES.map((c) => c.code);
    expect(codes).toContain('USD');
    expect(codes).toContain('EUR');
    expect(codes).toContain('GBP');
    expect(codes).toContain('JPY');
  });
});
