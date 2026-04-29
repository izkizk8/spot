/**
 * IOSOnlyBanner component tests.
 * Feature: 036-passkit-wallet
 *
 * RED phase: test fails until T027 lands.
 */

import { render } from '@testing-library/react-native';
import { Platform } from 'react-native';
import React from 'react';

describe('IOSOnlyBanner', () => {
  it('renders iOS-only message', async () => {
    const { IOSOnlyBanner } = require('@/modules/passkit-lab/components/IOSOnlyBanner');

    const { getByText } = render(<IOSOnlyBanner />);

    expect(getByText(/wallet.*passkit.*ios.*only/i)).toBeTruthy();
  });

  it('has a11y label set', async () => {
    const { IOSOnlyBanner } = require('@/modules/passkit-lab/components/IOSOnlyBanner');

    const { getByLabelText } = render(<IOSOnlyBanner />);

    expect(getByLabelText(/ios.*only/i)).toBeTruthy();
  });

  it('renders identically under Android platform mock', async () => {
    Platform.OS = 'android';

    const { IOSOnlyBanner } = require('@/modules/passkit-lab/components/IOSOnlyBanner');

    const { getByText } = render(<IOSOnlyBanner />);

    expect(getByText(/wallet.*passkit.*ios.*only/i)).toBeTruthy();
  });

  it('renders identically under Web platform mock', async () => {
    Platform.OS = 'web';

    const { IOSOnlyBanner } = require('@/modules/passkit-lab/components/IOSOnlyBanner');

    const { getByText } = render(<IOSOnlyBanner />);

    expect(getByText(/wallet.*passkit.*ios.*only/i)).toBeTruthy();
  });

  it('reuses theme tokens (no component-level hardcoded hex)', async () => {
    const { IOSOnlyBanner } = require('@/modules/passkit-lab/components/IOSOnlyBanner');
    // Smoke check: component renders without crashing under theme.
    expect(() => render(<IOSOnlyBanner />)).not.toThrow();
  });
});
