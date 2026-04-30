/**
 * @jest-environment node
 */

import { MODULES } from '@/modules/registry';

describe('module registry — handoff-lab entry', () => {
  it('contains a module with id handoff-lab', () => {
    const ids = MODULES.map((m) => m.id);
    expect(ids).toContain('handoff-lab');
  });

  it('contains exactly one handoff-lab entry', () => {
    const matches = MODULES.filter((m) => m.id === 'handoff-lab');
    expect(matches).toHaveLength(1);
  });

  it('handoff-lab entry has all three platforms', () => {
    const handoff = MODULES.find((m) => m.id === 'handoff-lab');
    expect(handoff?.platforms).toContain('ios');
    expect(handoff?.platforms).toContain('android');
    expect(handoff?.platforms).toContain('web');
  });
});
