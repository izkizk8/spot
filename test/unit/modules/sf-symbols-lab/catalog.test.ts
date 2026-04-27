/**
 * @file catalog.test.ts
 * @description Tests for the curated symbols and effects catalog (T004)
 * Per contracts/catalog.md invariants.
 */

import { SYMBOLS, EFFECTS } from '@/modules/sf-symbols-lab/catalog';
import type { EffectId } from '@/modules/sf-symbols-lab/types';

describe('SF Symbols Lab — Catalog', () => {
  describe('SYMBOLS', () => {
    it('has exactly 12 curated symbols', () => {
      expect(SYMBOLS).toHaveLength(12);
    });

    it('every symbol name is a non-empty string matching SF Symbol naming convention', () => {
      const sfSymbolNamePattern = /^[a-z0-9]+(\.[a-z0-9]+)*$/;
      for (const symbol of SYMBOLS) {
        expect(symbol.name).toBeTruthy();
        expect(typeof symbol.name).toBe('string');
        expect(symbol.name).toMatch(sfSymbolNamePattern);
      }
    });

    it('all symbol names are unique', () => {
      const names = SYMBOLS.map((s) => s.name);
      const uniqueNames = new Set(names);
      expect(uniqueNames.size).toBe(names.length);
    });

    it('all symbol displayLabels are unique', () => {
      const labels = SYMBOLS.map((s) => s.displayLabel);
      const uniqueLabels = new Set(labels);
      expect(uniqueLabels.size).toBe(labels.length);
    });
  });

  describe('EFFECTS', () => {
    it('has exactly 7 effects', () => {
      expect(EFFECTS).toHaveLength(7);
    });

    it('contains all required effect IDs', () => {
      const effectIds: EffectId[] = [
        'bounce',
        'pulse',
        'scale',
        'variable-color',
        'replace',
        'appear',
        'disappear',
      ];
      const catalogIds = EFFECTS.map((e) => e.id);
      for (const id of effectIds) {
        expect(catalogIds).toContain(id);
      }
    });

    it('all effect IDs are unique', () => {
      const ids = EFFECTS.map((e) => e.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('only "replace" requires a secondary symbol', () => {
      const requiresSecondary = EFFECTS.filter((e) => e.requiresSecondarySymbol);
      expect(requiresSecondary).toHaveLength(1);
      expect(requiresSecondary[0].id).toBe('replace');
    });

    it('bounce, pulse, scale, variable-color respond to speed', () => {
      const respondsToSpeed = EFFECTS.filter((e) => e.respondsToSpeed).map(
        (e) => e.id,
      );
      expect(respondsToSpeed.sort()).toEqual([
        'bounce',
        'pulse',
        'scale',
        'variable-color',
      ]);
    });

    it('bounce, pulse, scale, variable-color respond to repeat', () => {
      const respondsToRepeat = EFFECTS.filter(
        (e) => e.respondsToRepeat,
      ).map((e) => e.id);
      expect(respondsToRepeat.sort()).toEqual([
        'bounce',
        'pulse',
        'scale',
        'variable-color',
      ]);
    });
  });
});
