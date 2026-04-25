import { describe, expect, it } from '@jest/globals';

import { MaxContentWidth, Spacing } from '@/constants/theme';

describe('theme spacing tokens', () => {
  it('keeps the spacing scale deterministic for pure TypeScript logic', () => {
    expect(Spacing.two).toBe(Spacing.one * 2);
    expect(Spacing.three).toBe(Spacing.two * 2);
    expect(MaxContentWidth).toBeGreaterThan(Spacing.six);
  });
});
