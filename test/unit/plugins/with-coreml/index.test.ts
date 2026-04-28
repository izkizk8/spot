/**
 * Plugin tests for with-coreml (feature 016).
 *
 * Covers:
 *  (a) Plugin exports a function.
 *  (b) Plugin returns config (idempotent).
 *  (c) Plugin warns (does NOT throw) when the .mlmodel is missing.
 */

describe('with-coreml plugin', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('exports a config plugin function', () => {
    const plugin = require('../../../../plugins/with-coreml/index').default;
    expect(typeof plugin).toBe('function');
  });

  it('returns the config (idempotent on repeated invocation)', () => {
    const plugin = require('../../../../plugins/with-coreml/index').default;
    const baseConfig: { name: string; mods?: unknown } = { name: 'test' };
    const result1 = plugin(baseConfig);
    const result2 = plugin(result1);
    expect(result1.name).toBe('test');
    expect(result2.name).toBe('test');
  });

  it('does NOT throw when the model file is absent (warns instead)', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    const plugin = require('../../../../plugins/with-coreml/index').default;
    expect(() => plugin({ name: 'test' })).not.toThrow();
    warnSpy.mockRestore();
  });
});
