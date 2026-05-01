/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render } from '@testing-library/react-native';

import CurrentWeatherCard, {
  formatTemperature,
  formatWindSpeed,
} from '@/modules/weatherkit-lab/components/CurrentWeatherCard';
import type { CurrentWeather } from '@/native/weatherkit.types';

const SAMPLE: CurrentWeather = {
  temperature: 22.4,
  apparentTemperature: 21.7,
  condition: 'partlyCloudy',
  conditionLabel: 'Partly Cloudy',
  humidity: 0.62,
  windSpeed: 14.5,
  windDirection: 180,
  uvIndex: 5,
  isDaylight: true,
};

describe('CurrentWeatherCard', () => {
  it('renders the empty placeholder when current is null', () => {
    const { getByTestId, queryByTestId } = render(
      <CurrentWeatherCard current={null} units='metric' />,
    );
    expect(getByTestId('weatherkit-current-card-empty')).toBeTruthy();
    expect(queryByTestId('weatherkit-current-card')).toBeNull();
  });

  it('renders temperature, condition, humidity and wind for a payload', () => {
    const { getByTestId } = render(<CurrentWeatherCard current={SAMPLE} units='metric' />);
    expect(getByTestId('weatherkit-current-card')).toBeTruthy();
    expect(getByTestId('weatherkit-current-temperature').props.children).toBe('22°C');
    expect(getByTestId('weatherkit-current-humidity').props.children).toEqual([
      'Humidity ',
      62,
      '%',
    ]);
    expect(getByTestId('weatherkit-current-wind').props.children).toEqual(['Wind ', '14.5 km/h']);
  });

  it('formatTemperature switches unit suffix per system', () => {
    expect(formatTemperature(20, 'metric')).toBe('20°C');
    expect(formatTemperature(68, 'imperial')).toBe('68°F');
    expect(formatTemperature(273.25, 'scientific')).toBe('273.3 K');
  });

  it('formatWindSpeed switches unit suffix per system', () => {
    expect(formatWindSpeed(10, 'metric')).toBe('10.0 km/h');
    expect(formatWindSpeed(10, 'imperial')).toBe('10.0 mph');
    expect(formatWindSpeed(10, 'scientific')).toBe('10.0 km/h');
  });
});
