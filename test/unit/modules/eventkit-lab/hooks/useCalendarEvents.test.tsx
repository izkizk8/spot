/**
 * useCalendarEvents hook tests.
 * Feature: 037-eventkit
 *
 * Tests hook invariants from contracts/hooks.md (H2–H8, C1–C5).
 * `expo-calendar` is mocked at the import boundary. Each method on the
 * mocked module delegates (via getter) to a corresponding `jest.fn()` on
 * the mutable `mockCalendar` holder so per-case `mockReset/mockResolvedValue`
 * works regardless of jest.mock factory hoisting.
 *
 * @see specs/037-eventkit/contracts/hooks.md
 */

import { act, renderHook, waitFor } from '@testing-library/react-native';
import { Platform } from 'react-native';

const mockCalendar: {
  getCalendarPermissionsAsync: jest.Mock;
  requestCalendarPermissionsAsync: jest.Mock;
  getCalendarsAsync: jest.Mock;
  getEventsAsync: jest.Mock;
  createEventAsync: jest.Mock;
  updateEventAsync: jest.Mock;
  deleteEventAsync: jest.Mock;
  EntityTypes: { EVENT: string };
} = {
  getCalendarPermissionsAsync: jest.fn(),
  requestCalendarPermissionsAsync: jest.fn(),
  getCalendarsAsync: jest.fn(),
  getEventsAsync: jest.fn(),
  createEventAsync: jest.fn(),
  updateEventAsync: jest.fn(),
  deleteEventAsync: jest.fn(),
  EntityTypes: { EVENT: 'event' },
};

jest.mock('expo-calendar', () => ({
  __esModule: true,
  get getCalendarPermissionsAsync() {
    return mockCalendar.getCalendarPermissionsAsync;
  },
  get requestCalendarPermissionsAsync() {
    return mockCalendar.requestCalendarPermissionsAsync;
  },
  get getCalendarsAsync() {
    return mockCalendar.getCalendarsAsync;
  },
  get getEventsAsync() {
    return mockCalendar.getEventsAsync;
  },
  get createEventAsync() {
    return mockCalendar.createEventAsync;
  },
  get updateEventAsync() {
    return mockCalendar.updateEventAsync;
  },
  get deleteEventAsync() {
    return mockCalendar.deleteEventAsync;
  },
  EntityTypes: { EVENT: 'event' },
}));

import { classifyEventKitError, useCalendarEvents } from '@/modules/eventkit-lab/hooks/useCalendarEvents';
import { toAlarmsArray } from '@/modules/eventkit-lab/alarm-offsets';

function resetMocks(): void {
  mockCalendar.getCalendarPermissionsAsync
    .mockReset()
    .mockResolvedValue({ status: 'undetermined', granted: false, canAskAgain: true });
  mockCalendar.requestCalendarPermissionsAsync
    .mockReset()
    .mockResolvedValue({ status: 'undetermined', granted: false, canAskAgain: true });
  mockCalendar.getCalendarsAsync.mockReset().mockResolvedValue([]);
  mockCalendar.getEventsAsync.mockReset().mockResolvedValue([]);
  mockCalendar.createEventAsync.mockReset().mockResolvedValue('event-1');
  mockCalendar.updateEventAsync.mockReset().mockResolvedValue(undefined);
  mockCalendar.deleteEventAsync.mockReset().mockResolvedValue(undefined);
}

const PlatformMutable = Platform as unknown as { OS: string };
const ORIGINAL_OS = PlatformMutable.OS;

