/**
 * @jest-environment node
 */

import { MODULES } from '@/modules/registry';

describe('module registry — homekit-lab entry', () => {
  it('contains a module with id homekit-lab', () => {
    const ids = MODULES.map((m) => m.id);
    expect(ids).toContain('homekit-lab');
  });

  it('contains exactly one homekit-lab entry', () => {
    const matches = MODULES.filter((m) => m.id === 'homekit-lab');
    expect(matches).toHaveLength(1);
  });

  it('homekit-lab entry has all three platforms', () => {
    const m = MODULES.find((mod) => mod.id === 'homekit-lab');
    expect(m?.platforms).toContain('ios');
    expect(m?.platforms).toContain('android');
    expect(m?.platforms).toContain('web');
  });

  it('homekit-lab declares minIOS 8.0', () => {
    const m = MODULES.find((mod) => mod.id === 'homekit-lab');
    expect(m?.minIOS).toBe('8.0');
  });
});
