/**
 * Tap to Pay Bridge Test
 * Feature: 051-tap-to-pay
 */

import { describe, expect, it } from '@jest/globals';

import { acceptPayment, discover, isSupported, TapToPayNotSupported } from '@/native/taptopay.web';

describe('taptopay-bridge', () => {
  it('web stub isSupported returns false', async () => {
    const result = await isSupported();
    expect(result).toBe(false);
  });

  it('web stub discover rejects with TapToPayNotSupported', async () => {
    await expect(discover()).rejects.toThrow(TapToPayNotSupported);
  });

  it('web stub acceptPayment rejects with TapToPayNotSupported', async () => {
    await expect(acceptPayment({ amount: 1000, currency: 'USD' })).rejects.toThrow(
      TapToPayNotSupported,
    );
  });
});
