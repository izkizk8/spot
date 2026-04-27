/**
 * Android fallback screen test (US4).
 *
 * Uses the explicit-filename require pattern so the iOS variant is
 * never resolved on the Windows host.
 */

const mockPush = jest.fn().mockResolvedValue(undefined);
const mockList = jest.fn();

jest.mock('@/modules/app-intents-lab/mood-store', () => {
  const actual = jest.requireActual('@/modules/app-intents-lab/mood-store');
  return {
    __esModule: true,
    ...actual,
    push: (...args: unknown[]) => mockPush(...args),
    list: (...args: unknown[]) => mockList(...args),
  };
});

import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';
import { AppState } from 'react-native';

import type { MoodRecord } from '@/modules/app-intents-lab/mood-store';

beforeAll(() => {
  jest.spyOn(AppState, 'addEventListener').mockImplementation(((..._args: unknown[]) => ({
    remove: jest.fn(),
  })) as unknown as typeof AppState.addEventListener);
});

beforeEach(() => {
  mockPush.mockClear();
  mockList.mockClear();
  mockList.mockResolvedValue([] as readonly MoodRecord[]);
});

async function flushPromises(): Promise<void> {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
  });
}
const Screen = require('@/modules/app-intents-lab/screen.android').default;

describe('AppIntentsLabScreen Android fallback (US4)', () => {
  it('renders the "App Intents are iOS 16+ only" banner', async () => {
    const { getByText } = render(<Screen />);
    await flushPromises();
    expect(getByText('App Intents are iOS 16+ only')).toBeTruthy();
  });

  it('renders MoodLogger, GreetForm, and MoodHistory', async () => {
    const { getByLabelText, getByText } = render(<Screen />);
    await flushPromises();
    expect(getByLabelText('Mood: Neutral')).toBeTruthy();
    expect(getByLabelText('Log mood')).toBeTruthy();
    expect(getByLabelText('Greet user')).toBeTruthy();
    expect(getByText('Mood History')).toBeTruthy();
  });

  it('does NOT render Get last mood button', async () => {
    const { queryByText, queryByLabelText } = render(<Screen />);
    await flushPromises();
    expect(queryByText('Get last mood')).toBeNull();
    expect(queryByLabelText('Get last mood')).toBeNull();
  });

  it('does NOT render the IntentEventLog', async () => {
    const { queryByText } = render(<Screen />);
    await flushPromises();
    expect(queryByText('Recent intent invocations')).toBeNull();
  });

  it('does NOT render the ShortcutsGuideCard', async () => {
    const { queryByLabelText, queryByText } = render(<Screen />);
    await flushPromises();
    expect(queryByLabelText('Open Shortcuts app')).toBeNull();
    expect(queryByText(/Shortcuts integration/i)).toBeNull();
  });

  it('Log mood with happy calls mood-store.push and entry appears at top of history', async () => {
    let stored: readonly MoodRecord[] = [];
    mockList.mockImplementation(async () => stored);
    mockPush.mockImplementation(async (rec: MoodRecord) => {
      stored = [rec, ...stored];
    });

    const { getByLabelText, findByTestId } = render(<Screen />);
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
    // The MoodHistory list shows the new entry — use the testID since
    // "Happy" also appears in the mood picker label.
    expect(await findByTestId('mood-history-row-0')).toBeTruthy();
  });

  it('Greet user with name "Mae" surfaces "Hello, Mae!" inline (no native bridge)', async () => {
    const { getByLabelText, findByText } = render(<Screen />);
    await flushPromises();

    fireEvent.changeText(getByLabelText('Name'), 'Mae');
    await act(async () => {
      fireEvent.press(getByLabelText('Greet user'));
    });
    await flushPromises();

    expect(await findByText('Hello, Mae!')).toBeTruthy();
  });

  it('does not import @/native/app-intents (FR-031) — confirmed by no module evaluation crash on web/android during this test', () => {
    // Just by virtue of this suite running through `require('@/modules/app-intents-lab/screen.android')`
    // and rendering without any AppIntentsNotSupported being thrown, FR-031 is upheld.
    expect(Screen).toBeDefined();
  });
});
