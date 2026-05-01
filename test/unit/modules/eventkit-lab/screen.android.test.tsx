/**
 * EventKit Lab Screen tests — Android variant.
 * Feature: 037-eventkit
 */

import { fireEvent, render } from '@testing-library/react-native';
import { Platform } from 'react-native';
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
    status: 'restricted',
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

describe('EventKit Lab Screen (Android)', () => {
  beforeAll(() => {
    Platform.OS = 'android';
  });

  beforeEach(() => {
    mockCalendarState = makeCalendarState();
    mockRemindersState = makeRemindersState();
  });

  it('Calendar tab is functional (sections rendered)', () => {
    const Screen = require('@/modules/eventkit-lab/screen.android').default;
    const { getByTestId } = render(<Screen />);

    expect(getByTestId('eventkit-auth-calendar')).toBeTruthy();
    expect(getByTestId('eventkit-calendars')).toBeTruthy();
    expect(getByTestId('eventkit-events')).toBeTruthy();
  });

  it('Reminders tab shows AndroidRemindersNotice', () => {
    const Screen = require('@/modules/eventkit-lab/screen.android').default;
    const { getByTestId } = render(<Screen />);

    fireEvent.press(getByTestId('eventkit-tab-reminders'));

    expect(getByTestId('eventkit-android-reminders-notice')).toBeTruthy();
  });

  it('does NOT render IOSOnlyBanner', () => {
    const Screen = require('@/modules/eventkit-lab/screen.android').default;
    const { queryByTestId } = render(<Screen />);

    expect(queryByTestId('eventkit-ios-only-banner')).toBeNull();

    fireEvent.press(queryByTestId('eventkit-tab-reminders')!);

    expect(queryByTestId('eventkit-ios-only-banner')).toBeNull();
  });
});
