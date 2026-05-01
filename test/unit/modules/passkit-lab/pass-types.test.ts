/**
 * Pass types catalog tests.
 * Feature: 036-passkit-wallet
 *
 * RED phase: test fails until T009 lands.
 *
 * @see specs/036-passkit-wallet/contracts/passkit-bridge.md
 */

describe('PassKit pass-types catalog', () => {
  it('has exactly 5 category entries', async () => {
    const { PASS_CATEGORIES } = require('@/modules/passkit-lab/pass-types');
    expect(Object.keys(PASS_CATEGORIES)).toHaveLength(5);
  });

  it('has unique keys', async () => {
    const { PASS_CATEGORIES } = require('@/modules/passkit-lab/pass-types');
    const keys = Object.keys(PASS_CATEGORIES);
    const uniqueKeys = new Set(keys);
    expect(uniqueKeys.size).toBe(keys.length);
  });

  it('each label is a non-empty string', async () => {
    const { PASS_CATEGORIES } = require('@/modules/passkit-lab/pass-types');
    (Object.values(PASS_CATEGORIES) as string[]).forEach((label) => {
      expect(typeof label).toBe('string');
      expect(label.length).toBeGreaterThan(0);
    });
  });

  it('PassCategory union is exhaustive over catalog keys', async () => {
    const { PASS_CATEGORIES } = require('@/modules/passkit-lab/pass-types');
    const keys = Object.keys(PASS_CATEGORIES).toSorted();
    const expectedKeys = [
      'boardingPass',
      'coupon',
      'eventTicket',
      'generic',
      'storeCard',
    ].toSorted();
    expect(keys).toEqual(expectedKeys);
  });

  it('catalog is frozen', async () => {
    const { PASS_CATEGORIES } = require('@/modules/passkit-lab/pass-types');
    expect(Object.isFrozen(PASS_CATEGORIES)).toBe(true);
  });
});
