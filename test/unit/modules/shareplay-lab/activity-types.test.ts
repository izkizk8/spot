/**
 * @jest-environment node
 */

import {
  ACTIVITY_TYPES,
  DEFAULT_ACTIVITY_TYPE,
  findActivityType,
  hasLivePayload,
} from '@/modules/shareplay-lab/activity-types';

describe('shareplay-lab activity-types catalog', () => {
  it('exports exactly three activity types', () => {
    expect(ACTIVITY_TYPES).toHaveLength(3);
  });

  it('includes counter, drawing and quiz', () => {
    const ids = ACTIVITY_TYPES.map((t) => t.id);
    expect(ids).toEqual(['counter', 'drawing', 'quiz']);
  });

  it('every entry has a non-empty label, description and defaultTitle', () => {
    for (const t of ACTIVITY_TYPES) {
      expect(t.label.length).toBeGreaterThan(0);
      expect(t.description.length).toBeGreaterThan(0);
      expect(t.defaultTitle.length).toBeGreaterThan(0);
    }
  });

  it('catalog is frozen and tamper-resistant', () => {
    expect(Object.isFrozen(ACTIVITY_TYPES)).toBe(true);
    for (const t of ACTIVITY_TYPES) {
      expect(Object.isFrozen(t)).toBe(true);
    }
  });

  it('DEFAULT_ACTIVITY_TYPE is "counter" and resolves via findActivityType', () => {
    expect(DEFAULT_ACTIVITY_TYPE).toBe('counter');
    expect(findActivityType(DEFAULT_ACTIVITY_TYPE)?.label).toBe('Counter');
  });

  it('findActivityType returns undefined for unknown ids', () => {
    expect(findActivityType('does-not-exist')).toBeUndefined();
  });

  it('hasLivePayload is true for counter and false for the scaffolds', () => {
    expect(hasLivePayload('counter')).toBe(true);
    expect(hasLivePayload('drawing')).toBe(false);
    expect(hasLivePayload('quiz')).toBe(false);
  });
});
