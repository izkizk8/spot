/**
 * @jest-environment node
 */

import { MODULES } from '@/modules/registry';

describe('module registry — apple-pay-lab entry', () => {
  it('contains a module with id apple-pay-lab', () => {
    const ids = MODULES.map((m) => m.id);
    expect(ids).toContain('apple-pay-lab');
  });

  it('contains exactly one apple-pay-lab entry', () => {
    const matches = MODULES.filter((m) => m.id === 'apple-pay-lab');
    expect(matches).toHaveLength(1);
  });

  it('apple-pay-lab entry has all three platforms', () => {
    const m = MODULES.find((mod) => mod.id === 'apple-pay-lab');
    expect(m?.platforms).toContain('ios');
    expect(m?.platforms).toContain('android');
    expect(m?.platforms).toContain('web');
  });

  it('apple-pay-lab declares minIOS 8.0', () => {
    const m = MODULES.find((mod) => mod.id === 'apple-pay-lab');
    expect(m?.minIOS).toBe('8.0');
  });

  it('apple-pay-lab is appended after lidar-roomplan-lab', () => {
    const ids = MODULES.map((m) => m.id);
    const lidarIdx = ids.indexOf('lidar-roomplan-lab');
    const applePayIdx = ids.indexOf('apple-pay-lab');
    expect(lidarIdx).toBeGreaterThan(-1);
    expect(applePayIdx).toBe(lidarIdx + 1);
  });
});
