/**
 * EventKit Lab Screen tests — iOS variant.
 * Feature: 037-eventkit
 */

import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';

import type { UseCalendarEventsReturn } from '@/modules/eventkit-lab/hooks/useCalendarEvents';
import type { UseRemindersReturn } from '@/modules/eventkit-lab/hooks/useReminders';

let mockCalendarState: UseCalendarEventsReturn;
let mockRemindersState: UseRemindersReturn;

jest.mock('@/modules/eventkit-lab/hooks/useCalendarEvents', () => ({
  __esModule: true,
  useCalendarEvents: () => mockCalendarState,
}));

jest.mock('@/modules/eventkit-lab/hooks/useReminders', () => ({
  __esModule: true,
  useReminders: () => mockRemindersState,
}));

jest.mock('expo-calendar', () => ({}));

import Screen from '@/modules/eventkit-lab/screen';

function makeCalendarState(
  overrides: Partial<UseCalendarEventsReturn> = {},
): UseCalendarEventsReturn {
  return {
    status: 'notDetermined',
    calendars: [],
    events: [],
    range: 'today',
    inFlight: false,
    lastError: null,
    requestAccess: jest.fn().mockResolvedValue(undefined),
    refreshCalendars: jest.fn().mockResolvedValue(undefined),
    refreshEvents: jest.fn().mockResolvedValue(undefined),
    setRange: jest.fn(),
    createEvent: jest.fn().mockResolvedValue(undefined),
    updateEvent: jest.fn().mockResolvedValue(undefined),
    deleteEvent: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

function makeRemindersState(overrides: Partial<UseRemindersReturn> = {}): UseRemindersReturn {
  return {
    status: 'notDetermined',
    lists: [],
    reminders: [],
    filter: 'all',
    inFlight: false,
    lastError: null,
    requestAccess: jest.fn().mockResolvedValue(undefined),
    refreshLists: jest.fn().mockResolvedValue(undefined),
    refreshReminders: jest.fn().mockResolvedValue(undefined),
    setFilter: jest.fn(),
    createReminder: jest.fn().mockResolvedValue(undefined),
    updateReminder: jest.fn().mockResolvedValue(undefined),
    deleteReminder: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe('EventKit Lab Screen (iOS)', () => {
  beforeEach(() => {
    mockCalendarState = makeCalendarState();
    mockRemindersState = makeRemindersState();
  });

  it('renders both tabs with Calendar selected by default', () => {
    const { getByTestId } = render(<Screen />);

    expect(getByTestId('eventkit-tabbar')).toBeTruthy();
    expect(getByTestId('eventkit-tab-calendar')).toBeTruthy();
    expect(getByTestId('eventkit-tab-reminders')).toBeTruthy();
    // Calendar tab content is mounted by default.
    expect(getByTestId('eventkit-auth-calendar')).toBeTruthy();
  });

  it('Calendar tab renders Authorization, Calendars, and EventsQueryCard sections', () => {
    const { getByTestId, queryByTestId } = render(<Screen />);

    expect(getByTestId('eventkit-auth-calendar')).toBeTruthy();
    expect(getByTestId('eventkit-calendars')).toBeTruthy();
    expect(getByTestId('eventkit-events')).toBeTruthy();
    // Reminders sections should not be in the tree.
    expect(queryByTestId('eventkit-auth-reminder')).toBeNull();
    expect(queryByTestId('eventkit-reminder-lists')).toBeNull();
    expect(queryByTestId('eventkit-reminders')).toBeNull();
  });

  it('Reminders tab renders Authorization, RemindersList, and RemindersQueryCard sections', () => {
    const { getByTestId, queryByTestId } = render(<Screen />);

    fireEvent.press(getByTestId('eventkit-tab-reminders'));

    expect(getByTestId('eventkit-auth-reminder')).toBeTruthy();
    expect(getByTestId('eventkit-reminder-lists')).toBeTruthy();
    expect(getByTestId('eventkit-reminders')).toBeTruthy();
    // Calendar-specific sections should be unmounted.
    expect(queryByTestId('eventkit-auth-calendar')).toBeNull();
    expect(queryByTestId('eventkit-calendars')).toBeNull();
    expect(queryByTestId('eventkit-events')).toBeNull();
  });

  it('renders two independent AuthorizationCard instances across tabs', () => {
    mockCalendarState = makeCalendarState({ status: 'authorized' });
    mockRemindersState = makeRemindersState({ status: 'denied' });

    const { getByTestId } = render(<Screen />);

    // Calendar AuthorizationCard reflects calendar hook state.
    expect(getByTestId('eventkit-auth-calendar')).toBeTruthy();
    expect(getByTestId('eventkit-auth-calendar-status')).toBeTruthy();

    fireEvent.press(getByTestId('eventkit-tab-reminders'));

    // Reminders AuthorizationCard is a distinct instance reflecting the
    // reminders hook state — independent props confirm independence.
    expect(getByTestId('eventkit-auth-reminder')).toBeTruthy();
    expect(getByTestId('eventkit-auth-reminder-status')).toBeTruthy();
  });
});
