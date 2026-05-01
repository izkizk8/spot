/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render } from '@testing-library/react-native';

import IOSOnlyBanner from '@/modules/apple-pay-lab/components/IOSOnlyBanner';

describe('IOSOnlyBanner', () => {
  it('renders the banner test id', () => {
    const { getByTestId } = render(<IOSOnlyBanner />);
    expect(getByTestId('apple-pay-ios-only-banner')).toBeTruthy();
  });

  it('mentions Apple Pay and explains iOS-only scope', () => {
    const { getByText } = render(<IOSOnlyBanner />);
    expect(getByText(/Apple Pay/i)).toBeTruthy();
    expect(getByText(/PKPaymentAuthorizationController/)).toBeTruthy();
  });
});
