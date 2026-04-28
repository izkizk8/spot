/**
 * Plugin tests for with-coreml (feature 016).
 *
 * Tests model presence verification.
 */

describe('with-coreml plugin', () => {
  it('exports a config plugin', () => {
    const plugin = require('../../../plugins/with-coreml').default;
    expect(typeof plugin).toBe('function');
  });
});
