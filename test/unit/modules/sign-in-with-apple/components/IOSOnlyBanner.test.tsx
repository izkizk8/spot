/**
 * Test suite for IOSOnlyBanner component.
 */

import React from 'react';
import { render } from '@testing-library/react-native';

import IOSOnlyBanner from '@/modules/sign-in-with-apple/components/IOSOnlyBanner';

describe('IOSOnlyBanner', () => {
  it('renders the banner', () => {
    const { getByText } = render(<IOSOnlyBanner />);
    expect(getByText(/iOS 13\+/)).toBeTruthy();
  });

  it('mentions iOS 13+', () => {
    const { getByText } = render(<IOSOnlyBanner />);
    expect(getByText(/iOS 13\+/)).toBeTruthy();
  });
});
