/**
 * useReminders hook tests.
 * Feature: 037-eventkit
 *
 * Tests hook invariants from contracts/hooks.md (H2–H8, R1–R5).
 * `expo-calendar` is mocked at the import boundary using a mutable holder
 * + getter forwarding pattern so per-case mockReset/mockResolvedValue works
 * regardless of jest.mock factory hoisting.
 *
 * @see specs/037-eventkit/contracts/hooks.md
 */

import { act, renderHook, waitFor } from '@testing-library/react-native';
import { Platform } from 'react-native';

const mockCalendar: {
  getRemindersPermissionsAsync: jest.Mock;
  requestRemindersPermissionsAsync: jest.Mock;
  getCalendarsAsync: jest.Mock;
  getRemindersAsync: jest.Mock;
  createReminderAsync: jest.Mock;
  updateReminderAsync: jest.Mock;
  deleteReminderAsync: jest.Mock;
  EntityTypes: { REMINDER: string };
  ReminderStatus: { COMPLETED: string; INCOMPLETE: string };
} = {
  getRemindersPermissionsAsync: jest.fn(),
  requestRemindersPermissionsAsync: jest.fn(),
  getCalendarsAsync: jest.fn(),
  getRemindersAsync: jest.fn(),
  createReminderAsync: jest.fn(),
  updateReminderAsync: jest.fn(),
  deleteReminderAsync: jest.fn(),
  EntityTypes: { REMINDER: 'reminder' },
  ReminderStatus: { COMPLETED: 'completed', INCOMPLETE: 'incomplete' },
};

jest.mock('expo-calendar', () => ({
  __esModule: true,
  get getRemindersPermissionsAsync() {
    return mockCalendar.getRemindersPermissionsAsync;
  },
  get requestRemindersPermissionsAsync() {
    return mockCalendar.requestRemindersPermissionsAsync;
  },
  get getCalendarsAsync() {
    return mockCalendar.getCalendarsAsync;
  },
  get getRemindersAsync() {
    return mockCalendar.getRemindersAsync;
  },
  get createReminderAsync() {
    return mockCalendar.createReminderAsync;
  },
  get updateReminderAsync() {
    return mockCalendar.updateReminderAsync;
  },
  get deleteReminderAsync() {
    return mockCalendar.deleteReminderAsync;
  },
  EntityTypes: { REMINDER: 'reminder' },
  ReminderStatus: { COMPLETED: 'completed', INCOMPLETE: 'incomplete' },
}));

import { useReminders } from '@/modules/eventkit-lab/hooks/useReminders';

function resetMocks(): void {
  mockCalendar.getRemindersPermissionsAsync
    .mockReset()
    .mockResolvedValue({ status: 'undetermined', granted: false, canAskAgain: true });
  mockCalendar.requestRemindersPermissionsAsync
    .mockReset()
    .mockResolvedValue({ status: 'undetermined', granted: false, canAskAgain: true });
  mockCalendar.getCalendarsAsync.mockReset().mockResolvedValue([]);
  mockCalendar.getRemindersAsync.mockReset().mockResolvedValue([]);
  mockCalendar.createReminderAsync.mockReset().mockResolvedValue('reminder-1');
  mockCalendar.updateReminderAsync.mockReset().mockResolvedValue(undefined);
  mockCalendar.deleteReminderAsync.mockReset().mockResolvedValue(undefined);
}

const PlatformMutable = Platform as unknown as { OS: string };
const ORIGINAL_OS = PlatformMutable.OS;

