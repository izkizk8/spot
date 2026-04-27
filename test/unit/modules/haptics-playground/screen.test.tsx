import { describe, expect, it, jest, beforeEach, afterEach } from '@jest/globals';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';
import { Platform } from 'react-native';

jest.mock('react-native-reanimated', () => {
  const ReactLib = require('react');
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: {
      View: (props: Record<string, unknown> & { children?: React.ReactNode }) =>
        ReactLib.createElement(View, props, props.children),
    },
    useSharedValue: (v: unknown) => ({ value: v }),
    useAnimatedStyle: () => ({}),
    withTiming: (v: unknown) => v,
    withSequence: (...vs: unknown[]) => vs[vs.length - 1],
  };
});

jest.mock('@/modules/haptics-playground/haptic-driver', () => ({
  play: jest.fn().mockResolvedValue(undefined),
}));

const mockList = jest.fn();
const mockSave = jest.fn();
const mockDelete = jest.fn();
jest.mock('@/modules/haptics-playground/presets-store', () => ({
  list: (...a: unknown[]) => mockList(...a),
  save: (...a: unknown[]) => mockSave(...a),
  deletePreset: (...a: unknown[]) => mockDelete(...a),
}));

import { play } from '@/modules/haptics-playground/haptic-driver';
import { HapticsPlaygroundScreen } from '@/modules/haptics-playground/screen';
import type { Pattern, Preset } from '@/modules/haptics-playground/types';

const setOS = (os: string) =>
  Object.defineProperty(Platform, 'OS', { configurable: true, get: () => os });

describe('HapticsPlaygroundScreen', () => {
  beforeEach(() => {
    setOS('ios');
    (play as jest.Mock).mockClear();
    mockList.mockReset().mockResolvedValue([]);
    mockSave.mockReset();
    mockDelete.mockReset().mockResolvedValue(undefined);
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders 3 notification, 3 impact, and 3 selection buttons', async () => {
    const { findByText, getAllByTestId } = render(<HapticsPlaygroundScreen />);
    await findByText('Success');
    expect(getAllByTestId(/^haptic-btn-notification-/)).toHaveLength(3);
    expect(getAllByTestId(/^haptic-btn-impact-/).length).toBeGreaterThanOrEqual(3);
    expect(getAllByTestId(/^haptic-btn-selection-/)).toHaveLength(3);
  });

  it('composer has 8 cells and Play / Save Preset buttons', async () => {
    const { findByText, getAllByTestId, getByText } = render(<HapticsPlaygroundScreen />);
    await findByText('Play');
    expect(getAllByTestId(/^cell-/)).toHaveLength(8);
    expect(getByText('Play')).toBeTruthy();
    expect(getByText('Save Preset')).toBeTruthy();
  });

  it('shows web banner when Platform.OS === web', async () => {
    setOS('web');
    const { findByText } = render(<HapticsPlaygroundScreen />);
    await findByText(/Haptics not supported/i);
  });

  it('does not show web banner on ios', async () => {
    const { queryByText, findByText } = render(<HapticsPlaygroundScreen />);
    await findByText('Play');
    expect(queryByText(/Haptics not supported/i)).toBeNull();
  });

  it('saving a preset adds it to the list', async () => {
    const seeded: Preset = {
      id: 'x',
      name: 'Preset 1',
      pattern: [
        { kind: 'impact', intensity: 'light' },
        { kind: 'off' },
        { kind: 'off' },
        { kind: 'off' },
        { kind: 'off' },
        { kind: 'off' },
        { kind: 'off' },
        { kind: 'off' },
      ] as unknown as Pattern,
      createdAt: '2024',
    };
    mockSave.mockResolvedValueOnce(seeded);

    const { findByText, getByTestId, getByText } = render(<HapticsPlaygroundScreen />);
    await findByText('Play');
    fireEvent.press(getByTestId('cell-0')); // light impact
    fireEvent.press(getByText('Save Preset'));

    await waitFor(() => expect(mockSave).toHaveBeenCalled());
    await findByText('Preset 1');
  });

  it('tapping a preset row plays cells in order', async () => {
    jest.useFakeTimers();
    const preset: Preset = {
      id: 'x',
      name: 'Preset 1',
      pattern: [
        { kind: 'impact', intensity: 'light' },
        { kind: 'notification', intensity: 'success' },
        { kind: 'off' },
        { kind: 'off' },
        { kind: 'off' },
        { kind: 'off' },
        { kind: 'off' },
        { kind: 'off' },
      ] as unknown as Pattern,
      createdAt: '2024',
    };
    mockList.mockResolvedValue([preset]);

    const { findByText } = render(<HapticsPlaygroundScreen />);
    const row = await findByText('Preset 1');
    fireEvent.press(row);

    await act(async () => {
      jest.advanceTimersByTime(0);
      await Promise.resolve();
    });
    expect(play).toHaveBeenCalledTimes(1);
    await act(async () => {
      jest.advanceTimersByTime(120);
      await Promise.resolve();
    });
    expect(play).toHaveBeenCalledTimes(2);
  });
});
