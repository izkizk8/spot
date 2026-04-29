/**
 * @jest-environment node
 */

import quickActionsLab from '@/modules/quick-actions-lab';

describe('Quick Actions Lab manifest', () => {
  it('has correct id', () => {
    expect(quickActionsLab.id).toBe('quick-actions-lab');
  });

  it('has non-empty title', () => {
    expect(quickActionsLab.title.trim().length).toBeGreaterThan(0);
  });

  it('has non-empty description', () => {
    expect(quickActionsLab.description.trim().length).toBeGreaterThan(0);
  });

  it('has icon', () => {
    expect(quickActionsLab.icon.ios.length).toBeGreaterThan(0);
    expect(quickActionsLab.icon.fallback.length).toBeGreaterThan(0);
  });

  it('declares ios + android + web platforms', () => {
    expect(quickActionsLab.platforms).toEqual(['ios', 'android', 'web']);
  });

  it('exposes a render function', () => {
    expect(typeof quickActionsLab.render).toBe('function');
  });
});
