/**
 * with-eventkit plugin co-located smoke test.
 * Feature: 037-eventkit
 */

import plugin from './index';

describe('with-eventkit plugin smoke', () => {
  it('exports a function', () => {
    expect(typeof plugin).toBe('function');
  });
});
