/**
 * IOSOnlyBanner — usage smoke test (T026).
 * Feature: 035-core-bluetooth
 *
 * Asserts the Bluetooth-specific copy renders correctly when the banner is
 * referenced from the screen variants.
 */

import React from 'react';
import { render } from '@testing-library/react-native';

import { IOSOnlyBanner } from '@/modules/bluetooth-lab/components/IOSOnlyBanner';

describe('IOSOnlyBanner (usage)', () => {
  it('renders Bluetooth web-fallback copy', () => {
    const { getByText } = render(<IOSOnlyBanner reason='web-fallback' />);
    expect(getByText(/bluetooth is not available/i)).toBeTruthy();
  });

  it('renders Android-fallback copy', () => {
    const { getByText } = render(<IOSOnlyBanner reason='android-fallback' />);
    expect(getByText(/runtime permission requests vary by android api level/i)).toBeTruthy();
  });
});
