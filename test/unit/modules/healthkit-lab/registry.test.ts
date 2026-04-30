/**
 * @jest-environment node
 */

import { MODULES } from '@/modules/registry';

describe('module registry — healthkit-lab entry', () => {
  it('contains a module with id healthkit-lab', () => {
    const ids = MODULES.map((m) => m.id);
    expect(ids).toContain('healthkit-lab');
  });

  it('contains exactly one healthkit-lab entry', () => {
    const matches = MODULES.filter((m) => m.id === 'healthkit-lab');
    expect(matches).toHaveLength(1);
  });

  it('healthkit-lab entry has all three platforms', () => {
    const m = MODULES.find((mod) => mod.id === 'healthkit-lab');
    expect(m?.platforms).toContain('ios');
    expect(m?.platforms).toContain('android');
    expect(m?.platforms).toContain('web');
  });

  it('healthkit-lab declares minIOS 9.0', () => {
    const m = MODULES.find((mod) => mod.id === 'healthkit-lab');
    expect(m?.minIOS).toBe('9.0');
  });
});
