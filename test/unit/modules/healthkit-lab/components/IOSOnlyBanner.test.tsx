/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render } from '@testing-library/react-native';

import IOSOnlyBanner from '@/modules/healthkit-lab/components/IOSOnlyBanner';

describe('IOSOnlyBanner', () => {
  it('renders with the expected testID', () => {
    const { getByTestId } = render(<IOSOnlyBanner />);
    expect(getByTestId('healthkit-ios-only-banner')).toBeTruthy();
  });

  it('explains HealthKit is iOS-only', () => {
    const { getByText } = render(<IOSOnlyBanner />);
    expect(getByText(/iOS-only framework/i)).toBeTruthy();
  });
});
