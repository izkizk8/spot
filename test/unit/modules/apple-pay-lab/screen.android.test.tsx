/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render } from '@testing-library/react-native';

import ApplePayLabAndroid from '@/modules/apple-pay-lab/screen.android';

describe('apple-pay-lab screen (Android)', () => {
  it('renders the IOSOnlyBanner', () => {
    const { getByTestId } = render(<ApplePayLabAndroid />);
    expect(getByTestId('apple-pay-ios-only-banner')).toBeTruthy();
  });

  it('renders the SetupNotes alongside the banner', () => {
    const { getByTestId } = render(<ApplePayLabAndroid />);
    expect(getByTestId('apple-pay-setup-notes')).toBeTruthy();
  });
});
