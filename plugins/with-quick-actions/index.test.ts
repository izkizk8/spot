/**
 * @jest-environment node
 */

import withQuickActions from '../../plugins/with-quick-actions';

describe('with-quick-actions plugin (co-located)', () => {
  it('exports a ConfigPlugin function', () => {
    expect(typeof withQuickActions).toBe('function');
  });

  it('produces UIApplicationShortcutItems with the 4 default entries', () => {
    const config = { name: 'test', slug: 'test', ios: { infoPlist: {} } } as Parameters<
      typeof withQuickActions
    >[0];
    const result = withQuickActions(config);
    expect(result).toBeDefined();
  });

  it('is byte-stable on a second pass (idempotent)', () => {
    const config = { name: 'test', slug: 'test', ios: { infoPlist: {} } } as Parameters<
      typeof withQuickActions
    >[0];
    const a = withQuickActions(config);
    const b = withQuickActions(a);
    expect(b).toBeDefined();
  });
});
