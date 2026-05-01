/**
 * @jest-environment node
 */

import { MODULES } from '@/modules/registry';

describe('module registry — universal-links-lab entry', () => {
  it('contains a module with id universal-links-lab', () => {
    const ids = MODULES.map((m) => m.id);
    expect(ids).toContain('universal-links-lab');
  });

  it('contains exactly one universal-links-lab entry', () => {
    const matches = MODULES.filter((m) => m.id === 'universal-links-lab');
    expect(matches).toHaveLength(1);
  });

  it('universal-links-lab entry has all three platforms', () => {
    const ul = MODULES.find((m) => m.id === 'universal-links-lab');
    expect(ul?.platforms).toContain('ios');
    expect(ul?.platforms).toContain('android');
    expect(ul?.platforms).toContain('web');
  });
});
