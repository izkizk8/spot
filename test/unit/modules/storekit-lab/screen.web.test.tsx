/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render } from '@testing-library/react-native';

import StoreKitLabWeb from '@/modules/storekit-lab/screen.web';

describe('storekit-lab screen (Web)', () => {
  it('renders the IOSOnlyBanner', () => {
    const { getByTestId } = render(<StoreKitLabWeb />);
    expect(getByTestId('storekit-ios-only-banner')).toBeTruthy();
  });

  it('renders the SetupInstructions alongside the banner', () => {
    const { getByTestId } = render(<StoreKitLabWeb />);
    expect(getByTestId('storekit-setup-instructions')).toBeTruthy();
  });
});
