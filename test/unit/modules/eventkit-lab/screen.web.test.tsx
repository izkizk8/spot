/**
 * EventKit Lab Screen tests — Web variant.
 * Feature: 037-eventkit
 */

import { fireEvent, render } from '@testing-library/react-native';
import { Platform } from 'react-native';
import React from 'react';
import * as fs from 'node:fs';
import * as path from 'node:path';

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
    status: 'restricted',
    calendars: [],
    events: [],
    range: 'next-7-days',
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

describe('EventKit Lab Screen (Web)', () => {
  beforeAll(() => {
    Platform.OS = 'web';
  });

  beforeEach(() => {
    mockCalendarState = makeCalendarState();
    mockRemindersState = makeRemindersState();
  });

  it('renders IOSOnlyBanner', () => {
    const Screen = require('@/modules/eventkit-lab/screen.web').default;
    const { getByTestId } = render(<Screen />);

    expect(getByTestId('eventkit-ios-only-banner')).toBeTruthy();
  });

  it('renders inert/disabled controls — pressing tabs does not invoke hook actions', () => {
    const Screen = require('@/modules/eventkit-lab/screen.web').default;
    const { getByTestId } = render(<Screen />);

    // Calendar tab content rendered with empty/disabled controls.
    expect(getByTestId('eventkit-auth-calendar')).toBeTruthy();
    expect(getByTestId('eventkit-calendars')).toBeTruthy();
    expect(getByTestId('eventkit-events')).toBeTruthy();

    // Pressing the refresh control on web is a no-op — no hook action fires.
    fireEvent.press(getByTestId('eventkit-calendars-refresh'));
    fireEvent.press(getByTestId('eventkit-events-refresh'));

    expect(mockCalendarState.refreshCalendars).not.toHaveBeenCalled();
    expect(mockCalendarState.refreshEvents).not.toHaveBeenCalled();
    expect(mockCalendarState.requestAccess).not.toHaveBeenCalled();

    fireEvent.press(getByTestId('eventkit-tab-reminders'));

    expect(getByTestId('eventkit-auth-reminder')).toBeTruthy();
    fireEvent.press(getByTestId('eventkit-reminder-lists-refresh'));
    fireEvent.press(getByTestId('eventkit-reminders-refresh'));

    expect(mockRemindersState.refreshLists).not.toHaveBeenCalled();
    expect(mockRemindersState.refreshReminders).not.toHaveBeenCalled();
    expect(mockRemindersState.requestAccess).not.toHaveBeenCalled();
  });

  it('does NOT statically import expo-calendar', () => {
    const source = fs.readFileSync(
      path.join(__dirname, '..', '..', '..', '..', 'src', 'modules', 'eventkit-lab', 'screen.web.tsx'),
      'utf8',
    );

    expect(source).not.toMatch(/from\s+['"]expo-calendar['"]/);
    expect(source).not.toMatch(/require\(\s*['"]expo-calendar['"]\s*\)/);
  });
});
