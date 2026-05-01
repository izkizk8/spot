/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render } from '@testing-library/react-native';

import HourlyForecast from '@/modules/weatherkit-lab/components/HourlyForecast';
import type { HourlyForecastEntry } from '@/native/weatherkit.types';

function makeHours(n: number): HourlyForecastEntry[] {
  return Array.from({ length: n }, (_, i) => ({
    date: `2026-05-09T${i.toString().padStart(2, '0')}:00:00Z`,
    temperature: 15 + i,
    condition: 'clear',
    precipitationChance: i % 4 === 0 ? 0.25 : 0,
  }));
}

describe('HourlyForecast', () => {
  it('renders the empty placeholder when hourly is empty', () => {
    const { getByTestId, queryByTestId } = render(<HourlyForecast hourly={[]} units='metric' />);
    expect(getByTestId('weatherkit-hourly-empty')).toBeTruthy();
    expect(queryByTestId('weatherkit-hourly-scroll')).toBeNull();
  });

  it('renders the horizontal scroller with up to 24 cells', () => {
    const { getAllByTestId, queryByTestId } = render(
      <HourlyForecast hourly={makeHours(36)} units='metric' />,
    );
    const cells = getAllByTestId(/^weatherkit-hourly-\d+$/);
    expect(cells).toHaveLength(24);
    expect(queryByTestId('weatherkit-hourly-empty')).toBeNull();
  });

  it('renders fewer than 24 cells when input is shorter', () => {
    const { getAllByTestId } = render(<HourlyForecast hourly={makeHours(5)} units='metric' />);
    const cells = getAllByTestId(/^weatherkit-hourly-\d+$/);
    expect(cells).toHaveLength(5);
  });
});
