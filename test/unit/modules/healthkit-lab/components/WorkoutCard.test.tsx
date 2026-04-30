/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render } from '@testing-library/react-native';

import WorkoutCard from '@/modules/healthkit-lab/components/WorkoutCard';
import type { WorkoutSummary } from '@/modules/healthkit-lab/sample-types';

const WORKOUTS: readonly WorkoutSummary[] = [
  {
    id: 'w1',
    activityName: 'Running',
    start: '2026-04-30T07:00:00Z',
    end: '2026-04-30T07:35:00Z',
    calories: 312,
    duration: 2100,
  },
  {
    id: 'w2',
    activityName: 'Cycling',
    start: '2026-04-29T18:00:00Z',
    end: '2026-04-29T19:05:00Z',
    calories: 480,
    duration: 3900,
  },
];

describe('WorkoutCard', () => {
  it('renders empty state when no workouts', () => {
    const { getByTestId } = render(<WorkoutCard workouts={[]} />);
    expect(getByTestId('healthkit-workouts-empty')).toBeTruthy();
  });

  it('renders one row per workout with activity name, duration, calories', () => {
    const { getByTestId, getByText } = render(<WorkoutCard workouts={WORKOUTS} />);
    expect(getByTestId('healthkit-workout-w1')).toBeTruthy();
    expect(getByTestId('healthkit-workout-w2')).toBeTruthy();
    expect(getByText('Running')).toBeTruthy();
    expect(getByText('Cycling')).toBeTruthy();
    expect(getByText('312 kcal')).toBeTruthy();
    expect(getByText('480 kcal')).toBeTruthy();
  });
});
