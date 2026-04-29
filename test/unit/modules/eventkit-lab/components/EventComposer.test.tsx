/**
 * EventComposer component tests.
 * Feature: 037-eventkit
 */

import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';

import type { CalendarSummary } from '@/modules/eventkit-lab/types';

describe('EventComposer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const writableCal: CalendarSummary = {
    id: 'cal-1',
    title: 'Personal',
    type: 'local',
    color: '#FF0000',
    allowsModifications: true,
  };

  const readonlyCal: CalendarSummary = {
    id: 'cal-2',
    title: 'Holidays',
    type: 'subscribed',
    color: '#888888',
    allowsModifications: false,
  };

  it('disables Save button when title is empty', () => {
    const { EventComposer } = require('@/modules/eventkit-lab/components/EventComposer');
    const onSave = jest.fn();

    const { getByTestId } = render(
      <EventComposer calendars={[writableCal]} onSave={onSave} inFlight={false} />,
    );

    const save = getByTestId('eventkit-event-save');
    expect(save.props.accessibilityState?.disabled ?? save.props.disabled).toBe(true);

    fireEvent.press(save);
    expect(onSave).not.toHaveBeenCalled();
  });

  it('enables Save button and calls onSave with trimmed title once title is set', () => {
    const { EventComposer } = require('@/modules/eventkit-lab/components/EventComposer');
    const onSave = jest.fn();

    const { getByTestId } = render(
      <EventComposer calendars={[writableCal]} onSave={onSave} inFlight={false} />,
    );

    fireEvent.changeText(getByTestId('eventkit-event-title'), '  Lunch  ');
    fireEvent.press(getByTestId('eventkit-event-save'));

    expect(onSave).toHaveBeenCalledTimes(1);
    const draft = onSave.mock.calls[0][0];
    expect(draft.title).toBe('Lunch');
    expect(draft.calendarId).toBe('cal-1');
  });

  it('hides read-only calendars from the picker (read-only gating)', () => {
    const { EventComposer } = require('@/modules/eventkit-lab/components/EventComposer');

    const { queryByTestId, getByTestId } = render(
      <EventComposer
        calendars={[writableCal, readonlyCal]}
        onSave={jest.fn()}
        inFlight={false}
      />,
    );

    expect(getByTestId('eventkit-event-cal-cal-1')).toBeTruthy();
    expect(queryByTestId('eventkit-event-cal-cal-2')).toBeNull();
  });

  it('shows fallback message and disables Save when no writable calendars exist', () => {
    const { EventComposer } = require('@/modules/eventkit-lab/components/EventComposer');
    const onSave = jest.fn();

    const { getByText, getByTestId } = render(
      <EventComposer calendars={[readonlyCal]} onSave={onSave} inFlight={false} />,
    );

    expect(getByText('No writable calendars available')).toBeTruthy();
    fireEvent.changeText(getByTestId('eventkit-event-title'), 'Something');

    const save = getByTestId('eventkit-event-save');
    expect(save.props.accessibilityState?.disabled ?? save.props.disabled).toBe(true);
    fireEvent.press(save);
    expect(onSave).not.toHaveBeenCalled();
  });

  it('wires alarm offset selection into the saved draft', () => {
    const { EventComposer } = require('@/modules/eventkit-lab/components/EventComposer');
    const onSave = jest.fn();

    const { getByTestId } = render(
      <EventComposer calendars={[writableCal]} onSave={onSave} inFlight={false} />,
    );

    fireEvent.changeText(getByTestId('eventkit-event-title'), 'Sync');
    fireEvent.press(getByTestId('eventkit-event-alarm-15min'));
    fireEvent.press(getByTestId('eventkit-event-save'));

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave.mock.calls[0][0].alarmOffset).toBe('15min');
  });

  it('omits alarmOffset when "none" is selected (default)', () => {
    const { EventComposer } = require('@/modules/eventkit-lab/components/EventComposer');
    const onSave = jest.fn();

    const { getByTestId } = render(
      <EventComposer calendars={[writableCal]} onSave={onSave} inFlight={false} />,
    );

    fireEvent.changeText(getByTestId('eventkit-event-title'), 'Sync');
    fireEvent.press(getByTestId('eventkit-event-save'));

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave.mock.calls[0][0].alarmOffset).toBeUndefined();
  });

  it('renders "Save" label in create mode (no eventId)', () => {
    const { EventComposer } = require('@/modules/eventkit-lab/components/EventComposer');

    const { getByText } = render(
      <EventComposer calendars={[writableCal]} onSave={jest.fn()} inFlight={false} />,
    );

    expect(getByText('Save')).toBeTruthy();
    expect(getByText('New event')).toBeTruthy();
  });

  it('renders "Update" label in update mode (eventId set)', () => {
    const { EventComposer } = require('@/modules/eventkit-lab/components/EventComposer');

    const { getByText } = render(
      <EventComposer
        calendars={[writableCal]}
        onSave={jest.fn()}
        inFlight={false}
        eventId="evt-1"
      />,
    );

    expect(getByText('Update')).toBeTruthy();
    expect(getByText('Edit event')).toBeTruthy();
  });

  it('short-circuits double-taps when inFlight=true', () => {
    const { EventComposer } = require('@/modules/eventkit-lab/components/EventComposer');
    const onSave = jest.fn();

    const { getByTestId } = render(
      <EventComposer calendars={[writableCal]} onSave={onSave} inFlight={true} />,
    );

    fireEvent.changeText(getByTestId('eventkit-event-title'), 'Sync');
    const save = getByTestId('eventkit-event-save');
    fireEvent.press(save);
    fireEvent.press(save);

    expect(save.props.accessibilityState?.disabled ?? save.props.disabled).toBe(true);
    expect(onSave).not.toHaveBeenCalled();
  });
});
