/**
 * @jest-environment node
 */

import { MODULES } from '@/modules/registry';

describe('module registry — quick-actions-lab entry', () => {
  it('contains a module with id quick-actions-lab', () => {
    const ids = MODULES.map((m) => m.id);
    expect(ids).toContain('quick-actions-lab');
  });

  it('contains exactly one quick-actions-lab entry', () => {
    const matches = MODULES.filter((m) => m.id === 'quick-actions-lab');
    expect(matches).toHaveLength(1);
  });
});
