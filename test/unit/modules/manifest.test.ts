import { describe, expect, it } from '@jest/globals';

import { MODULES } from '@/modules/registry';
import type { ModuleManifest } from '@/modules/types';

const ID_RE = /^[a-z][a-z0-9-]*$/;
const SEMVER_RE = /^\d+(\.\d+){0,2}$/;
const PLATFORMS = new Set(['ios', 'android', 'web']);

function validateManifest(m: ModuleManifest): void {
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
  if (m.minIOS != null) {
    expect(m.minIOS).toMatch(SEMVER_RE);
  }
  expect(typeof m.render).toBe('function');
}

describe('ModuleManifest validation (data-model.md §ModuleManifest)', () => {
  it('every entry in MODULES satisfies the manifest invariants', () => {
    MODULES.forEach((m) => validateManifest(m));
  });

  it('MODULES has no duplicate ids', () => {
    const ids = MODULES.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
