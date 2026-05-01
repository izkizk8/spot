/**
 * RemindersList component tests.
 * Feature: 037-eventkit
 */

import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';

import type { CalendarSummary } from '@/modules/eventkit-lab/types';

describe('RemindersList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const sampleLists: CalendarSummary[] = [
    {
      id: 'list-1',
      title: 'Personal',
      type: 'local',
      color: '#FF0000',
      allowsModifications: true,
    },
    {
      id: 'list-2',
      title: 'Shared',
      type: 'caldav',
      color: '#00FF00',
      allowsModifications: true,
    },
  ];

  it('renders empty state when no lists are provided', () => {
    const { RemindersList } = require('@/modules/eventkit-lab/components/RemindersList');

    const { getByText } = render(<RemindersList lists={[]} onRefresh={jest.fn()} />);

    expect(getByText('No lists')).toBeTruthy();
  });

  it('renders rows with title for each list', () => {
    const { RemindersList } = require('@/modules/eventkit-lab/components/RemindersList');

    const { getByText, getByTestId } = render(
      <RemindersList lists={sampleLists} onRefresh={jest.fn()} />,
    );

    expect(getByText('Personal')).toBeTruthy();
    expect(getByText('Shared')).toBeTruthy();
    expect(getByTestId('eventkit-reminder-list-list-1')).toBeTruthy();
    expect(getByTestId('eventkit-reminder-list-list-2')).toBeTruthy();
  });

  it('invokes onRefresh once when Refresh is pressed', () => {
    const { RemindersList } = require('@/modules/eventkit-lab/components/RemindersList');
    const onRefresh = jest.fn();

    const { getByTestId } = render(<RemindersList lists={sampleLists} onRefresh={onRefresh} />);

    fireEvent.press(getByTestId('eventkit-reminder-lists-refresh'));
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });
});
