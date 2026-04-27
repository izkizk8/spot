import { describe, expect, it } from '@jest/globals';

import { MODULES } from '@/modules/registry';

const ID_RE = /^[a-z][a-z0-9-]*$/;
const SEMVER_RE = /^\d+(\.\d+){0,2}$/;
const PLATFORMS = new Set(['ios', 'android', 'web']);

describe('ModuleManifest validation (data-model.md §ModuleManifest)', () => {
  it.each(MODULES.map((m) => [m.id, m] as const))(
    'manifest %s satisfies the invariants',
    (_id, m) => {
      expect(m.id).toMatch(ID_RE);
      expect(typeof m.title).toBe('string');
      expect(m.title.length).toBeGreaterThan(0);
      expect(typeof m.description).toBe('string');
      expect(m.description.length).toBeGreaterThan(0);
      expect(typeof m.icon).toBe('object');
      expect(typeof m.icon.ios).toBe('string');
      expect(typeof m.icon.fallback).toBe('string');
      expect(Array.isArray(m.platforms)).toBe(true);
      expect(m.platforms.length).toBeGreaterThanOrEqual(1);
      m.platforms.forEach((p) => expect(PLATFORMS.has(p)).toBe(true));
      expect(m.minIOS == null || SEMVER_RE.test(m.minIOS)).toBe(true);
      expect(typeof m.render).toBe('function');
    },
  );

  it('MODULES has no duplicate ids', () => {
    const ids = MODULES.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
