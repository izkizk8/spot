/**
 * Unit tests: CurrentActivityCard (T030 / US3).
 *
 * @jest-environment jsdom
 */

import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import CurrentActivityCard from '@/modules/handoff-lab/components/CurrentActivityCard';
import type { ActivityDefinition } from '@/modules/handoff-lab/types';

const sample: ActivityDefinition = {
  activityType: 'com.example.demo',
  title: 'My Activity',
  webpageURL: 'https://example.com/x',
  userInfo: { foo: 'bar', baz: 'qux' },
  requiredUserInfoKeys: ['foo', 'baz'],
  isEligibleForHandoff: true,
  isEligibleForSearch: false,
  isEligibleForPrediction: true,
};

describe('CurrentActivityCard', () => {
  it('shows empty-state copy when currentActivity is null', () => {
    const { getByText, getByTestId } = render(
      <CurrentActivityCard currentActivity={null} onResign={jest.fn()} />,
    );
    expect(getByText(/No current activity/i)).toBeTruthy();
    const btn = getByTestId('resign-btn');
    expect(btn.props.accessibilityState?.disabled).toBe(true);
  });

  it('renders activityType, title, webpageURL when populated', () => {
    const { getByText } = render(
      <CurrentActivityCard currentActivity={sample} onResign={jest.fn()} />,
    );
    expect(getByText(/com\.example\.demo/)).toBeTruthy();
    expect(getByText(/My Activity/)).toBeTruthy();
    expect(getByText(/https:\/\/example\.com\/x/)).toBeTruthy();
  });

  it('renders userInfo as JSON', () => {
    const { getByText } = render(
      <CurrentActivityCard currentActivity={sample} onResign={jest.fn()} />,
    );
    expect(getByText(/"foo"/)).toBeTruthy();
    expect(getByText(/"bar"/)).toBeTruthy();
  });

  it('renders requiredUserInfoKeys sorted', () => {
    const { getAllByText } = render(
      <CurrentActivityCard currentActivity={sample} onResign={jest.fn()} />,
    );
    // sorted: baz, foo — joined as "baz, foo"
    const matches = getAllByText(/baz, foo/);
    expect(matches.length).toBeGreaterThan(0);
  });

  it('renders all three eligibility flags as themed pills', () => {
    const { getAllByText } = render(
      <CurrentActivityCard currentActivity={sample} onResign={jest.fn()} />,
    );
    expect(getAllByText(/Handoff/i).length).toBeGreaterThan(0);
    expect(getAllByText(/Search/i).length).toBeGreaterThan(0);
    expect(getAllByText(/Prediction/i).length).toBeGreaterThan(0);
  });

  it('calls onResign exactly once when "Resign" tapped (populated)', () => {
    const onResign = jest.fn();
    const { getByTestId } = render(
      <CurrentActivityCard currentActivity={sample} onResign={onResign} />,
    );
    fireEvent.press(getByTestId('resign-btn'));
    expect(onResign).toHaveBeenCalledTimes(1);
  });

  it('Resign button is enabled when currentActivity is populated', () => {
    const { getByTestId } = render(
      <CurrentActivityCard currentActivity={sample} onResign={jest.fn()} />,
    );
    const btn = getByTestId('resign-btn');
    expect(btn.props.accessibilityState?.disabled).toBe(false);
  });
});
