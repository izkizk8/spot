/**
 * @jest-environment node
 */

import { MODULES } from '@/modules/registry';

describe('module registry — carplay-lab entry', () => {
  it('contains a module with id carplay-lab', () => {
    const ids = MODULES.map((m) => m.id);
    expect(ids).toContain('carplay-lab');
  });

  it('contains exactly one carplay-lab entry', () => {
    const matches = MODULES.filter((m) => m.id === 'carplay-lab');
    expect(matches).toHaveLength(1);
  });

  it('carplay-lab entry has all three platforms', () => {
    const m = MODULES.find((mod) => mod.id === 'carplay-lab');
    expect(m?.platforms).toContain('ios');
    expect(m?.platforms).toContain('android');
    expect(m?.platforms).toContain('web');
  });

  it('carplay-lab declares minIOS 12.0', () => {
    const m = MODULES.find((mod) => mod.id === 'carplay-lab');
    expect(m?.minIOS).toBe('12.0');
  });
});
