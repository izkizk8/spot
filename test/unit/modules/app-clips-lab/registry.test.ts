/**
 * @jest-environment node
 */

import { MODULES } from '@/modules/registry';

describe('module registry — app-clips-lab entry', () => {
  it('contains a module with id app-clips-lab', () => {
    const ids = MODULES.map((m) => m.id);
    expect(ids).toContain('app-clips-lab');
  });

  it('contains exactly one app-clips-lab entry', () => {
    const matches = MODULES.filter((m) => m.id === 'app-clips-lab');
    expect(matches).toHaveLength(1);
  });

  it('app-clips-lab entry has all three platforms', () => {
    const ac = MODULES.find((m) => m.id === 'app-clips-lab');
    expect(ac?.platforms).toContain('ios');
    expect(ac?.platforms).toContain('android');
    expect(ac?.platforms).toContain('web');
  });

  it('app-clips-lab declares minIOS 14.0', () => {
    const ac = MODULES.find((m) => m.id === 'app-clips-lab');
    expect(ac?.minIOS).toBe('14.0');
  });
});
