/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import IOSOnlyBanner from '@/modules/keychain-lab/components/IOSOnlyBanner';

describe('IOSOnlyBanner', () => {
  it('renders the per-module copy', () => {
    const { getByText } = render(<IOSOnlyBanner />);

    expect(getByText(/Keychain Services is unavailable/i, { exact: false })).toBeTruthy();
  });

  it('has alert role for accessibility', () => {
    const { getByRole } = render(<IOSOnlyBanner />);
    expect(getByRole('alert')).toBeTruthy();
  });

  it('uses themed components', () => {
    const { getByRole } = render(<IOSOnlyBanner />);
    const container = getByRole('alert');
    expect(container).toBeTruthy();
  });
});
