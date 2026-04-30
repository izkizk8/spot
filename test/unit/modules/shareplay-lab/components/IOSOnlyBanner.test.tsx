/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render } from '@testing-library/react-native';

import IOSOnlyBanner from '@/modules/shareplay-lab/components/IOSOnlyBanner';

describe('IOSOnlyBanner (shareplay)', () => {
  it('renders with the expected testID', () => {
    const { getByTestId } = render(<IOSOnlyBanner />);
    expect(getByTestId('shareplay-ios-only-banner')).toBeTruthy();
  });

  it('mentions GroupActivities and iOS 15', () => {
    const { getAllByText } = render(<IOSOnlyBanner />);
    expect(getAllByText(/GroupActivities/).length).toBeGreaterThan(0);
    expect(getAllByText(/iOS 15/).length).toBeGreaterThan(0);
  });
});
