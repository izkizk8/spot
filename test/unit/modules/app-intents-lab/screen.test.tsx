/**
 * iOS variant screen test (US1, US2, US3).
 *
 * Mocks the bridge and the mood-store so it runs deterministically
 * on the Windows host.
 */

const mockLogMood = jest.fn().mockResolvedValue({ ok: true, logged: 'happy', timestamp: 1 });
const mockGetLastMood = jest.fn().mockResolvedValue({ ok: true, mood: 'happy' });
const mockGreetUser = jest.fn().mockResolvedValue({ ok: true, greeting: 'Hello, Ada!' });

jest.mock('@/native/app-intents', () => ({
  __esModule: true,
  default: {
    isAvailable: () => true,
    logMood: mockLogMood,
    getLastMood: mockGetLastMood,
    greetUser: mockGreetUser,
  },
  AppIntentsNotSupported: class extends Error {
    constructor(m?: string) {
      super(m);
      this.name = 'AppIntentsNotSupported';
    }
  },
}));

const mockPush = jest.fn().mockResolvedValue(undefined);
const mockList = jest.fn();
const mockClear = jest.fn().mockResolvedValue(undefined);

jest.mock('@/modules/app-intents-lab/mood-store', () => {
  const actual = jest.requireActual('@/modules/app-intents-lab/mood-store');
  return {
    __esModule: true,
    ...actual,
    push: (...args: unknown[]) => mockPush(...args),
    list: (...args: unknown[]) => mockList(...args),
    clear: (...args: unknown[]) => mockClear(...args),
  };
});

const mockAddListener = jest.fn();
const mockSubscriptionRemove = jest.fn();

import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { AppState, Linking } from 'react-native';

import type { MoodRecord } from '@/modules/app-intents-lab/mood-store';

beforeAll(() => {
  jest.spyOn(AppState, 'addEventListener').mockImplementation(((...args: unknown[]) => {
    mockAddListener(...args);
    return { remove: mockSubscriptionRemove };
  }) as unknown as typeof AppState.addEventListener);
  jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
});

// Default list mock returns no records; tests can override per case.
beforeEach(() => {
  mockLogMood.mockClear();
  mockGetLastMood.mockClear();
  mockGreetUser.mockClear();
  mockPush.mockClear();
  mockList.mockClear();
  mockList.mockResolvedValue([] as readonly MoodRecord[]);
  mockClear.mockClear();
  mockAddListener.mockClear();
  mockSubscriptionRemove.mockClear();
  (Linking.openURL as jest.Mock).mockClear();
  (Linking.openURL as jest.Mock).mockResolvedValue(true);
});

async function flushPromises(): Promise<void> {
  // Allow async useEffect + reducer dispatches to settle.
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
  });
}

describe('AppIntentsLabScreen iOS — US1 (self-test panel)', () => {
  it('does NOT render an "iOS 16" banner', async () => {
    const Screen = require('@/modules/app-intents-lab/screen').default;
    const { queryByText } = render(<Screen />);
    await flushPromises();
    expect(queryByText(/iOS 16/)).toBeNull();
  });

  it('mood picker defaults to Neutral', async () => {
    const Screen = require('@/modules/app-intents-lab/screen').default;
    const { getByLabelText } = render(<Screen />);
    await flushPromises();
    expect(getByLabelText('Mood: Neutral').props.accessibilityState.selected).toBe(true);
  });

  it('three intent buttons visible', async () => {
    const Screen = require('@/modules/app-intents-lab/screen').default;
    const { getByLabelText } = render(<Screen />);
    await flushPromises();
    expect(getByLabelText('Log mood')).toBeTruthy();
    expect(getByLabelText('Get last mood')).toBeTruthy();
    expect(getByLabelText('Greet user')).toBeTruthy();
  });

  it('Log mood with default "neutral" calls bridge.logMood("neutral") and adds an event-log row', async () => {
    const Screen = require('@/modules/app-intents-lab/screen').default;
    const { getByLabelText, findByText, findAllByText } = render(<Screen />);
    await flushPromises();

    mockLogMood.mockResolvedValueOnce({ ok: true, logged: 'neutral', timestamp: 1 });
    await act(async () => {
      fireEvent.press(getByLabelText('Log mood'));
    });
    await flushPromises();

    expect(mockLogMood).toHaveBeenCalledWith('neutral');
    expect((await findAllByText(/Logged neutral/)).length).toBeGreaterThan(0);
    expect(await findByText('LogMoodIntent')).toBeTruthy();
  });

  it('Get last mood calls bridge.getLastMood and adds a GetLastMoodIntent row', async () => {
    const Screen = require('@/modules/app-intents-lab/screen').default;
    const { getByLabelText, findByText, findAllByText } = render(<Screen />);
    await flushPromises();

    mockGetLastMood.mockResolvedValueOnce({ ok: true, mood: 'happy' });
    await act(async () => {
      fireEvent.press(getByLabelText('Get last mood'));
    });
    await flushPromises();

    expect(mockGetLastMood).toHaveBeenCalled();
    expect((await findAllByText('Last mood: happy')).length).toBeGreaterThan(0);
    expect(await findByText('GetLastMoodIntent')).toBeTruthy();
  });

  it('Greet user with name "Ada" calls bridge.greetUser("Ada")', async () => {
    const Screen = require('@/modules/app-intents-lab/screen').default;
    const { getByLabelText, findByText, findAllByText } = render(<Screen />);
    await flushPromises();

    mockGreetUser.mockResolvedValueOnce({ ok: true, greeting: 'Hello, Ada!' });
    fireEvent.changeText(getByLabelText('Name'), 'Ada');
    await act(async () => {
      fireEvent.press(getByLabelText('Greet user'));
    });
    await flushPromises();

    expect(mockGreetUser).toHaveBeenCalledWith('Ada');
    expect((await findAllByText('Hello, Ada!')).length).toBeGreaterThan(0);
    expect(await findByText('GreetUserIntent')).toBeTruthy();
  });

  it('event log caps at 10 entries newest-first after 12 successive Get last mood presses', async () => {
    const Screen = require('@/modules/app-intents-lab/screen').default;
    const { getByLabelText, findAllByText } = render(<Screen />);
    await flushPromises();

    for (let i = 0; i < 12; i++) {
      mockGetLastMood.mockResolvedValueOnce({ ok: true, mood: 'sad' });
      await act(async () => {
        fireEvent.press(getByLabelText('Get last mood'));
      });
      await flushPromises();
    }

    const rows = await findAllByText('GetLastMoodIntent');
    expect(rows).toHaveLength(10);
  });

  it('bridge rejection surfaces a failure row + error message', async () => {
    const Screen = require('@/modules/app-intents-lab/screen').default;
    const { getByLabelText, findAllByText, findByLabelText } = render(<Screen />);
    await flushPromises();

    mockGetLastMood.mockRejectedValueOnce(new Error('boom'));
    await act(async () => {
      fireEvent.press(getByLabelText('Get last mood'));
    });
    await flushPromises();

    expect((await findAllByText('boom')).length).toBeGreaterThan(0);
    expect(await findByLabelText('Status: failure')).toBeTruthy();
  });
});

