/**
 * @jest-environment jsdom
 */

import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import LocationPicker from '@/modules/weatherkit-lab/components/LocationPicker';
import { PRESET_CITIES } from '@/modules/weatherkit-lab/preset-cities';

describe('LocationPicker', () => {
  it('renders one row per preset city', () => {
    const onSelect = jest.fn();
    const { getByTestId } = render(
      <LocationPicker selectedCityId="san-francisco" onSelect={onSelect} />,
    );
    for (const c of PRESET_CITIES) {
      expect(getByTestId(`weatherkit-city-${c.id}`)).toBeTruthy();
    }
  });

  it('marks the selected city via accessibilityState', () => {
    const onSelect = jest.fn();
    const { getByTestId } = render(<LocationPicker selectedCityId="tokyo" onSelect={onSelect} />);
    const tokyo = getByTestId('weatherkit-city-tokyo');
    expect(tokyo.props.accessibilityState).toEqual({ selected: true });
    const sf = getByTestId('weatherkit-city-san-francisco');
    expect(sf.props.accessibilityState).toEqual({ selected: false });
  });

  it('invokes onSelect with the city id when pressed', () => {
    const onSelect = jest.fn();
    const { getByTestId } = render(
      <LocationPicker selectedCityId="san-francisco" onSelect={onSelect} />,
    );
    fireEvent.press(getByTestId('weatherkit-city-london'));
    expect(onSelect).toHaveBeenCalledWith('london');
  });
});
