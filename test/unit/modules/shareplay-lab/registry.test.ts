/**
 * @jest-environment node
 */

import { MODULES } from '@/modules/registry';

describe('module registry — shareplay-lab entry', () => {
  it('contains a module with id shareplay-lab', () => {
    const ids = MODULES.map((m) => m.id);
    expect(ids).toContain('shareplay-lab');
  });

  it('contains exactly one shareplay-lab entry', () => {
    const matches = MODULES.filter((m) => m.id === 'shareplay-lab');
    expect(matches).toHaveLength(1);
  });

  it('shareplay-lab entry has all three platforms', () => {
    const m = MODULES.find((mod) => mod.id === 'shareplay-lab');
    expect(m?.platforms).toContain('ios');
    expect(m?.platforms).toContain('android');
    expect(m?.platforms).toContain('web');
  });

  it('shareplay-lab declares minIOS 15.0', () => {
    const m = MODULES.find((mod) => mod.id === 'shareplay-lab');
    expect(m?.minIOS).toBe('15.0');
  });

  it('shareplay-lab is appended after weatherkit-lab', () => {
    const ids = MODULES.map((m) => m.id);
    const weatherIdx = ids.indexOf('weatherkit-lab');
    const sharePlayIdx = ids.indexOf('shareplay-lab');
    expect(weatherIdx).toBeGreaterThan(-1);
    expect(sharePlayIdx).toBeGreaterThan(weatherIdx);
  });
});
