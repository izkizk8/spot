/**
 * Web fallback screen test (US4).
 *
 * Mirrors screen.android.test.tsx but resolves the .web variant.
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
const Screen = require('@/modules/app-intents-lab/screen.web').default;

describe('AppIntentsLabScreen Web fallback (US4)', () => {
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

  it('does NOT render Get last mood / event log / Shortcuts card', async () => {
    const { queryByText, queryByLabelText } = render(<Screen />);
    await flushPromises();
    expect(queryByText('Get last mood')).toBeNull();
    expect(queryByText('Recent intent invocations')).toBeNull();
    expect(queryByLabelText('Open Shortcuts app')).toBeNull();
  });

  it('Log mood writes to mood-store.push', async () => {
    const { getByLabelText } = render(<Screen />);
    await flushPromises();

    fireEvent.press(getByLabelText('Mood: Sad'));
    await act(async () => {
      fireEvent.press(getByLabelText('Log mood'));
    });
    await flushPromises();

    expect(mockPush).toHaveBeenCalledWith({ mood: 'sad', timestamp: expect.any(Number) });
  });

  it('Greet returns "Hello, <name>!" inline in pure JS', async () => {
    const { getByLabelText, findByText } = render(<Screen />);
    await flushPromises();

    fireEvent.changeText(getByLabelText('Name'), 'Web User');
    await act(async () => {
      fireEvent.press(getByLabelText('Greet user'));
    });
    await flushPromises();
    expect(await findByText('Hello, Web User!')).toBeTruthy();
  });
});
