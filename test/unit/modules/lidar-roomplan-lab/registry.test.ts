/**
 * @jest-environment node
 */

import { MODULES } from '@/modules/registry';

describe('module registry — lidar-roomplan-lab entry', () => {
  it('contains a module with id lidar-roomplan-lab', () => {
    const ids = MODULES.map((m) => m.id);
    expect(ids).toContain('lidar-roomplan-lab');
  });

  it('contains exactly one lidar-roomplan-lab entry', () => {
    const matches = MODULES.filter((m) => m.id === 'lidar-roomplan-lab');
    expect(matches).toHaveLength(1);
  });

  it('lidar-roomplan-lab entry has all three platforms', () => {
    const m = MODULES.find((mod) => mod.id === 'lidar-roomplan-lab');
    expect(m?.platforms).toContain('ios');
    expect(m?.platforms).toContain('android');
    expect(m?.platforms).toContain('web');
  });

  it('lidar-roomplan-lab declares minIOS 16.0', () => {
    const m = MODULES.find((mod) => mod.id === 'lidar-roomplan-lab');
    expect(m?.minIOS).toBe('16.0');
  });

  it('lidar-roomplan-lab is appended after shareplay-lab', () => {
    const ids = MODULES.map((m) => m.id);
    const sharePlayIdx = ids.indexOf('shareplay-lab');
    const lidarIdx = ids.indexOf('lidar-roomplan-lab');
    expect(sharePlayIdx).toBeGreaterThan(-1);
    expect(lidarIdx).toBeGreaterThan(sharePlayIdx);
  });
});
