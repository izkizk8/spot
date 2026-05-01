/**
 * ReminderComposer component tests.
 * Feature: 037-eventkit
 */

import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';

import type { CalendarSummary } from '@/modules/eventkit-lab/types';

describe('ReminderComposer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const writableList: CalendarSummary = {
    id: 'list-1',
    title: 'Personal',
    type: 'local',
    color: '#FF0000',
    allowsModifications: true,
  };

  const readonlyList: CalendarSummary = {
    id: 'list-2',
    title: 'Read-only',
    type: 'subscribed',
    color: '#888888',
    allowsModifications: false,
  };

  it('disables Save button when title is empty', () => {
    const { ReminderComposer } = require('@/modules/eventkit-lab/components/ReminderComposer');
    const onSave = jest.fn();

    const { getByTestId } = render(
      <ReminderComposer lists={[writableList]} onSave={onSave} inFlight={false} />,
    );

    const save = getByTestId('eventkit-reminder-save');
    expect(save.props.accessibilityState?.disabled ?? save.props.disabled).toBe(true);

    fireEvent.press(save);
    expect(onSave).not.toHaveBeenCalled();
  });

  it('allows Save when title is set even without a due date (no due date is allowed)', () => {
    const { ReminderComposer } = require('@/modules/eventkit-lab/components/ReminderComposer');
    const onSave = jest.fn();

    const { getByTestId } = render(
      <ReminderComposer lists={[writableList]} onSave={onSave} inFlight={false} />,
    );

    fireEvent.changeText(getByTestId('eventkit-reminder-title'), 'Pick up dog');

    const save = getByTestId('eventkit-reminder-save');
    expect(save.props.accessibilityState?.disabled ?? save.props.disabled).toBe(false);

    fireEvent.press(save);
    expect(onSave).toHaveBeenCalledTimes(1);
    const draft = onSave.mock.calls[0][0];
    expect(draft.title).toBe('Pick up dog');
    expect(draft.dueDate).toBeUndefined();
    expect(draft.listId).toBe('list-1');
    expect(draft.priority).toBe('none');
  });

  it('hides read-only lists from the list picker', () => {
    const { ReminderComposer } = require('@/modules/eventkit-lab/components/ReminderComposer');

    const { queryByTestId, getByTestId } = render(
      <ReminderComposer lists={[writableList, readonlyList]} onSave={jest.fn()} inFlight={false} />,
    );

    expect(getByTestId('eventkit-reminder-list-list-1')).toBeTruthy();
    expect(queryByTestId('eventkit-reminder-list-list-2')).toBeNull();
  });

  it('wires priority selection into the saved draft', () => {
    const { ReminderComposer } = require('@/modules/eventkit-lab/components/ReminderComposer');
    const onSave = jest.fn();

    const { getByTestId } = render(
      <ReminderComposer lists={[writableList]} onSave={onSave} inFlight={false} />,
    );

    fireEvent.changeText(getByTestId('eventkit-reminder-title'), 'Important');
    fireEvent.press(getByTestId('eventkit-reminder-priority-high'));
    fireEvent.press(getByTestId('eventkit-reminder-save'));

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave.mock.calls[0][0].priority).toBe('high');
  });

  it('renders all four priority options', () => {
    const { ReminderComposer } = require('@/modules/eventkit-lab/components/ReminderComposer');

    const { getByTestId } = render(
      <ReminderComposer lists={[writableList]} onSave={jest.fn()} inFlight={false} />,
    );

    expect(getByTestId('eventkit-reminder-priority-none')).toBeTruthy();
    expect(getByTestId('eventkit-reminder-priority-low')).toBeTruthy();
    expect(getByTestId('eventkit-reminder-priority-medium')).toBeTruthy();
    expect(getByTestId('eventkit-reminder-priority-high')).toBeTruthy();
  });

  it('renders "Save" / "New reminder" labels in create mode (no reminderId)', () => {
    const { ReminderComposer } = require('@/modules/eventkit-lab/components/ReminderComposer');

    const { getByText } = render(
      <ReminderComposer lists={[writableList]} onSave={jest.fn()} inFlight={false} />,
    );

    expect(getByText('Save')).toBeTruthy();
    expect(getByText('New reminder')).toBeTruthy();
  });

  it('renders "Update" / "Edit reminder" labels in update mode (reminderId set)', () => {
    const { ReminderComposer } = require('@/modules/eventkit-lab/components/ReminderComposer');

    const { getByText } = render(
      <ReminderComposer
        lists={[writableList]}
        onSave={jest.fn()}
        inFlight={false}
        reminderId='rem-1'
      />,
    );

    expect(getByText('Update')).toBeTruthy();
    expect(getByText('Edit reminder')).toBeTruthy();
  });
});
