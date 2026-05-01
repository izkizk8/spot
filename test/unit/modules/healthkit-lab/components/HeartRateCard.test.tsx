/**
 * @jest-environment jsdom
 */

import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import HeartRateCard from '@/modules/healthkit-lab/components/HeartRateCard';
import type { HeartRateSample } from '@/modules/healthkit-lab/sample-types';

const SAMPLES: readonly HeartRateSample[] = [
  { bpm: 60, timestamp: '2026-04-30T08:00:00.000Z' },
  { bpm: 72, timestamp: '2026-04-30T09:00:00.000Z' },
  { bpm: 88, timestamp: '2026-04-30T10:00:00.000Z' },
];

describe('HeartRateCard', () => {
  it('shows empty state when there is no latest sample', () => {
    const { getByTestId } = render(
      <HeartRateCard samples={[]} latest={null} onAddManualReading={() => {}} />,
    );
    expect(getByTestId('healthkit-hr-empty')).toBeTruthy();
  });

  it('shows the latest sample value when provided', () => {
    const { getByTestId, getByText } = render(
      <HeartRateCard samples={SAMPLES} latest={SAMPLES[2]} onAddManualReading={() => {}} />,
    );
    expect(getByTestId('healthkit-hr-latest')).toBeTruthy();
    expect(getByText(/88/)).toBeTruthy();
  });

  it('renders one bar per sample', () => {
    const { getByTestId } = render(
      <HeartRateCard samples={SAMPLES} latest={SAMPLES[2]} onAddManualReading={() => {}} />,
    );
    for (let i = 0; i < SAMPLES.length; i++) {
      expect(getByTestId(`healthkit-hr-bar-${i}`)).toBeTruthy();
    }
  });

  it('invokes onAddManualReading with 72bpm when the manual button is pressed', () => {
    const onAdd = jest.fn();
    const { getByTestId } = render(
      <HeartRateCard samples={[]} latest={null} onAddManualReading={onAdd} />,
    );
    fireEvent.press(getByTestId('healthkit-hr-manual-btn'));
    expect(onAdd).toHaveBeenCalledTimes(1);
    expect(onAdd).toHaveBeenCalledWith(72);
  });
});
