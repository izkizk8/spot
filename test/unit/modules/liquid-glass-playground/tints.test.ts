import { describe, expect, it } from '@jest/globals';

import { TINTS } from '@/modules/liquid-glass-playground/tints';

describe('liquid-glass-playground tints catalog', () => {
  it('is non-empty', () => {
    expect(TINTS.length).toBeGreaterThan(0);
  });

  it('every entry has a kebab-case id and a non-empty label', () => {
    for (const t of TINTS) {
      expect(typeof t.id).toBe('string');
      expect(t.id).toMatch(/^[a-z][a-z0-9-]*$/);
      expect(typeof t.label).toBe('string');
      expect(t.label.length).toBeGreaterThan(0);
    }
  });

  it('every entry has a value that is either undefined or a hex/rgba color', () => {
    const colorRe = /^(#[0-9a-fA-F]{3,8}|rgba?\([^)]+\))$/;
    for (const t of TINTS) {
      if (t.value == null) continue;
      expect(t.value).toMatch(colorRe);
    }
  });

  it('ids are unique', () => {
    const ids = TINTS.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
