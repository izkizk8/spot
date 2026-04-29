/**
 * IOSOnlyBanner component tests.
 * Feature: 038-contacts
 */

import { render } from '@testing-library/react-native';
import React from 'react';

import { IOSOnlyBanner } from '@/modules/contacts-lab/components/IOSOnlyBanner';

describe('IOSOnlyBanner', () => {
  it('renders banner with platform limitation message', () => {
    const { getByTestId, getByText } = render(<IOSOnlyBanner />);

    expect(getByTestId('contacts-ios-only-banner')).toBeTruthy();
    expect(getByText(/Contacts access is only available on iOS and Android/)).toBeTruthy();
  });

  it('explains web has no equivalent API', () => {
    const { getByText } = render(<IOSOnlyBanner />);

    expect(getByText(/Web has no equivalent API/)).toBeTruthy();
  });
});
