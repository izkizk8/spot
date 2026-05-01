/**
 * StatsCard Test
 * Feature: 053-swiftdata
 */

import { render, screen } from '@testing-library/react-native';
import { describe, expect, it } from '@jest/globals';
import React from 'react';

import StatsCard from '@/modules/swiftdata-lab/components/StatsCard';

describe('StatsCard', () => {
  it('renders the totals row', () => {
    render(
      <StatsCard
        stats={{
          total: 4,
          completed: 2,
          active: 2,
          byPriority: { low: 1, medium: 1, high: 2 },
          completionRate: 0.5,
        }}
      />,
    );
    expect(screen.getByText(/Total 4/)).toBeTruthy();
    expect(screen.getByText(/Active 2/)).toBeTruthy();
    expect(screen.getByText(/Completed 2/)).toBeTruthy();
    expect(screen.getByText(/High 2/)).toBeTruthy();
    expect(screen.getByText(/Med 1/)).toBeTruthy();
    expect(screen.getByText(/Low 1/)).toBeTruthy();
    expect(screen.getByText(/50%/)).toBeTruthy();
  });

  it('renders 0% for an empty list', () => {
    render(
      <StatsCard
        stats={{
          total: 0,
          completed: 0,
          active: 0,
          byPriority: { low: 0, medium: 0, high: 0 },
          completionRate: 0,
        }}
      />,
    );
    expect(screen.getByText(/0%/)).toBeTruthy();
  });

  it('exposes a progressbar a11y role', () => {
    render(
      <StatsCard
        stats={{
          total: 2,
          completed: 1,
          active: 1,
          byPriority: { low: 0, medium: 1, high: 1 },
          completionRate: 0.5,
        }}
      />,
    );
    const bar = screen.getByLabelText(/Completion rate bar/);
    expect(bar.props.accessibilityValue).toMatchObject({ now: 50, min: 0, max: 100 });
  });

  it('clamps completionRate above 1.0 visually to 100%', () => {
    render(
      <StatsCard
        stats={{
          total: 2,
          completed: 2,
          active: 0,
          byPriority: { low: 0, medium: 1, high: 1 },
          completionRate: 1.5,
        }}
      />,
    );
    expect(screen.getByText(/100%/)).toBeTruthy();
  });
});
