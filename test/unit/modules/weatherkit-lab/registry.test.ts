/**
 * @jest-environment node
 */

import { MODULES } from '@/modules/registry';

describe('module registry — weatherkit-lab entry', () => {
  it('contains a module with id weatherkit-lab', () => {
    const ids = MODULES.map((m) => m.id);
    expect(ids).toContain('weatherkit-lab');
  });

  it('contains exactly one weatherkit-lab entry', () => {
    const matches = MODULES.filter((m) => m.id === 'weatherkit-lab');
    expect(matches).toHaveLength(1);
  });

  it('weatherkit-lab entry has all three platforms', () => {
    const m = MODULES.find((mod) => mod.id === 'weatherkit-lab');
    expect(m?.platforms).toContain('ios');
    expect(m?.platforms).toContain('android');
    expect(m?.platforms).toContain('web');
  });

  it('weatherkit-lab declares minIOS 16.0', () => {
    const m = MODULES.find((mod) => mod.id === 'weatherkit-lab');
    expect(m?.minIOS).toBe('16.0');
  });

  it('weatherkit-lab is appended after carplay-lab', () => {
    const ids = MODULES.map((m) => m.id);
    const carplayIdx = ids.indexOf('carplay-lab');
    const weatherIdx = ids.indexOf('weatherkit-lab');
    expect(carplayIdx).toBeGreaterThan(-1);
    expect(weatherIdx).toBeGreaterThan(carplayIdx);
  });
});
