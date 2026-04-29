/**
 * EventsQueryCard component tests.
 * Feature: 037-eventkit
 */

import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';

import type { EventSummary } from '@/modules/eventkit-lab/types';

describe('EventsQueryCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const sampleEvents: EventSummary[] = [
    {
      id: 'evt-1',
      title: 'Team standup',
      startDate: new Date('2026-05-01T09:00:00Z'),
      endDate: new Date('2026-05-01T09:30:00Z'),
      allDay: false,
      calendarId: 'cal-1',
    },
    {
      id: 'evt-2',
      title: 'Conference',
      startDate: new Date('2026-05-02T00:00:00Z'),
      endDate: new Date('2026-05-02T23:59:59Z'),
      allDay: true,
      calendarId: 'cal-1',
    },
  ];

  it('renders 3-segment range picker with all presets', () => {
    const { EventsQueryCard } = require('@/modules/eventkit-lab/components/EventsQueryCard');

    const { getByTestId } = render(
      <EventsQueryCard
        range="today"
        events={[]}
        onRangeChange={jest.fn()}
        onRefresh={jest.fn()}
        onEdit={jest.fn()}
        onDelete={jest.fn()}
      />,
    );

    expect(getByTestId('eventkit-events-range-today')).toBeTruthy();
    expect(getByTestId('eventkit-events-range-next7')).toBeTruthy();
    expect(getByTestId('eventkit-events-range-next30')).toBeTruthy();
  });

  it('calls onRangeChange when a different segment is pressed', () => {
    const { EventsQueryCard } = require('@/modules/eventkit-lab/components/EventsQueryCard');
    const onRangeChange = jest.fn();

    const { getByTestId } = render(
      <EventsQueryCard
        range="today"
        events={[]}
        onRangeChange={onRangeChange}
        onRefresh={jest.fn()}
        onEdit={jest.fn()}
        onDelete={jest.fn()}
      />,
    );

    fireEvent.press(getByTestId('eventkit-events-range-next7'));
    expect(onRangeChange).toHaveBeenCalledWith('next7');

    fireEvent.press(getByTestId('eventkit-events-range-next30'));
    expect(onRangeChange).toHaveBeenCalledWith('next30');
  });

  it('renders an EventRow for each event', () => {
    const { EventsQueryCard } = require('@/modules/eventkit-lab/components/EventsQueryCard');

    const { getByTestId, getByText } = render(
      <EventsQueryCard
        range="next7"
        events={sampleEvents}
        onRangeChange={jest.fn()}
        onRefresh={jest.fn()}
        onEdit={jest.fn()}
        onDelete={jest.fn()}
      />,
    );

    expect(getByTestId('eventkit-event-evt-1')).toBeTruthy();
    expect(getByTestId('eventkit-event-evt-2')).toBeTruthy();
    expect(getByText('Team standup')).toBeTruthy();
    expect(getByText('Conference')).toBeTruthy();
  });

  it('renders empty state when there are no events', () => {
    const { EventsQueryCard } = require('@/modules/eventkit-lab/components/EventsQueryCard');

    const { getByText } = render(
      <EventsQueryCard
        range="today"
        events={[]}
        onRangeChange={jest.fn()}
        onRefresh={jest.fn()}
        onEdit={jest.fn()}
        onDelete={jest.fn()}
      />,
    );

    expect(getByText('No events in this range')).toBeTruthy();
  });

  it('invokes onRefresh when Refresh is pressed', () => {
    const { EventsQueryCard } = require('@/modules/eventkit-lab/components/EventsQueryCard');
    const onRefresh = jest.fn();

    const { getByTestId } = render(
      <EventsQueryCard
        range="today"
        events={[]}
        onRangeChange={jest.fn()}
        onRefresh={onRefresh}
        onEdit={jest.fn()}
        onDelete={jest.fn()}
      />,
    );

    fireEvent.press(getByTestId('eventkit-events-refresh'));
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });
});
