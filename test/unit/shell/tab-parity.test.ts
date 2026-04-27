import { describe, expect, it } from '@jest/globals';

import { TAB_IDS as NATIVE_TAB_IDS } from '@/components/app-tabs';
import { TAB_IDS as WEB_TAB_IDS } from '@/components/app-tabs.web';

/**
 * FR-026 enforcement: the native NativeTabs and the custom web tab list
 * MUST declare the same tab ids in the same order. Editing one without
 * the other breaks this test.
 */
describe('tab parity (FR-026)', () => {
  it('native and web tab files declare the same tab ids in the same order', () => {
    expect([...NATIVE_TAB_IDS]).toEqual([...WEB_TAB_IDS]);
  });

  it('declares all four shell tabs', () => {
    expect([...NATIVE_TAB_IDS]).toEqual(['index', 'explore', 'modules', 'settings']);
  });
});
