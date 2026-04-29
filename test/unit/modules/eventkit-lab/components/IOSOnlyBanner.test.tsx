/**
 * IOSOnlyBanner component tests.
 * Feature: 037-eventkit
 */

import { render } from '@testing-library/react-native';
import React from 'react';

describe('IOSOnlyBanner', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the iOS-only message text', () => {
    const { IOSOnlyBanner } = require('@/modules/eventkit-lab/components/IOSOnlyBanner');

    const { getByText } = render(<IOSOnlyBanner />);

    expect(getByText(/EventKit is iOS-only/i)).toBeTruthy();
  });

  it('exposes accessibilityRole="alert" on the banner container', () => {
    const { IOSOnlyBanner } = require('@/modules/eventkit-lab/components/IOSOnlyBanner');

    const { getByTestId } = render(<IOSOnlyBanner />);

    const banner = getByTestId('eventkit-ios-only-banner');
    expect(banner.props.accessibilityRole).toBe('alert');
  });
});
