/**
 * IOSOnlyBanner component tests.
 * Feature: 039-quick-actions
 */

import { render } from '@testing-library/react-native';
import React from 'react';

import { IOSOnlyBanner } from '@/modules/quick-actions-lab/components/IOSOnlyBanner';

describe('IOSOnlyBanner', () => {
  it('renders the banner with platform limitation message', () => {
    const { getByTestId, getByText } = render(<IOSOnlyBanner />);

    expect(getByTestId('quick-actions-ios-only-banner')).toBeTruthy();
    expect(getByText(/Quick Actions are an iOS Home Screen feature/)).toBeTruthy();
  });

  it('explains the Android/Web limitation', () => {
    const { getByText } = render(<IOSOnlyBanner />);

    expect(getByText(/Android exposes only a limited shortcut surface/)).toBeTruthy();
  });
});