describe('useCalendarEvents hook', () => {
  beforeEach(() => {
    resetMocks();
    PlatformMutable.OS = 'ios';
  });

  afterEach(() => {
    PlatformMutable.OS = ORIGINAL_OS;
  });

  // ─── H2: default state ────────────────────────────────────────────
  it('H2: default state on mount', () => {
    const { result } = renderHook(() => useCalendarEvents());
    expect(result.current.status).toBe('notDetermined');
    expect(result.current.calendars).toEqual([]);
    expect(result.current.events).toEqual([]);
    expect(result.current.range).toBe('today');
    expect(result.current.inFlight).toBe(false);
    expect(result.current.lastError).toBeNull();
  });

  // ─── H3: mount checks permissions exactly once ───────────────────
  it('H3: mount calls getCalendarPermissionsAsync exactly once', async () => {
    renderHook(() => useCalendarEvents());

    await waitFor(() => {
      expect(mockCalendar.getCalendarPermissionsAsync).toHaveBeenCalledTimes(1);
    });
  });

  // ─── H4: unmount-safe dispatch ───────────────────────────────────
  it('H4: unmount during in-flight createEvent does not log post-unmount setState warnings', async () => {
    mockCalendar.getCalendarPermissionsAsync.mockResolvedValue({
      status: 'granted',
      granted: true,
      canAskAgain: true,
    });
    mockCalendar.getCalendarsAsync.mockResolvedValue([
      { id: 'cal-1', title: 'Cal', type: 'local', color: '#fff', allowsModifications: true },
    ]);

    let resolveCreate: ((id: string) => void) | null = null;
    mockCalendar.createEventAsync.mockImplementation(
      () =>
        new Promise<string>((resolve) => {
          resolveCreate = resolve;
        }),
    );

    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const { result, unmount } = renderHook(() => useCalendarEvents());

    await waitFor(() => {
      expect(result.current.status).toBe('authorized');
    });

    act(() => {
      void result.current.createEvent({
        title: 'T',
        startDate: new Date('2025-01-01T10:00:00Z'),
        endDate: new Date('2025-01-01T11:00:00Z'),
        allDay: false,
        calendarId: 'cal-1',
      });
    });

    unmount();

    await act(async () => {
      resolveCreate?.('event-2');
      await Promise.resolve();
    });

    const warnings = errorSpy.mock.calls
      .map((args) => String(args[0] ?? ''))
      .filter((s) => /unmounted|memory leak|act\(\.\.\.\)/i.test(s));
    expect(warnings).toEqual([]);
    errorSpy.mockRestore();
  });

  // ─── H6: error classification ────────────────────────────────────
  describe('H6: classifyEventKitError', () => {
    it.each([
      ['Permission denied by user', 'denied'],
      ['Access denied', 'denied'],
      ['Restricted by parental controls', 'restricted'],
      ['MDM restricted', 'restricted'],
      ['Calendar is write-only', 'write-only'],
      ['write only mode', 'write-only'],
      ['Event not found', 'not-found'],
      ['No such event id', 'not-found'],
      ['Calendar does not exist', 'not-found'],
      ['Invalid input parameter', 'invalid-input'],
      ['Missing required field', 'invalid-input'],
      ['required field missing', 'invalid-input'],
      ['Something blew up', 'failed'],
    ])('classifies "%s" as %s', (msg, kind) => {
      expect(classifyEventKitError(new Error(msg)).kind).toBe(kind);
    });

    it('truncates messages longer than 120 characters', () => {
      const long = 'x'.repeat(200);
      const result = classifyEventKitError(new Error(long));
      expect(result.message.length).toBe(120);
    });

    it('handles non-Error throwables via String coercion', () => {
      const result = classifyEventKitError('plain string failure');
      expect(result.kind).toBe('failed');
      expect(result.message).toBe('plain string failure');
    });
  });

  // ─── H7: web short-circuit ───────────────────────────────────────
  describe('H7: web short-circuit', () => {
    beforeEach(() => {
      PlatformMutable.OS = 'web';
    });

    it('sets status to restricted on mount and never calls expo-calendar', async () => {
      const { result } = renderHook(() => useCalendarEvents());

      await waitFor(() => {
        expect(result.current.status).toBe('restricted');
      });
      expect(result.current.lastError).toMatchObject({ kind: 'restricted' });
      expect(mockCalendar.getCalendarPermissionsAsync).not.toHaveBeenCalled();
    });

    it('requestAccess sets a restricted error and does not call expo-calendar', async () => {
      const { result } = renderHook(() => useCalendarEvents());

      await waitFor(() => {
        expect(result.current.status).toBe('restricted');
      });

      await act(async () => {
        await result.current.requestAccess();
      });

      expect(mockCalendar.requestCalendarPermissionsAsync).not.toHaveBeenCalled();
      expect(result.current.lastError).toMatchObject({ kind: 'restricted' });
    });

    it('createEvent on web sets restricted error without calling expo-calendar', async () => {
      const { result } = renderHook(() => useCalendarEvents());

      await waitFor(() => {
        expect(result.current.status).toBe('restricted');
      });

      await act(async () => {
        await result.current.createEvent({
          title: 'T',
          startDate: new Date(),
          endDate: new Date(),
          allDay: false,
          calendarId: 'x',
        });
      });

      expect(mockCalendar.createEventAsync).not.toHaveBeenCalled();
      expect(result.current.lastError).toMatchObject({ kind: 'restricted' });
    });
  });

  // ─── H8: lastError does NOT clear data ───────────────────────────
  it('H8: setting lastError preserves existing calendars and events', async () => {
    mockCalendar.getCalendarPermissionsAsync.mockResolvedValue({
      status: 'granted',
      granted: true,
      canAskAgain: true,
    });
    mockCalendar.getCalendarsAsync.mockResolvedValue([
      { id: 'cal-1', title: 'Cal', type: 'local', color: '#fff', allowsModifications: true },
    ]);
    mockCalendar.getEventsAsync.mockResolvedValue([
      {
        id: 'e1',
        title: 'Standup',
        startDate: '2025-01-01T10:00:00Z',
        endDate: '2025-01-01T10:30:00Z',
        allDay: false,
        calendarId: 'cal-1',
      },
    ]);

    const { result } = renderHook(() => useCalendarEvents());

    await waitFor(() => {
      expect(result.current.calendars).toHaveLength(1);
      expect(result.current.events).toHaveLength(1);
    });

    mockCalendar.deleteEventAsync.mockRejectedValueOnce(new Error('Event not found'));

    await act(async () => {
      await result.current.deleteEvent('does-not-exist');
    });

    await waitFor(() => {
      expect(result.current.lastError).toMatchObject({ kind: 'not-found' });
    });
    expect(result.current.calendars).toHaveLength(1);
    expect(result.current.events).toHaveLength(1);
  });

  // ─── C1: writeOnly mapping ───────────────────────────────────────
  // The current mapPermissionStatus only emits 'authorized' | 'denied' |
  // 'notDetermined' | 'restricted'. A dedicated writeOnly mapping is not
  // yet implemented in the source — see contracts/hooks.md C1.
  it.todo('C1: writeOnly status when permission response signals write-only access');

  // ─── C2: range default + setRange refresh ────────────────────────
  it('C2: range defaults to "today" and setRange("next7") triggers refreshEvents', async () => {
    mockCalendar.getCalendarPermissionsAsync.mockResolvedValue({
      status: 'granted',
      granted: true,
      canAskAgain: true,
    });
    mockCalendar.getCalendarsAsync.mockResolvedValue([
      { id: 'cal-1', title: 'Cal', type: 'local', color: '#fff', allowsModifications: true },
    ]);

    const { result } = renderHook(() => useCalendarEvents());

    await waitFor(() => {
      expect(result.current.status).toBe('authorized');
    });
    expect(result.current.range).toBe('today');

    const callsBefore = mockCalendar.getEventsAsync.mock.calls.length;

    act(() => {
      result.current.setRange('next7');
    });

    await waitFor(() => {
      expect(result.current.range).toBe('next7');
      expect(mockCalendar.getEventsAsync.mock.calls.length).toBeGreaterThan(callsBefore);
    });
  });

  // ─── C3: writeOnly gating ────────────────────────────────────────
  // writeOnly state is currently unreachable through mapPermissionStatus.
  it.todo('C3: writeOnly — refresh short-circuits; createEvent allowed; updateEvent/deleteEvent reject');

  // ─── C4: alarm offset translation ────────────────────────────────
  it('C4: createEvent translates alarmOffset via toAlarmsArray', async () => {
    mockCalendar.getCalendarPermissionsAsync.mockResolvedValue({
      status: 'granted',
      granted: true,
      canAskAgain: true,
    });
    mockCalendar.getCalendarsAsync.mockResolvedValue([
      { id: 'cal-1', title: 'Cal', type: 'local', color: '#fff', allowsModifications: true },
    ]);

    const { result } = renderHook(() => useCalendarEvents());

    await waitFor(() => {
      expect(result.current.status).toBe('authorized');
    });

    await act(async () => {
      await result.current.createEvent({
        title: 'T',
        startDate: new Date('2025-01-01T10:00:00Z'),
        endDate: new Date('2025-01-01T11:00:00Z'),
        allDay: false,
        calendarId: 'cal-1',
        alarmOffset: '15min',
      });
    });

    expect(mockCalendar.createEventAsync).toHaveBeenCalledWith(
      'cal-1',
      expect.objectContaining({ alarms: toAlarmsArray('15min') }),
    );
  });

  it('C4: createEvent omits alarms when alarmOffset is undefined', async () => {
    mockCalendar.getCalendarPermissionsAsync.mockResolvedValue({
      status: 'granted',
      granted: true,
      canAskAgain: true,
    });
    mockCalendar.getCalendarsAsync.mockResolvedValue([
      { id: 'cal-1', title: 'Cal', type: 'local', color: '#fff', allowsModifications: true },
    ]);

    const { result } = renderHook(() => useCalendarEvents());

    await waitFor(() => {
      expect(result.current.status).toBe('authorized');
    });

    await act(async () => {
      await result.current.createEvent({
        title: 'T',
        startDate: new Date('2025-01-01T10:00:00Z'),
        endDate: new Date('2025-01-01T11:00:00Z'),
        allDay: false,
        calendarId: 'cal-1',
      });
    });

    const [, details] = mockCalendar.createEventAsync.mock.calls[0] as [string, Record<string, unknown>];
    expect(details).not.toHaveProperty('alarms');
  });

  // ─── C5: allDay normalisation ────────────────────────────────────
  it('C5: createEvent with allDay normalises start to 00:00 and end to 23:59:59.999', async () => {
    mockCalendar.getCalendarPermissionsAsync.mockResolvedValue({
      status: 'granted',
      granted: true,
      canAskAgain: true,
    });
    mockCalendar.getCalendarsAsync.mockResolvedValue([
      { id: 'cal-1', title: 'Cal', type: 'local', color: '#fff', allowsModifications: true },
    ]);

    const { result } = renderHook(() => useCalendarEvents());

    await waitFor(() => {
      expect(result.current.status).toBe('authorized');
    });

    await act(async () => {
      await result.current.createEvent({
        title: 'All-day',
        startDate: new Date(2025, 0, 15, 14, 30, 0),
        endDate: new Date(2025, 0, 15, 16, 45, 0),
        allDay: true,
        calendarId: 'cal-1',
      });
    });

    const [, details] = mockCalendar.createEventAsync.mock.calls[0] as [
      string,
      { startDate: Date; endDate: Date; allDay: boolean },
    ];
    expect(details.allDay).toBe(true);
    expect(details.startDate.getHours()).toBe(0);
    expect(details.startDate.getMinutes()).toBe(0);
    expect(details.startDate.getSeconds()).toBe(0);
    expect(details.startDate.getMilliseconds()).toBe(0);
    expect(details.endDate.getHours()).toBe(23);
    expect(details.endDate.getMinutes()).toBe(59);
    expect(details.endDate.getSeconds()).toBe(59);
    expect(details.endDate.getMilliseconds()).toBe(999);
  });

  // ─── CRUD success / error ────────────────────────────────────────
  describe('CRUD: createEvent', () => {
    beforeEach(() => {
      mockCalendar.getCalendarPermissionsAsync.mockResolvedValue({
        status: 'granted',
        granted: true,
        canAskAgain: true,
      });
      mockCalendar.getCalendarsAsync.mockResolvedValue([
        { id: 'cal-1', title: 'Cal', type: 'local', color: '#fff', allowsModifications: true },
      ]);
    });

    it('success: clears lastError and calls createEventAsync', async () => {
      mockCalendar.createEventAsync.mockResolvedValue('new-id');
      const { result } = renderHook(() => useCalendarEvents());

      await waitFor(() => {
        expect(result.current.status).toBe('authorized');
      });

      await act(async () => {
        await result.current.createEvent({
          title: 'T',
          startDate: new Date('2025-01-01T10:00:00Z'),
          endDate: new Date('2025-01-01T11:00:00Z'),
          allDay: false,
          calendarId: 'cal-1',
        });
      });

      expect(mockCalendar.createEventAsync).toHaveBeenCalledTimes(1);
      expect(result.current.lastError).toBeNull();
      expect(result.current.inFlight).toBe(false);
    });

    it('error: sets classified lastError', async () => {
      mockCalendar.createEventAsync.mockRejectedValue(new Error('Invalid required field'));
      const { result } = renderHook(() => useCalendarEvents());

      await waitFor(() => {
        expect(result.current.status).toBe('authorized');
      });

      await act(async () => {
        await result.current.createEvent({
          title: '',
          startDate: new Date(),
          endDate: new Date(),
          allDay: false,
          calendarId: 'cal-1',
        });
      });

      await waitFor(() => {
        expect(result.current.lastError).toMatchObject({ kind: 'invalid-input' });
        expect(result.current.inFlight).toBe(false);
      });
    });
  });

  describe('CRUD: updateEvent', () => {
    beforeEach(() => {
      mockCalendar.getCalendarPermissionsAsync.mockResolvedValue({
        status: 'granted',
        granted: true,
        canAskAgain: true,
      });
      mockCalendar.getCalendarsAsync.mockResolvedValue([
        { id: 'cal-1', title: 'Cal', type: 'local', color: '#fff', allowsModifications: true },
      ]);
    });

    it('success: calls updateEventAsync with eventId and details', async () => {
      const { result } = renderHook(() => useCalendarEvents());

      await waitFor(() => {
        expect(result.current.status).toBe('authorized');
      });

      await act(async () => {
        await result.current.updateEvent('e-1', {
          title: 'Renamed',
          startDate: new Date('2025-01-01T10:00:00Z'),
          endDate: new Date('2025-01-01T11:00:00Z'),
          allDay: false,
          calendarId: 'cal-1',
        });
      });

      expect(mockCalendar.updateEventAsync).toHaveBeenCalledWith(
        'e-1',
        expect.objectContaining({ title: 'Renamed' }),
      );
      expect(result.current.lastError).toBeNull();
    });

    it('error: sets not-found lastError when bridge rejects', async () => {
      mockCalendar.updateEventAsync.mockRejectedValue(new Error('Event not found'));
      const { result } = renderHook(() => useCalendarEvents());

      await waitFor(() => {
        expect(result.current.status).toBe('authorized');
      });

      await act(async () => {
        await result.current.updateEvent('missing', {
          title: 'X',
          startDate: new Date(),
          endDate: new Date(),
          allDay: false,
          calendarId: 'cal-1',
        });
      });

      await waitFor(() => {
        expect(result.current.lastError).toMatchObject({ kind: 'not-found' });
      });
    });
  });

  describe('CRUD: deleteEvent', () => {
    beforeEach(() => {
      mockCalendar.getCalendarPermissionsAsync.mockResolvedValue({
        status: 'granted',
        granted: true,
        canAskAgain: true,
      });
      mockCalendar.getCalendarsAsync.mockResolvedValue([
        { id: 'cal-1', title: 'Cal', type: 'local', color: '#fff', allowsModifications: true },
      ]);
    });

    it('success: calls deleteEventAsync and clears lastError', async () => {
      const { result } = renderHook(() => useCalendarEvents());

      await waitFor(() => {
        expect(result.current.status).toBe('authorized');
      });

      await act(async () => {
        await result.current.deleteEvent('e-1');
      });

      expect(mockCalendar.deleteEventAsync).toHaveBeenCalledWith('e-1');
      expect(result.current.lastError).toBeNull();
    });

    it('error: sets denied lastError when bridge rejects with permission error', async () => {
      mockCalendar.deleteEventAsync.mockRejectedValue(new Error('Permission denied'));
      const { result } = renderHook(() => useCalendarEvents());

      await waitFor(() => {
        expect(result.current.status).toBe('authorized');
      });

      await act(async () => {
        await result.current.deleteEvent('e-1');
      });

      await waitFor(() => {
        expect(result.current.lastError).toMatchObject({ kind: 'denied' });
      });
    });
  });
});
