/**
 * StateCard — unit tests (T017).
 * Feature: 035-core-bluetooth
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

import StateCard from '@/modules/bluetooth-lab/components/StateCard';
import type { CentralState } from '@/native/ble-central.types';

describe('StateCard', () => {
  const states: CentralState[] = [
    'poweredOn',
    'poweredOff',
    'unauthorized',
    'unsupported',
    'resetting',
    'unknown',
  ];

  it.each(states)('renders the %s status pill', (s) => {
    const { getByLabelText } = render(<StateCard state={s} onRefresh={jest.fn()} />);
    expect(getByLabelText(`central-state-${s}`)).toBeTruthy();
  });

  it('calls onRefresh when Refresh is pressed', () => {
    const onRefresh = jest.fn();
    const { getByText } = render(<StateCard state='unknown' onRefresh={onRefresh} />);
    fireEvent.press(getByText(/refresh/i));
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });

  it('renders a deterministic caption per state', () => {
    const { getByText: get1 } = render(<StateCard state='poweredOn' onRefresh={jest.fn()} />);
    expect(get1(/on and ready/i)).toBeTruthy();
    const { getByText: get2 } = render(<StateCard state='poweredOff' onRefresh={jest.fn()} />);
    expect(get2(/radio is off/i)).toBeTruthy();
  });
});
