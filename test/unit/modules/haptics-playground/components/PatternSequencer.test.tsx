import { describe, expect, it, jest, beforeEach, afterEach } from '@jest/globals';
import { act, fireEvent, render } from '@testing-library/react-native';
import React from 'react';

jest.mock('@/modules/haptics-playground/haptic-driver', () => ({
  play: jest.fn().mockResolvedValue(undefined),
}));

import { play } from '@/modules/haptics-playground/haptic-driver';
import { PatternSequencer } from '@/modules/haptics-playground/components/PatternSequencer';

const tap = (el: unknown, n: number) => {
  for (let i = 0; i < n; i++) fireEvent.press(el as never);
};

describe('PatternSequencer', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    (play as jest.Mock).mockClear();
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it('cell tap cycles through 9 options back to off', () => {
    const { getByTestId } = render(<PatternSequencer />);
    const cell0 = getByTestId('cell-0');
    // 9 taps returns to off
    tap(cell0, 9);
    expect(cell0.props.accessibilityLabel).toBe('cell 0 off');
  });

  it('Play with all-off pattern does not call driver', () => {
    const { getByText } = render(<PatternSequencer />);
    fireEvent.press(getByText('Play'));
    act(() => {
      jest.advanceTimersByTime(120 * 9);
    });
    expect(play).not.toHaveBeenCalled();
  });

  it('Play with cells 0,2,4 fires driver in order at 120ms steps', async () => {
    const { getByTestId, getByText } = render(<PatternSequencer />);
    fireEvent.press(getByTestId('cell-0')); // impact:light
    fireEvent.press(getByTestId('cell-2')); // impact:light
    fireEvent.press(getByTestId('cell-4')); // impact:light
    fireEvent.press(getByText('Play'));

    await act(async () => {
      jest.advanceTimersByTime(0);
      await Promise.resolve();
    });
    expect(play).toHaveBeenCalledTimes(1);

    await act(async () => {
      jest.advanceTimersByTime(120);
      await Promise.resolve();
    });
    // Cell 1 is off — no extra call
    expect(play).toHaveBeenCalledTimes(1);

    await act(async () => {
      jest.advanceTimersByTime(120);
      await Promise.resolve();
    });
    expect(play).toHaveBeenCalledTimes(2);

    await act(async () => {
      jest.advanceTimersByTime(240);
      await Promise.resolve();
    });
    expect(play).toHaveBeenCalledTimes(3);
  });

  it('pressing Play during playback cancels remaining scheduled cells', async () => {
    const { getByTestId, getByText } = render(<PatternSequencer />);
    fireEvent.press(getByTestId('cell-0'));
    fireEvent.press(getByTestId('cell-1'));
    fireEvent.press(getByTestId('cell-2'));

    fireEvent.press(getByText('Play'));
    await act(async () => {
      jest.advanceTimersByTime(0);
      await Promise.resolve();
    });
    expect(play).toHaveBeenCalledTimes(1);

    // Re-press Play before second cell fires — empties pattern? No: cancels remaining of first run
    // Per spec: re-press during playback cancels then restarts. So after re-press we get cell0 again then 1, 2.
    fireEvent.press(getByText('Play'));
    (play as jest.Mock).mockClear();
    await act(async () => {
      jest.advanceTimersByTime(120 * 3);
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(play).toHaveBeenCalledTimes(3);
  });

  it('unmount during playback cancels remaining cells', async () => {
    const { getByTestId, getByText, unmount } = render(<PatternSequencer />);
    fireEvent.press(getByTestId('cell-0'));
    fireEvent.press(getByTestId('cell-1'));
    fireEvent.press(getByTestId('cell-2'));

    fireEvent.press(getByText('Play'));
    await act(async () => {
      jest.advanceTimersByTime(0);
      await Promise.resolve();
    });
    expect(play).toHaveBeenCalledTimes(1);

    unmount();
    (play as jest.Mock).mockClear();
    await act(async () => {
      jest.advanceTimersByTime(120 * 3);
      await Promise.resolve();
    });
    expect(play).not.toHaveBeenCalled();
  });
});
