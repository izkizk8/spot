/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render } from '@testing-library/react-native';

import IOSOnlyBanner from '@/modules/weatherkit-lab/components/IOSOnlyBanner';

describe('IOSOnlyBanner (weatherkit)', () => {
  it('renders with the expected testID', () => {
    const { getByTestId } = render(<IOSOnlyBanner />);
    expect(getByTestId('weatherkit-ios-only-banner')).toBeTruthy();
  });

  it('mentions WeatherKit and iOS 16', () => {
    const { getAllByText } = render(<IOSOnlyBanner />);
    expect(getAllByText(/WeatherKit/).length).toBeGreaterThan(0);
    expect(getAllByText(/iOS 16/).length).toBeGreaterThan(0);
  });
});
