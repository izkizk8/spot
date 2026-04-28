/**
 * Test suite for IOSOnlyBanner (LocalAuth).
 */

import React from 'react';
import { render } from '@testing-library/react-native';

import IOSOnlyBanner from '@/modules/local-auth-lab/components/IOSOnlyBanner';

describe('IOSOnlyBanner (local-auth-lab)', () => {
  it('renders the banner', () => {
    const { getByText } = render(<IOSOnlyBanner />);
    expect(getByText(/Local Authentication is unavailable on the Web/)).toBeTruthy();
  });

  it('mentions Face ID / Touch ID / Optic ID', () => {
    const { getByText } = render(<IOSOnlyBanner />);
    expect(getByText(/Face ID \/ Touch ID \/ Optic ID/)).toBeTruthy();
  });
});
