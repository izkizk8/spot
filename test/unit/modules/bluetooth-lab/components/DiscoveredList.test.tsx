/**
 * DiscoveredList — unit tests (T020).
 * Feature: 035-core-bluetooth
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

import DiscoveredList from '@/modules/bluetooth-lab/components/DiscoveredList';
import { DISCOVERED_LIST_CAP } from '@/modules/bluetooth-lab/store/peripherals-store';
import type { DiscoveredPeripheral } from '@/native/ble-central.types';

function row(id: string, rssi: number, lastSeen: number): DiscoveredPeripheral {
  return { id: id.padEnd(8, '0'), name: id, rssi, serviceUUIDs: [], lastSeen };
}

describe('DiscoveredList', () => {
  it('renders empty state when no rows', () => {
    const { getByText } = render(
      <DiscoveredList rows={[]} connectInFlight={false} onConnect={jest.fn()} />,
    );
    expect(getByText(/no peripherals discovered yet/i)).toBeTruthy();
  });

  it('renders one row', () => {
    const { getByText } = render(
      <DiscoveredList
        rows={[row('a', -40, Date.now())]}
        connectInFlight={false}
        onConnect={jest.fn()}
      />,
    );
    expect(getByText('a')).toBeTruthy();
  });

  it(`caps render at ${DISCOVERED_LIST_CAP} rows with a caption`, () => {
    const rows = Array.from({ length: DISCOVERED_LIST_CAP + 5 }, (_, i) =>
      row(`r${i}-${i}`, -40 - i, Date.now() + i),
    );
    const { getByText } = render(
      <DiscoveredList rows={rows} connectInFlight={false} onConnect={jest.fn()} />,
    );
    expect(getByText(new RegExp(`Showing first ${DISCOVERED_LIST_CAP} rows`, 'i'))).toBeTruthy();
  });

  it('passes onConnect through to PeripheralRow', () => {
    const onConnect = jest.fn();
    const data = row('a', -40, Date.now());
    const { getByText } = render(
      <DiscoveredList rows={[data]} connectInFlight={false} onConnect={onConnect} />,
    );
    fireEvent.press(getByText(/connect/i));
    expect(onConnect).toHaveBeenCalledWith(data);
  });
});
