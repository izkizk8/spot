/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render } from '@testing-library/react-native';

import WeatherKitLabWeb from '@/modules/weatherkit-lab/screen.web';

describe('weatherkit-lab screen (Web)', () => {
  it('renders only the IOS-only banner', () => {
    const { getByTestId, queryByTestId } = render(<WeatherKitLabWeb />);
    expect(getByTestId('weatherkit-ios-only-banner')).toBeTruthy();
    expect(queryByTestId('weatherkit-location-picker')).toBeNull();
  });
});