describe('AppIntentsLabScreen iOS — US2 (Mood History)', () => {
  it('Log mood calls mood-store.push with { mood: "happy", timestamp: <number> } and refreshes history', async () => {
    const Screen = require('@/modules/app-intents-lab/screen').default;
    const { getByLabelText } = render(<Screen />);
    await flushPromises();

    fireEvent.press(getByLabelText('Mood: Happy'));
    await act(async () => {
      fireEvent.press(getByLabelText('Log mood'));
    });
    await flushPromises();

    expect(mockPush).toHaveBeenCalledWith({
      mood: 'happy',
      timestamp: expect.any(Number),
    });
    // list called on mount + after push
    expect(mockList).toHaveBeenCalled();
    expect(mockList).toHaveBeenCalledWith({ limit: 20 });
  });

  it('Pre-seeded store of 22 entries renders 20 rows on mount', async () => {
    const records: MoodRecord[] = Array.from({ length: 22 }, (_, i) => ({
      mood: 'neutral',
      timestamp: i + 1,
    }));
    // Limit applied at the store level; emulate by capping to 20.
    mockList.mockResolvedValue(records.slice(0, 20));
    const Screen = require('@/modules/app-intents-lab/screen').default;
    const { findAllByText } = render(<Screen />);
    await flushPromises();

    const rows = await findAllByText('Neutral');
    // 20 history rows + at least the picker label row (1)
    expect(rows.length).toBeGreaterThanOrEqual(20);
  });

  it('AppState change → "active" triggers mood-store.list refresh', async () => {
    const Screen = require('@/modules/app-intents-lab/screen').default;
    render(<Screen />);
    await flushPromises();

    const before = mockList.mock.calls.length;
    expect(mockAddListener).toHaveBeenCalledWith('change', expect.any(Function));
    const handler = mockAddListener.mock.calls[mockAddListener.mock.calls.length - 1][1] as (
      s: string,
    ) => void;
    await act(async () => {
      handler('active');
    });
    await flushPromises();

    expect(mockList.mock.calls.length).toBeGreaterThan(before);
  });

  it('unmount removes AppState listener (no post-unmount setState warnings)', async () => {
    const warn = jest.spyOn(console, 'error').mockImplementation(() => {});
    const Screen = require('@/modules/app-intents-lab/screen').default;
    const { unmount } = render(<Screen />);
    await flushPromises();
    unmount();
    await flushPromises();
    expect(mockSubscriptionRemove).toHaveBeenCalled();
    expect(warn).not.toHaveBeenCalledWith(
      expect.stringContaining("Can't perform a React state update on an unmounted component"),
    );
    warn.mockRestore();
  });
});

describe('AppIntentsLabScreen iOS — US3 (Shortcuts integration)', () => {
  it('renders the Shortcuts integration card', async () => {
    const Screen = require('@/modules/app-intents-lab/screen').default;
    const { findByLabelText } = render(<Screen />);
    expect(await findByLabelText('Open Shortcuts app')).toBeTruthy();
  });

  it('Open Shortcuts button calls Linking.openURL("shortcuts://")', async () => {
    const Screen = require('@/modules/app-intents-lab/screen').default;
    const { findByLabelText } = render(<Screen />);
    const btn = await findByLabelText('Open Shortcuts app');
    await act(async () => {
      fireEvent.press(btn);
    });
    await waitFor(() => {
      expect(Linking.openURL).toHaveBeenCalledWith('shortcuts://');
    });
  });
});
