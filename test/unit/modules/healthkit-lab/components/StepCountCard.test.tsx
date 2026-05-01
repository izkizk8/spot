/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render } from '@testing-library/react-native';

import StepCountCard from '@/modules/healthkit-lab/components/StepCountCard';
import type { DailyStep } from '@/modules/healthkit-lab/sample-types';

const SAMPLE: readonly DailyStep[] = [
  { date: '2026-04-24', steps: 3000 },
  { date: '2026-04-25', steps: 6000 },
  { date: '2026-04-26', steps: 9000 },
  { date: '2026-04-27', steps: 12000 },
  { date: '2026-04-28', steps: 5000 },
  { date: '2026-04-29', steps: 8000 },
  { date: '2026-04-30', steps: 11000 },
];

describe('StepCountCard', () => {
  it('renders the empty state when steps7d is empty', () => {
    const { getByTestId, queryByTestId } = render(<StepCountCard steps7d={[]} />);
    expect(getByTestId('healthkit-step-empty')).toBeTruthy();
    expect(queryByTestId('healthkit-step-chart')).toBeNull();
  });

  it('renders one row per provided day', () => {
    const { getByTestId } = render(<StepCountCard steps7d={SAMPLE} />);
    for (const d of SAMPLE) {
      expect(getByTestId(`healthkit-step-row-${d.date}`)).toBeTruthy();
    }
  });

  it('shows the formatted step count value', () => {
    const { getByText } = render(<StepCountCard steps7d={SAMPLE} />);
    expect(getByText('12,000')).toBeTruthy();
  });
});
