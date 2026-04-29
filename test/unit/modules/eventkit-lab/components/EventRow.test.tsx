/**
 * EventRow component tests.
 * Feature: 037-eventkit
 */

import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';
import { Alert } from 'react-native';

import type { EventSummary } from '@/modules/eventkit-lab/types';

describe('EventRow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const baseEvent: EventSummary = {
    id: 'evt-1',
    title: 'Team standup',
    location: 'Room A',
    startDate: new Date('2026-05-01T09:00:00Z'),
    endDate: new Date('2026-05-01T09:30:00Z'),
    allDay: false,
    calendarId: 'cal-1',
  };

  it('renders title, location, and dates', () => {
    const { EventRow } = require('@/modules/eventkit-lab/components/EventRow');

    const { getByText } = render(
      <EventRow event={baseEvent} onEdit={jest.fn()} onDelete={jest.fn()} />,
    );

    expect(getByText('Team standup')).toBeTruthy();
    expect(getByText(/Room A/)).toBeTruthy();
  });

  it('renders ALL-DAY badge when event.allDay is true', () => {
    const { EventRow } = require('@/modules/eventkit-lab/components/EventRow');
    const allDayEvent: EventSummary = { ...baseEvent, allDay: true };

    const { getByText } = render(
      <EventRow event={allDayEvent} onEdit={jest.fn()} onDelete={jest.fn()} />,
    );

    expect(getByText('ALL-DAY')).toBeTruthy();
  });

  it('does not render ALL-DAY badge when event.allDay is false', () => {
    const { EventRow } = require('@/modules/eventkit-lab/components/EventRow');

    const { queryByText } = render(
      <EventRow event={baseEvent} onEdit={jest.fn()} onDelete={jest.fn()} />,
    );

    expect(queryByText('ALL-DAY')).toBeNull();
  });

  it('calls onEdit with the event when tapped', () => {
    const { EventRow } = require('@/modules/eventkit-lab/components/EventRow');
    const onEdit = jest.fn();

    const { getByTestId } = render(
      <EventRow event={baseEvent} onEdit={onEdit} onDelete={jest.fn()} />,
    );

    fireEvent.press(getByTestId('eventkit-event-evt-1'));
    expect(onEdit).toHaveBeenCalledWith(baseEvent);
  });

  it('long-press → destructive confirm calls onDelete with event id', () => {
    const { EventRow } = require('@/modules/eventkit-lab/components/EventRow');
    const onDelete = jest.fn();

    jest.spyOn(Alert, 'alert').mockImplementation((_title, _msg, buttons) => {
      const destructive = buttons?.find((b) => b.style === 'destructive');
      destructive?.onPress?.();
    });

    const { getByTestId } = render(
      <EventRow event={baseEvent} onEdit={jest.fn()} onDelete={onDelete} />,
    );

    fireEvent(getByTestId('eventkit-event-evt-1'), 'longPress');
    expect(onDelete).toHaveBeenCalledWith('evt-1');
  });

  it('long-press → cancel does NOT call onDelete', () => {
    const { EventRow } = require('@/modules/eventkit-lab/components/EventRow');
    const onDelete = jest.fn();

    jest.spyOn(Alert, 'alert').mockImplementation((_title, _msg, buttons) => {
      const cancel = buttons?.find((b) => b.style === 'cancel');
      cancel?.onPress?.();
    });

    const { getByTestId } = render(
      <EventRow event={baseEvent} onEdit={jest.fn()} onDelete={onDelete} />,
    );

    fireEvent(getByTestId('eventkit-event-evt-1'), 'longPress');
    expect(onDelete).not.toHaveBeenCalled();
  });
});
