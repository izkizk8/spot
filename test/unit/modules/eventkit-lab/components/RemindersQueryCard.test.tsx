/**
 * RemindersQueryCard component tests.
 * Feature: 037-eventkit
 */

import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';

import type { ReminderSummary } from '@/modules/eventkit-lab/types';

describe('RemindersQueryCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const sampleReminders: ReminderSummary[] = [
    {
      id: 'rem-1',
      title: 'Buy milk',
      listId: 'list-1',
      priority: 'none',
      completed: false,
    },
    {
      id: 'rem-2',
      title: 'Call dentist',
      listId: 'list-1',
      priority: 'high',
      completed: true,
    },
  ];

  it('renders a 3-segment filter toggle (incomplete/completed/all)', () => {
    const { RemindersQueryCard } = require('@/modules/eventkit-lab/components/RemindersQueryCard');

    const { getByTestId } = render(
      <RemindersQueryCard
        filter="incomplete"
        reminders={[]}
        onFilterChange={jest.fn()}
        onRefresh={jest.fn()}
        onEdit={jest.fn()}
        onDelete={jest.fn()}
      />,
    );

    expect(getByTestId('eventkit-reminders-filter-incomplete')).toBeTruthy();
    expect(getByTestId('eventkit-reminders-filter-completed')).toBeTruthy();
    expect(getByTestId('eventkit-reminders-filter-all')).toBeTruthy();
  });

  it('calls onFilterChange when a different segment is pressed', () => {
    const { RemindersQueryCard } = require('@/modules/eventkit-lab/components/RemindersQueryCard');
    const onFilterChange = jest.fn();

    const { getByTestId } = render(
      <RemindersQueryCard
        filter="incomplete"
        reminders={[]}
        onFilterChange={onFilterChange}
        onRefresh={jest.fn()}
        onEdit={jest.fn()}
        onDelete={jest.fn()}
      />,
    );

    fireEvent.press(getByTestId('eventkit-reminders-filter-completed'));
    expect(onFilterChange).toHaveBeenCalledWith('completed');

    fireEvent.press(getByTestId('eventkit-reminders-filter-all'));
    expect(onFilterChange).toHaveBeenCalledWith('all');
  });

  it('renders a ReminderRow for each reminder', () => {
    const { RemindersQueryCard } = require('@/modules/eventkit-lab/components/RemindersQueryCard');

    const { getByTestId } = render(
      <RemindersQueryCard
        filter="all"
        reminders={sampleReminders}
        onFilterChange={jest.fn()}
        onRefresh={jest.fn()}
        onEdit={jest.fn()}
        onDelete={jest.fn()}
      />,
    );

    expect(getByTestId('eventkit-reminder-rem-1')).toBeTruthy();
    expect(getByTestId('eventkit-reminder-rem-2')).toBeTruthy();
  });

  it('renders empty state when there are no reminders', () => {
    const { RemindersQueryCard } = require('@/modules/eventkit-lab/components/RemindersQueryCard');

    const { getByText } = render(
      <RemindersQueryCard
        filter="incomplete"
        reminders={[]}
        onFilterChange={jest.fn()}
        onRefresh={jest.fn()}
        onEdit={jest.fn()}
        onDelete={jest.fn()}
      />,
    );

    expect(getByText('No reminders match')).toBeTruthy();
  });

  it('invokes onRefresh when Refresh is pressed', () => {
    const { RemindersQueryCard } = require('@/modules/eventkit-lab/components/RemindersQueryCard');
    const onRefresh = jest.fn();

    const { getByTestId } = render(
      <RemindersQueryCard
        filter="incomplete"
        reminders={[]}
        onFilterChange={jest.fn()}
        onRefresh={onRefresh}
        onEdit={jest.fn()}
        onDelete={jest.fn()}
      />,
    );

    fireEvent.press(getByTestId('eventkit-reminders-refresh'));
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });
});
