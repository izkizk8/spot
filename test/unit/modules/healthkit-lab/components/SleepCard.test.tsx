/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render } from '@testing-library/react-native';

import SleepCard from '@/modules/healthkit-lab/components/SleepCard';
import type { SleepSegment } from '@/modules/healthkit-lab/sample-types';

const SEGMENTS: readonly SleepSegment[] = [
  {
    stage: 'inBed',
    startDate: '2026-04-29T22:00:00Z',
    endDate: '2026-04-29T22:15:00Z',
    minutes: 15,
  },
  {
    stage: 'core',
    startDate: '2026-04-29T22:15:00Z',
    endDate: '2026-04-30T00:00:00Z',
    minutes: 105,
  },
  { stage: 'rem', startDate: '2026-04-30T00:00:00Z', endDate: '2026-04-30T01:00:00Z', minutes: 60 },
  {
    stage: 'deep',
    startDate: '2026-04-30T01:00:00Z',
    endDate: '2026-04-30T01:45:00Z',
    minutes: 45,
  },
  {
    stage: 'awake',
    startDate: '2026-04-30T05:30:00Z',
    endDate: '2026-04-30T05:45:00Z',
    minutes: 15,
  },
];

describe('SleepCard', () => {
  it('renders empty state when no segments', () => {
    const { getByTestId } = render(<SleepCard segments={[]} />);
    expect(getByTestId('healthkit-sleep-empty')).toBeTruthy();
  });

  it('renders the stack and one block per segment', () => {
    const { getByTestId } = render(<SleepCard segments={SEGMENTS} />);
    expect(getByTestId('healthkit-sleep-stack')).toBeTruthy();
    for (let i = 0; i < SEGMENTS.length; i++) {
      expect(getByTestId(`healthkit-sleep-seg-${i}`)).toBeTruthy();
    }
  });

  it('renders a legend row per unique stage', () => {
    const { getByTestId } = render(<SleepCard segments={SEGMENTS} />);
    expect(getByTestId('healthkit-sleep-legend-inBed')).toBeTruthy();
    expect(getByTestId('healthkit-sleep-legend-core')).toBeTruthy();
    expect(getByTestId('healthkit-sleep-legend-rem')).toBeTruthy();
    expect(getByTestId('healthkit-sleep-legend-deep')).toBeTruthy();
    expect(getByTestId('healthkit-sleep-legend-awake')).toBeTruthy();
  });

  it('renders the total time as H:MM', () => {
    const { getByTestId } = render(<SleepCard segments={SEGMENTS} />);
    // 15+105+60+45+15 = 240 minutes = 4:00
    expect(getByTestId('healthkit-sleep-total').props.children.join('')).toContain('4:00');
  });
});
