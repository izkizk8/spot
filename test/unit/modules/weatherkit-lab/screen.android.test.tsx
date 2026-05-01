/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render } from '@testing-library/react-native';

import WeatherKitLabAndroid from '@/modules/weatherkit-lab/screen.android';

describe('weatherkit-lab screen (Android)', () => {
  it('renders only the IOS-only banner', () => {
    const { getByTestId, queryByTestId } = render(<WeatherKitLabAndroid />);
    expect(getByTestId('weatherkit-ios-only-banner')).toBeTruthy();
    expect(queryByTestId('weatherkit-location-picker')).toBeNull();
    expect(queryByTestId('weatherkit-current-card-empty')).toBeNull();
  });
});
