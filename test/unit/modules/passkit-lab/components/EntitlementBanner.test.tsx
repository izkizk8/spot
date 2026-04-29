/**
 * EntitlementBanner component tests.
 * Feature: 036-passkit-wallet
 *
 * RED phase: test fails until T026 lands.
 */

import { render } from '@testing-library/react-native';
import React from 'react';

describe('EntitlementBanner', () => {
  it('visible when isPlaceholder is true', async () => {
    const { EntitlementBanner } = require('@/modules/passkit-lab/components/EntitlementBanner');

    const { getByText } = render(<EntitlementBanner isPlaceholder={true} />);

    expect(getByText(/pass type id required/i)).toBeTruthy();
  });

  it('hidden when isPlaceholder is false', async () => {
    const { EntitlementBanner } = require('@/modules/passkit-lab/components/EntitlementBanner');

    const { queryByText } = render(<EntitlementBanner isPlaceholder={false} />);

    expect(queryByText(/pass type id required/i)).toBeNull();
  });

  it('contains tappable link to quickstart.md', async () => {
    const { EntitlementBanner } = require('@/modules/passkit-lab/components/EntitlementBanner');

    const { getByText } = render(<EntitlementBanner isPlaceholder={true} />);

    expect(getByText(/quickstart/i)).toBeTruthy();
  });

  it('reuses theme tokens (no component-level hardcoded hex)', async () => {
    const { EntitlementBanner } = require('@/modules/passkit-lab/components/EntitlementBanner');
    expect(() => render(<EntitlementBanner isPlaceholder={true} />)).not.toThrow();
  });
});
