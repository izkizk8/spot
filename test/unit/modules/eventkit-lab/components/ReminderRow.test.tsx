/**
 * ReminderRow component tests.
 * Feature: 037-eventkit
 */

import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';
import { Alert } from 'react-native';

import type { ReminderSummary } from '@/modules/eventkit-lab/types';

describe('ReminderRow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const baseReminder: ReminderSummary = {
    id: 'rem-1',
    title: 'Buy milk',
    dueDate: new Date('2026-05-01T18:00:00Z'),
    listId: 'list-1',
    priority: 'high',
    completed: false,
  };

  it('renders title and due date', () => {
    const { ReminderRow } = require('@/modules/eventkit-lab/components/ReminderRow');

    const { getByText } = render(
      <ReminderRow reminder={baseReminder} onEdit={jest.fn()} onDelete={jest.fn()} />,
    );

    expect(getByText('Buy milk')).toBeTruthy();
    expect(getByText(/Due/)).toBeTruthy();
  });

  it('renders priority badge for high priority', () => {
    const { ReminderRow } = require('@/modules/eventkit-lab/components/ReminderRow');

    const { getByText } = render(
      <ReminderRow reminder={baseReminder} onEdit={jest.fn()} onDelete={jest.fn()} />,
    );

    expect(getByText('HIGH')).toBeTruthy();
  });

  it('does not render a priority badge when priority="none"', () => {
    const { ReminderRow } = require('@/modules/eventkit-lab/components/ReminderRow');
    const noPriority: ReminderSummary = { ...baseReminder, priority: 'none' };

    const { queryByText } = render(
      <ReminderRow reminder={noPriority} onEdit={jest.fn()} onDelete={jest.fn()} />,
    );

    expect(queryByText('HIGH')).toBeNull();
    expect(queryByText('LOW')).toBeNull();
    expect(queryByText('MED')).toBeNull();
  });

  it('omits the due-date line when dueDate is undefined', () => {
    const { ReminderRow } = require('@/modules/eventkit-lab/components/ReminderRow');
    const noDue: ReminderSummary = { ...baseReminder, dueDate: undefined };

    const { queryByText } = render(
      <ReminderRow reminder={noDue} onEdit={jest.fn()} onDelete={jest.fn()} />,
    );

    expect(queryByText(/^Due /)).toBeNull();
  });

  it('calls onEdit with the reminder when tapped', () => {
    const { ReminderRow } = require('@/modules/eventkit-lab/components/ReminderRow');
    const onEdit = jest.fn();

    const { getByTestId } = render(
      <ReminderRow reminder={baseReminder} onEdit={onEdit} onDelete={jest.fn()} />,
    );

    fireEvent.press(getByTestId('eventkit-reminder-rem-1'));
    expect(onEdit).toHaveBeenCalledWith(baseReminder);
  });

  it('long-press → destructive confirm calls onDelete with reminder id', () => {
    const { ReminderRow } = require('@/modules/eventkit-lab/components/ReminderRow');
    const onDelete = jest.fn();

    jest.spyOn(Alert, 'alert').mockImplementation((_title, _msg, buttons) => {
      const destructive = buttons?.find((b) => b.style === 'destructive');
      destructive?.onPress?.();
    });

    const { getByTestId } = render(
      <ReminderRow reminder={baseReminder} onEdit={jest.fn()} onDelete={onDelete} />,
    );

    fireEvent(getByTestId('eventkit-reminder-rem-1'), 'longPress');
    expect(onDelete).toHaveBeenCalledWith('rem-1');
  });

  it('long-press → cancel does NOT call onDelete', () => {
    const { ReminderRow } = require('@/modules/eventkit-lab/components/ReminderRow');
    const onDelete = jest.fn();

    jest.spyOn(Alert, 'alert').mockImplementation((_title, _msg, buttons) => {
      const cancel = buttons?.find((b) => b.style === 'cancel');
      cancel?.onPress?.();
    });

    const { getByTestId } = render(
      <ReminderRow reminder={baseReminder} onEdit={jest.fn()} onDelete={onDelete} />,
    );

    fireEvent(getByTestId('eventkit-reminder-rem-1'), 'longPress');
    expect(onDelete).not.toHaveBeenCalled();
  });
});
