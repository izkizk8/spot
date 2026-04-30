/**
 * @jest-environment node
 */

import { MODULES } from '@/modules/registry';

describe('module registry — storekit-lab entry', () => {
  it('contains a module with id storekit-lab', () => {
    const ids = MODULES.map((m) => m.id);
    expect(ids).toContain('storekit-lab');
  });

  it('contains exactly one storekit-lab entry', () => {
    const matches = MODULES.filter((m) => m.id === 'storekit-lab');
    expect(matches).toHaveLength(1);
  });

  it('storekit-lab entry has all three platforms', () => {
    const m = MODULES.find((mod) => mod.id === 'storekit-lab');
    expect(m?.platforms).toContain('ios');
    expect(m?.platforms).toContain('android');
    expect(m?.platforms).toContain('web');
  });

  it('storekit-lab declares minIOS 15.0', () => {
    const m = MODULES.find((mod) => mod.id === 'storekit-lab');
    expect(m?.minIOS).toBe('15.0');
  });

  it('storekit-lab is appended after apple-pay-lab', () => {
    const ids = MODULES.map((m) => m.id);
    const applePayIdx = ids.indexOf('apple-pay-lab');
    const storekitIdx = ids.indexOf('storekit-lab');
    expect(applePayIdx).toBeGreaterThan(-1);
    expect(storekitIdx).toBe(applePayIdx + 1);
  });
});
