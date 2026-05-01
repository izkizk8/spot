/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render } from '@testing-library/react-native';

import DailyForecast from '@/modules/weatherkit-lab/components/DailyForecast';
import type { DailyForecastEntry } from '@/native/weatherkit.types';

function makeDays(n: number): DailyForecastEntry[] {
  return Array.from({ length: n }, (_, i) => ({
    date: `2026-05-${(9 + i).toString().padStart(2, '0')}T00:00:00Z`,
    highTemperature: 20 + i,
    lowTemperature: 10 + i,
    condition: 'rain',
    precipitationChance: 0.4,
  }));
}

describe('DailyForecast', () => {
  it('renders the empty placeholder when daily is empty', () => {
    const { getByTestId } = render(<DailyForecast daily={[]} units='metric' />);
    expect(getByTestId('weatherkit-daily-empty')).toBeTruthy();
  });

  it('renders up to 10 day rows', () => {
    const { getAllByTestId } = render(<DailyForecast daily={makeDays(15)} units='metric' />);
    const rows = getAllByTestId(/^weatherkit-daily-\d+$/);
    expect(rows).toHaveLength(10);
  });

  it('renders fewer than 10 rows when input is shorter', () => {
    const { getAllByTestId } = render(<DailyForecast daily={makeDays(3)} units='imperial' />);
    const rows = getAllByTestId(/^weatherkit-daily-\d+$/);
    expect(rows).toHaveLength(3);
  });
});
