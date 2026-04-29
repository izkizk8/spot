/**
 * EventLog — unit tests (T025).
 * Feature: 035-core-bluetooth
 */

import React from 'react';
import { act, render, fireEvent } from '@testing-library/react-native';

import EventLog, { EVENT_LOG_RENDER_CAP } from '@/modules/bluetooth-lab/components/EventLog';
import type { CharacteristicEvent } from '@/native/ble-central.types';

function evt(at: number, hex = 'ab'): CharacteristicEvent {
  return { kind: 'notify', bytesHex: hex, byteLength: hex.length / 2, at };
}

describe('EventLog', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders empty state', () => {
    const { getByText } = render(<EventLog events={[]} onClear={jest.fn()} />);
    expect(getByText(/no events yet/i)).toBeTruthy();
  });

  it(`caps rendered rows at ${EVENT_LOG_RENDER_CAP}`, () => {
    const events = Array.from({ length: EVENT_LOG_RENDER_CAP + 5 }, (_, i) => evt(i));
    const { queryAllByText } = render(<EventLog events={events} onClear={jest.fn()} />);
    act(() => {
      jest.advanceTimersByTime(150);
    });
    expect(queryAllByText('NOTIFY').length).toBeLessThanOrEqual(EVENT_LOG_RENDER_CAP);
  });

  it('Clear button calls onClear', () => {
    const onClear = jest.fn();
    const { getByText } = render(<EventLog events={[]} onClear={onClear} />);
    fireEvent.press(getByText(/clear/i));
    expect(onClear).toHaveBeenCalledTimes(1);
  });
});
