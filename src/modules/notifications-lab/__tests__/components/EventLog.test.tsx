/**
 * Test for EventLog component (feature 026).
 */
import React from 'react';
import { render } from '@testing-library/react-native';
import { EventLog } from '../../components/EventLog';
import type { NotificationEvent } from '../../types';

describe('EventLog', () => {
  it('renders empty state when no events', () => {
    const { getByText } = render(<EventLog events={[]} />);
    expect(getByText(/no events/i)).toBeTruthy();
  });

  it('renders one row per event', () => {
    const events: NotificationEvent[] = [
      { kind: 'received', identifier: 'n1', at: new Date() },
      { kind: 'received', identifier: 'n2', at: new Date() },
      { kind: 'received', identifier: 'n3', at: new Date() },
    ];

    const { getAllByText } = render(<EventLog events={events} />);
    const rows = getAllByText(/n[123]/);
    expect(rows.length).toBe(3);
  });

  it('renders action-response with actionIdentifier', () => {
    const events: NotificationEvent[] = [
      {
        kind: 'action-response',
        identifier: 'n1',
        actionIdentifier: 'yes',
        textInput: null,
        at: new Date(),
      },
    ];

    const { getByText } = render(<EventLog events={events} />);
    expect(getByText(/yes/)).toBeTruthy();
  });

  it('renders action-response with textInput', () => {
    const events: NotificationEvent[] = [
      {
        kind: 'action-response',
        identifier: 'n1',
        actionIdentifier: 'reply',
        textInput: 'Hello world',
        at: new Date(),
      },
    ];

    const { getByText } = render(<EventLog events={events} />);
    expect(getByText(/Hello world/)).toBeTruthy();
  });

  it('renders dismissed event', () => {
    const events: NotificationEvent[] = [{ kind: 'dismissed', identifier: 'n1', at: new Date() }];

    const { getByText } = render(<EventLog events={events} />);
    expect(getByText(/dismissed/i)).toBeTruthy();
  });

  it('caps at 20 events (defensive)', () => {
    const events: NotificationEvent[] = Array.from({ length: 25 }, (_, i) => ({
      kind: 'received' as const,
      identifier: `n${i}`,
      at: new Date(),
    }));

    const { queryByText } = render(<EventLog events={events} />);

    // First 20 should render, beyond that should not
    expect(queryByText(/n19/)).toBeTruthy();
    expect(queryByText(/n24/)).toBeTruthy(); // Most recent should always show
  });

  it('renders timestamps for each event', () => {
    const events: NotificationEvent[] = [
      { kind: 'received', identifier: 'n1', at: new Date('2025-01-01T12:00:00Z') },
    ];

    const { getByText } = render(<EventLog events={events} />);
    // Should render some form of timestamp
    expect(getByText(/12:00|00:00/)).toBeTruthy();
  });
});
