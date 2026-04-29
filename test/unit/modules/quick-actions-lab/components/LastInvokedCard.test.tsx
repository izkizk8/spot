/**
 * LastInvokedCard tests.
 * Feature: 039-quick-actions
 */

import { render } from '@testing-library/react-native';
import React from 'react';

import { LastInvokedCard } from '@/modules/quick-actions-lab/components/LastInvokedCard';

describe('LastInvokedCard', () => {
  it('shows empty-state copy when event is null', () => {
    const { getByText } = render(<LastInvokedCard event={null} />);
    expect(getByText(/No quick action invoked this session/)).toBeTruthy();
  });

  it('renders type, timestamp, and userInfo when populated', () => {
    const { getByText, getByTestId } = render(
      <LastInvokedCard
        event={{
          type: 'open-sensors',
          userInfo: { route: '/modules/sensors-playground' },
          timestamp: '2026-04-30T12:34:56Z',
        }}
      />,
    );
    expect(getByText('open-sensors')).toBeTruthy();
    expect(getByText('2026-04-30T12:34:56Z')).toBeTruthy();
    expect(getByTestId('last-invoked-userinfo')).toBeTruthy();
  });

  it('most-recent-wins: rerendering with a new event replaces the display', () => {
    const { rerender, getByText, queryByText } = render(
      <LastInvokedCard
        event={{
          type: 'open-sensors',
          userInfo: {},
          timestamp: '2026-04-30T12:34:56Z',
        }}
      />,
    );
    expect(getByText('open-sensors')).toBeTruthy();
    rerender(
      <LastInvokedCard
        event={{
          type: 'add-mood-happy',
          userInfo: { mood: 'happy' },
          timestamp: '2026-04-30T13:00:00Z',
        }}
      />,
    );
    expect(getByText('add-mood-happy')).toBeTruthy();
    expect(queryByText('open-sensors')).toBeNull();
  });
});
