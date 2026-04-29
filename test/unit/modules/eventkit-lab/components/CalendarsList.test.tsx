/**
 * CalendarsList component tests.
 * Feature: 037-eventkit
 */

import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';

import type { CalendarSummary } from '@/modules/eventkit-lab/types';

describe('CalendarsList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const sampleCalendars: CalendarSummary[] = [
    {
      id: 'cal-1',
      title: 'Personal',
      type: 'local',
      color: '#FF0000',
      allowsModifications: true,
    },
    {
      id: 'cal-2',
      title: 'Work',
      type: 'caldav',
      color: '#00FF00',
      allowsModifications: false,
    },
  ];

  it('renders empty state when no calendars are provided', () => {
    const { CalendarsList } = require('@/modules/eventkit-lab/components/CalendarsList');

    const { getByText } = render(<CalendarsList calendars={[]} onRefresh={jest.fn()} />);

    expect(getByText('No calendars')).toBeTruthy();
  });

  it('renders rows with title and type for each calendar', () => {
    const { CalendarsList } = require('@/modules/eventkit-lab/components/CalendarsList');

    const { getByText, getByTestId } = render(
      <CalendarsList calendars={sampleCalendars} onRefresh={jest.fn()} />,
    );

    expect(getByText('Personal')).toBeTruthy();
    expect(getByText('local')).toBeTruthy();
    expect(getByText('Work')).toBeTruthy();
    expect(getByText('caldav')).toBeTruthy();
    expect(getByTestId('eventkit-calendar-cal-1')).toBeTruthy();
    expect(getByTestId('eventkit-calendar-cal-2')).toBeTruthy();
  });

  it('invokes onRefresh once when Refresh is pressed', () => {
    const { CalendarsList } = require('@/modules/eventkit-lab/components/CalendarsList');
    const onRefresh = jest.fn();

    const { getByTestId } = render(
      <CalendarsList calendars={sampleCalendars} onRefresh={onRefresh} />,
    );

    fireEvent.press(getByTestId('eventkit-calendars-refresh'));
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });
});