describe('useReminders hook', () => {
  beforeEach(() => {
    resetMocks();
    PlatformMutable.OS = 'ios';
  });

  afterEach(() => {
    PlatformMutable.OS = ORIGINAL_OS;
  });

  // ─── H2: default state ───────────────────────────────────────────
  it('H2: default state on mount', () => {
    const { result } = renderHook(() => useReminders());
    expect(result.current.status).toBe('notDetermined');
    expect(result.current.lists).toEqual([]);
    expect(result.current.reminders).toEqual([]);
    expect(result.current.filter).toBe('incomplete');
    expect(result.current.inFlight).toBe(false);
    expect(result.current.lastError).toBeNull();
  });

  // ─── H3: mount checks permissions exactly once ───────────────────
  it('H3: mount calls getRemindersPermissionsAsync exactly once', async () => {
    renderHook(() => useReminders());

    await waitFor(() => {
      expect(mockCalendar.getRemindersPermissionsAsync).toHaveBeenCalledTimes(1);
    });
  });

  // ─── R1: granted permission loads lists (fullAccess-equivalent path) ──
  it('R1: granted permission maps to authorized and loads reminder lists', async () => {
    mockCalendar.getRemindersPermissionsAsync.mockResolvedValue({
      status: 'granted',
      granted: true,
      canAskAgain: true,
    });
    mockCalendar.getCalendarsAsync.mockResolvedValue([
      {
        id: 'list-1',
        title: 'My Reminders',
        type: 'local',
        color: '#fff',
        allowsModifications: true,
      },
    ]);

    const { result } = renderHook(() => useReminders());

    await waitFor(() => {
      expect(result.current.status).toBe('authorized');
      expect(result.current.lists).toHaveLength(1);
    });
    expect(mockCalendar.getCalendarsAsync).toHaveBeenCalledWith('reminder');
  });

  // ─── R2: filter default + setFilter triggers refresh ─────────────
  it('R2: filter defaults to "incomplete" and setFilter triggers refreshReminders', async () => {
    mockCalendar.getRemindersPermissionsAsync.mockResolvedValue({
      status: 'granted',
      granted: true,
      canAskAgain: true,
    });
    mockCalendar.getCalendarsAsync.mockResolvedValue([
      {
        id: 'list-1',
        title: 'My Reminders',
        type: 'local',
        color: '#fff',
        allowsModifications: true,
      },
    ]);

    const { result } = renderHook(() => useReminders());

    await waitFor(() => {
      expect(result.current.status).toBe('authorized');
      expect(result.current.lists).toHaveLength(1);
    });
    expect(result.current.filter).toBe('incomplete');

    const callsBefore = mockCalendar.getRemindersAsync.mock.calls.length;

    act(() => {
      result.current.setFilter('completed');
    });

    await waitFor(() => {
      expect(result.current.filter).toBe('completed');
      expect(mockCalendar.getRemindersAsync.mock.calls.length).toBeGreaterThan(callsBefore);
    });
  });

  // ─── R4: createReminder with dueDate undefined ───────────────────
  it('R4: createReminder omits dueDate when undefined', async () => {
    mockCalendar.getRemindersPermissionsAsync.mockResolvedValue({
      status: 'granted',
      granted: true,
      canAskAgain: true,
    });
    mockCalendar.getCalendarsAsync.mockResolvedValue([
      {
        id: 'list-1',
        title: 'My Reminders',
        type: 'local',
        color: '#fff',
        allowsModifications: true,
      },
    ]);

    const { result } = renderHook(() => useReminders());

    await waitFor(() => {
      expect(result.current.status).toBe('authorized');
    });

    await act(async () => {
      await result.current.createReminder({
        title: 'No due date',
        listId: 'list-1',
        priority: 'none',
      });
    });

    const [, details] = mockCalendar.createReminderAsync.mock.calls[0] as [
      string,
      Record<string, unknown>,
    ];
    expect(details).not.toHaveProperty('dueDate');
    expect(details).not.toHaveProperty('priority');
    expect(details.title).toBe('No due date');
  });

  it('R4: createReminder includes dueDate when provided', async () => {
    mockCalendar.getRemindersPermissionsAsync.mockResolvedValue({
      status: 'granted',
      granted: true,
      canAskAgain: true,
    });
    mockCalendar.getCalendarsAsync.mockResolvedValue([
      {
        id: 'list-1',
        title: 'My Reminders',
        type: 'local',
        color: '#fff',
        allowsModifications: true,
      },
    ]);

    const due = new Date('2025-06-01T09:00:00Z');
    const { result } = renderHook(() => useReminders());

    await waitFor(() => {
      expect(result.current.status).toBe('authorized');
    });

    await act(async () => {
      await result.current.createReminder({
        title: 'Pay rent',
        listId: 'list-1',
        priority: 'high',
        dueDate: due,
      });
    });

    expect(mockCalendar.createReminderAsync).toHaveBeenCalledWith(
      'list-1',
      expect.objectContaining({ dueDate: due, priority: 1 }),
    );
  });

  // ─── H7: web short-circuit ───────────────────────────────────────
  describe('H7: web short-circuit', () => {
    beforeEach(() => {
      PlatformMutable.OS = 'web';
    });

    it('sets status to restricted and skips expo-calendar on mount', async () => {
      const { result } = renderHook(() => useReminders());

      await waitFor(() => {
        expect(result.current.status).toBe('restricted');
      });
      expect(result.current.lastError).toMatchObject({ kind: 'restricted' });
      expect(mockCalendar.getRemindersPermissionsAsync).not.toHaveBeenCalled();
    });

    it('createReminder on web sets restricted error without calling expo-calendar', async () => {
      const { result } = renderHook(() => useReminders());

      await waitFor(() => {
        expect(result.current.status).toBe('restricted');
      });

      await act(async () => {
        await result.current.createReminder({
          title: 'X',
          listId: 'list-1',
          priority: 'none',
        });
      });

      expect(mockCalendar.createReminderAsync).not.toHaveBeenCalled();
      expect(result.current.lastError).toMatchObject({ kind: 'restricted' });
    });

    it('requestAccess on web sets restricted error', async () => {
      const { result } = renderHook(() => useReminders());

      await waitFor(() => {
        expect(result.current.status).toBe('restricted');
      });

      await act(async () => {
        await result.current.requestAccess();
      });

      expect(mockCalendar.requestRemindersPermissionsAsync).not.toHaveBeenCalled();
    });
  });

  // ─── CRUD: createReminder ────────────────────────────────────────
  describe('CRUD: createReminder', () => {
    beforeEach(() => {
      mockCalendar.getRemindersPermissionsAsync.mockResolvedValue({
        status: 'granted',
        granted: true,
        canAskAgain: true,
      });
      mockCalendar.getCalendarsAsync.mockResolvedValue([
        {
          id: 'list-1',
          title: 'My Reminders',
          type: 'local',
          color: '#fff',
          allowsModifications: true,
        },
      ]);
    });

    it('success: clears lastError and calls createReminderAsync', async () => {
      const { result } = renderHook(() => useReminders());

      await waitFor(() => {
        expect(result.current.status).toBe('authorized');
      });

      await act(async () => {
        await result.current.createReminder({
          title: 'Buy milk',
          listId: 'list-1',
          priority: 'medium',
        });
      });

      expect(mockCalendar.createReminderAsync).toHaveBeenCalledWith(
        'list-1',
        expect.objectContaining({ title: 'Buy milk', priority: 5 }),
      );
      expect(result.current.lastError).toBeNull();
      expect(result.current.inFlight).toBe(false);
    });

    it('error: classifies rejection from bridge', async () => {
      mockCalendar.createReminderAsync.mockRejectedValue(new Error('Invalid required field'));
      const { result } = renderHook(() => useReminders());

      await waitFor(() => {
        expect(result.current.status).toBe('authorized');
      });

      await act(async () => {
        await result.current.createReminder({
          title: '',
          listId: 'list-1',
          priority: 'none',
        });
      });

      await waitFor(() => {
        expect(result.current.lastError).toMatchObject({ kind: 'invalid-input' });
        expect(result.current.inFlight).toBe(false);
      });
    });
  });

  // ─── CRUD: updateReminder ────────────────────────────────────────
  describe('CRUD: updateReminder', () => {
    beforeEach(() => {
      mockCalendar.getRemindersPermissionsAsync.mockResolvedValue({
        status: 'granted',
        granted: true,
        canAskAgain: true,
      });
      mockCalendar.getCalendarsAsync.mockResolvedValue([
        {
          id: 'list-1',
          title: 'My Reminders',
          type: 'local',
          color: '#fff',
          allowsModifications: true,
        },
      ]);
    });

    it('success: calls updateReminderAsync with reminderId and details', async () => {
      const { result } = renderHook(() => useReminders());

      await waitFor(() => {
        expect(result.current.status).toBe('authorized');
      });

      await act(async () => {
        await result.current.updateReminder('rem-1', {
          title: 'Updated',
          listId: 'list-1',
          priority: 'low',
        });
      });

      expect(mockCalendar.updateReminderAsync).toHaveBeenCalledWith(
        'rem-1',
        expect.objectContaining({ title: 'Updated', priority: 9 }),
      );
      expect(result.current.lastError).toBeNull();
    });

    it('error: sets not-found lastError when bridge rejects', async () => {
      mockCalendar.updateReminderAsync.mockRejectedValue(new Error('Reminder not found'));
      const { result } = renderHook(() => useReminders());

      await waitFor(() => {
        expect(result.current.status).toBe('authorized');
      });

      await act(async () => {
        await result.current.updateReminder('missing', {
          title: 'X',
          listId: 'list-1',
          priority: 'none',
        });
      });

      await waitFor(() => {
        expect(result.current.lastError).toMatchObject({ kind: 'not-found' });
      });
    });
  });

  // ─── CRUD: deleteReminder ────────────────────────────────────────
  describe('CRUD: deleteReminder', () => {
    beforeEach(() => {
      mockCalendar.getRemindersPermissionsAsync.mockResolvedValue({
        status: 'granted',
        granted: true,
        canAskAgain: true,
      });
      mockCalendar.getCalendarsAsync.mockResolvedValue([
        {
          id: 'list-1',
          title: 'My Reminders',
          type: 'local',
          color: '#fff',
          allowsModifications: true,
        },
      ]);
    });

    it('success: calls deleteReminderAsync and clears lastError', async () => {
      const { result } = renderHook(() => useReminders());

      await waitFor(() => {
        expect(result.current.status).toBe('authorized');
      });

      await act(async () => {
        await result.current.deleteReminder('rem-1');
      });

      expect(mockCalendar.deleteReminderAsync).toHaveBeenCalledWith('rem-1');
      expect(result.current.lastError).toBeNull();
    });

    it('error: sets denied lastError when bridge rejects with permission error', async () => {
      mockCalendar.deleteReminderAsync.mockRejectedValue(new Error('Permission denied'));
      const { result } = renderHook(() => useReminders());

      await waitFor(() => {
        expect(result.current.status).toBe('authorized');
      });

      await act(async () => {
        await result.current.deleteReminder('rem-1');
      });

      await waitFor(() => {
        expect(result.current.lastError).toMatchObject({ kind: 'denied' });
      });
    });
  });
});
