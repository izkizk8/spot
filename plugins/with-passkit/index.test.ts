/**
 * with-passkit plugin co-located smoke test.
 * Feature: 036-passkit-wallet
 */

import plugin from './index';

describe('with-passkit plugin smoke', () => {
  it('exports a function', () => {
    expect(typeof plugin).toBe('function');
  });
});
