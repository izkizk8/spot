/**
 * PeripheralRow — unit tests (T021).
 * Feature: 035-core-bluetooth
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

import PeripheralRow from '@/modules/bluetooth-lab/components/PeripheralRow';

describe('PeripheralRow', () => {
  const baseRow = {
    id: 'abcdef0123',
    name: 'sensor',
    rssi: -50,
    serviceUUIDs: ['180f'],
    lastSeen: 1_000_000,
  };

  it('renders the four data slots', () => {
    const { getByText } = render(
      <PeripheralRow row={baseRow} now={1_005_000} connectInFlight={false} onConnect={jest.fn()} />,
    );
    expect(getByText('sensor')).toBeTruthy();
    expect(getByText('abcdef01')).toBeTruthy(); // truncated to 8
    expect(getByText('-50 dBm')).toBeTruthy();
    expect(getByText(/5s ago/)).toBeTruthy();
  });

  it('falls back to "(no name)" when name is null', () => {
    const { getByText } = render(
      <PeripheralRow
        row={{ ...baseRow, name: null }}
        now={1_000_000}
        connectInFlight={false}
        onConnect={jest.fn()}
      />,
    );
    expect(getByText('(no name)')).toBeTruthy();
  });

  it('disables Connect when connectInFlight is true', () => {
    const onConnect = jest.fn();
    const { getByText } = render(
      <PeripheralRow row={baseRow} now={1_000_000} connectInFlight={true} onConnect={onConnect} />,
    );
    fireEvent.press(getByText(/connect/i));
    expect(onConnect).not.toHaveBeenCalled();
  });

  it('calls onConnect when Connect tapped', () => {
    const onConnect = jest.fn();
    const { getByText } = render(
      <PeripheralRow row={baseRow} now={1_000_000} connectInFlight={false} onConnect={onConnect} />,
    );
    fireEvent.press(getByText(/connect/i));
    expect(onConnect).toHaveBeenCalledWith(baseRow);
  });
});
