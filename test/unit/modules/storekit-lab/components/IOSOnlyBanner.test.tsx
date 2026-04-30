/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render } from '@testing-library/react-native';

import IOSOnlyBanner from '@/modules/storekit-lab/components/IOSOnlyBanner';

describe('IOSOnlyBanner', () => {
  it('renders the banner test id', () => {
    const { getByTestId } = render(<IOSOnlyBanner />);
    expect(getByTestId('storekit-ios-only-banner')).toBeTruthy();
  });

  it('mentions StoreKit and explains iOS-only scope', () => {
    const { getByText } = render(<IOSOnlyBanner />);
    expect(getByText(/StoreKit 2/i)).toBeTruthy();
    expect(getByText(/Product, Transaction, and AppStore/)).toBeTruthy();
  });
});
