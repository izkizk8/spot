/**
 * Unit tests: CarPlay templates catalog (feature 045).
 *
 * @jest-environment node
 */

import {
  CARPLAY_TEMPLATES,
  findCarPlayTemplate,
  isTemplateAllowedForCategory,
} from '@/modules/carplay-lab/templates-catalog';
import type { CarPlayTemplateKind } from '@/native/carplay.types';

describe('CarPlay templates catalog', () => {
  it('contains the five documented templates', () => {
    const kinds = CARPLAY_TEMPLATES.map((t) => t.kind);
    const expected: CarPlayTemplateKind[] = ['list', 'grid', 'information', 'map', 'now-playing'];
    for (const k of expected) {
      expect(kinds).toContain(k);
    }
    expect(CARPLAY_TEMPLATES).toHaveLength(5);
  });

  it('every entry has the matching CP* className', () => {
    const map: Record<CarPlayTemplateKind, string> = {
      list: 'CPListTemplate',
      grid: 'CPGridTemplate',
      information: 'CPInformationTemplate',
      map: 'CPMapTemplate',
      'now-playing': 'CPNowPlayingTemplate',
    };
    for (const t of CARPLAY_TEMPLATES) {
      expect(t.className).toBe(map[t.kind]);
    }
  });

  it('has no duplicate kinds', () => {
    const kinds = CARPLAY_TEMPLATES.map((t) => t.kind);
    expect(new Set(kinds).size).toBe(kinds.length);
  });

  it('every template has a non-empty label, summary, categories, previewLines', () => {
    for (const t of CARPLAY_TEMPLATES) {
      expect(t.label.length).toBeGreaterThan(0);
      expect(t.summary.length).toBeGreaterThan(0);
      expect(t.categories.length).toBeGreaterThan(0);
      expect(t.previewLines.length).toBeGreaterThan(0);
    }
  });

  it('catalog is frozen at module load (cannot push)', () => {
    expect(Object.isFrozen(CARPLAY_TEMPLATES)).toBe(true);
    expect(() => {
      (CARPLAY_TEMPLATES as unknown as { push: (x: unknown) => void }).push({});
    }).toThrow(/object is not extensible|read only|frozen/i);
  });

  it('individual entries are frozen', () => {
    for (const t of CARPLAY_TEMPLATES) {
      expect(Object.isFrozen(t)).toBe(true);
      expect(Object.isFrozen(t.categories)).toBe(true);
      expect(Object.isFrozen(t.previewLines)).toBe(true);
    }
  });

  it('findCarPlayTemplate resolves known kinds and returns undefined for unknown', () => {
    expect(findCarPlayTemplate('list')?.className).toBe('CPListTemplate');
    expect(findCarPlayTemplate('now-playing')?.className).toBe('CPNowPlayingTemplate');
    expect(findCarPlayTemplate('map')?.kind).toBe('map');
    expect(findCarPlayTemplate('not-a-template')).toBeUndefined();
  });

  it('Now Playing is audio-only; Map is restricted to driving/EV/parking', () => {
    const np = findCarPlayTemplate('now-playing')!;
    expect(np.categories).toEqual(['audio']);

    const map = findCarPlayTemplate('map')!;
    expect(map.categories).toContain('driving-task');
    expect(map.categories).toContain('ev');
    expect(map.categories).toContain('parking');
    expect(map.categories).not.toContain('audio');
  });

  it('isTemplateAllowedForCategory enforces the per-template gate', () => {
    const np = findCarPlayTemplate('now-playing')!;
    expect(isTemplateAllowedForCategory(np, 'audio')).toBe(true);
    expect(isTemplateAllowedForCategory(np, 'driving-task')).toBe(false);
    expect(isTemplateAllowedForCategory(np, 'parking')).toBe(false);

    const list = findCarPlayTemplate('list')!;
    expect(isTemplateAllowedForCategory(list, 'audio')).toBe(true);
    expect(isTemplateAllowedForCategory(list, 'communication')).toBe(true);
  });
});
