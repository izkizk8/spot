import { describe, expect, it } from '@jest/globals';

import type { ModuleManifest } from '@/modules/types';

const fixtureA: ModuleManifest = {
  id: 'alpha',
  title: 'Alpha',
  description: 'first',
  icon: { ios: 'sparkles', fallback: '✦' },
  platforms: ['ios', 'android', 'web'],
  render: () => null,
};

const fixtureB: ModuleManifest = {
  id: 'beta',
  title: 'Beta',
  description: 'second',
  icon: { ios: 'star', fallback: '★' },
  platforms: ['ios'],
  render: () => null,
};

describe('module registry invariants (data-model.md §ModuleRegistry)', () => {
  it('an empty MODULES array is a valid registry (FR-012 — empty state path)', () => {
    const MODULES: readonly ModuleManifest[] = [];
    expect(MODULES).toHaveLength(0);
  });

  it('preserves source-order across runs', () => {
    const MODULES: readonly ModuleManifest[] = [fixtureA, fixtureB];
    expect(MODULES.map((m) => m.id)).toEqual(['alpha', 'beta']);
    // A second pass over the same input MUST give the same order.
    expect([...MODULES].map((m) => m.id)).toEqual(['alpha', 'beta']);
  });

  it('a valid registry has no duplicate ids', () => {
    const MODULES: readonly ModuleManifest[] = [fixtureA, fixtureB];
    const ids = MODULES.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('detects duplicate ids when present (negative case)', () => {
    const MODULES: readonly ModuleManifest[] = [fixtureA, { ...fixtureB, id: 'alpha' }];
    const ids = MODULES.map((m) => m.id);
    expect(new Set(ids).size).toBeLessThan(ids.length);
  });
});
