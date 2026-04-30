/**
 * with-tap-to-pay Plugin Test
 * Feature: 051-tap-to-pay
 */

import { describe, expect, it } from '@jest/globals';

import {
  applyTapToPayEntitlements,
  TAP_TO_PAY_ENTITLEMENT_KEY,
} from '../../../plugins/with-tap-to-pay/index';

describe('with-tap-to-pay', () => {
  it('adds entitlement when absent', () => {
    const plist = {};
    const result = applyTapToPayEntitlements(plist);
    expect(result[TAP_TO_PAY_ENTITLEMENT_KEY]).toBe(true);
  });

  it('idempotent (run twice = same result)', () => {
    const plist = {};
    const result1 = applyTapToPayEntitlements(plist);
    const result2 = applyTapToPayEntitlements(result1);
    expect(result2).toEqual(result1);
  });

  it('preserves existing entitlements', () => {
    const plist = {
      'com.apple.developer.in-app-payments': ['merchant.com.example'],
    };
    const result = applyTapToPayEntitlements(plist);
    expect(result['com.apple.developer.in-app-payments']).toEqual(['merchant.com.example']);
    expect(result[TAP_TO_PAY_ENTITLEMENT_KEY]).toBe(true);
  });

  it('preserves operator-supplied value', () => {
    const plist = {
      [TAP_TO_PAY_ENTITLEMENT_KEY]: false,
    };
    const result = applyTapToPayEntitlements(plist);
    expect(result[TAP_TO_PAY_ENTITLEMENT_KEY]).toBe(false);
  });
});
