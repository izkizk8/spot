/**
 * app.json plugins[] — extension assertions for feature 035 (T048).
 * Feature: 035-core-bluetooth
 */

import appJson from '../../app.json';

describe('app.json plugins', () => {
  it('includes ./plugins/with-bluetooth exactly once', () => {
    const plugins = appJson.expo.plugins as unknown[];
    const matches = plugins.filter((p) => p === './plugins/with-bluetooth');
    expect(matches).toHaveLength(1);
  });

  it('keeps ./plugins/with-arkit (no regression on prior modules)', () => {
    const plugins = appJson.expo.plugins as unknown[];
    expect(plugins).toContain('./plugins/with-arkit');
  });
});
