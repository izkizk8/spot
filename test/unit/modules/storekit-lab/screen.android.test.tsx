/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render } from '@testing-library/react-native';

import StoreKitLabAndroid from '@/modules/storekit-lab/screen.android';

describe('storekit-lab screen (Android)', () => {
  it('renders the IOSOnlyBanner', () => {
    const { getByTestId } = render(<StoreKitLabAndroid />);
    expect(getByTestId('storekit-ios-only-banner')).toBeTruthy();
  });

  it('renders the SetupInstructions alongside the banner', () => {
    const { getByTestId } = render(<StoreKitLabAndroid />);
    expect(getByTestId('storekit-setup-instructions')).toBeTruthy();
  });
});
