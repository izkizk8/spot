/**
 * Bluetooth Lab Screen — iOS variant tests (T036).
 * Feature: 035-core-bluetooth
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

jest.mock('@/modules/bluetooth-lab/hooks/useBleCentral', () => ({
  useBleCentral: jest.fn(),
}));

jest.mock('@/native/ble-central', () => ({
  getState: jest.fn(() => 'unknown'),
  isAvailable: jest.fn(() => true),
  requestPermission: jest.fn(),
  startScan: jest.fn(),
  stopScan: jest.fn(),
  connect: jest.fn(),
  disconnect: jest.fn(),
  discoverServices: jest.fn(),
  discoverCharacteristics: jest.fn(),
  readCharacteristic: jest.fn(),
  writeCharacteristic: jest.fn(),
  subscribeCharacteristic: jest.fn(),
  unsubscribeCharacteristic: jest.fn(),
  emitter: { on: jest.fn(() => () => undefined) },
}));

import Screen from '@/modules/bluetooth-lab/screen';
import { useBleCentral } from '@/modules/bluetooth-lab/hooks/useBleCentral';

function mockState(over: Partial<ReturnType<typeof useBleCentral>> = {}) {
  return {
    central: 'poweredOn',
    permission: 'granted',
    scan: 'idle',
    scanFilter: [],
    allowDuplicates: false,
    discovered: [],
    connected: null,
    lastError: null,
    setScan: jest.fn(),
    setFilter: jest.fn(),
    setAllowDuplicates: jest.fn(),
    connect: jest.fn(),
    disconnect: jest.fn(),
    read: jest.fn(),
    write: jest.fn(),
    subscribe: jest.fn(),
    unsubscribe: jest.fn(),
    requestPermission: jest.fn(),
    refreshState: jest.fn(),
    ...over,
  } as unknown as ReturnType<typeof useBleCentral>;
}

describe('BluetoothLabScreen (iOS)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useBleCentral as jest.Mock).mockReturnValue(mockState());
  });

  it('renders the StateCard / PermissionsCard / ScanControls / DiscoveredList', () => {
    const { getByText } = render(<Screen />);
    expect(getByText(/central state/i)).toBeTruthy();
    expect(getByText('Permission')).toBeTruthy();
    expect(getByText('Scan')).toBeTruthy();
    expect(getByText(/Discovered \(/)).toBeTruthy();
  });

  it('renders PeripheralPanel only when connected !== null', () => {
    const { queryByLabelText, rerender } = render(<Screen />);
    expect(queryByLabelText(/connection-/)).toBeNull();
    (useBleCentral as jest.Mock).mockReturnValue(
      mockState({
        connected: {
          peripheral: {
            id: 'p1',
            name: 'p',
            rssi: -40,
            serviceUUIDs: [],
            lastSeen: Date.now(),
          },
          services: [],
          connectionState: 'connected',
          events: {},
        },
      }),
    );
    rerender(<Screen />);
    expect(queryByLabelText('connection-connected')).toBeTruthy();
  });

  it('tap on Connect button calls hook.connect()', () => {
    const connect = jest.fn();
    (useBleCentral as jest.Mock).mockReturnValue(
      mockState({
        discovered: [{ id: 'p1', name: 'p', rssi: -40, serviceUUIDs: [], lastSeen: Date.now() }],
        connect,
      }),
    );
    const { getByText } = render(<Screen />);
    fireEvent.press(getByText(/connect/i));
    expect(connect).toHaveBeenCalledWith('p1');
  });
});
