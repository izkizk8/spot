/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render } from '@testing-library/react-native';

import ApplePayLabWeb from '@/modules/apple-pay-lab/screen.web';

describe('apple-pay-lab screen (Web)', () => {
  it('renders the IOSOnlyBanner', () => {
    const { getByTestId } = render(<ApplePayLabWeb />);
    expect(getByTestId('apple-pay-ios-only-banner')).toBeTruthy();
  });

  it('renders the SetupNotes alongside the banner', () => {
    const { getByTestId } = render(<ApplePayLabWeb />);
    expect(getByTestId('apple-pay-setup-notes')).toBeTruthy();
  });
});
