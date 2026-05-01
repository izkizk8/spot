/**
 * Bluetooth Lab Screen — Android variant tests (T037).
 * Feature: 035-core-bluetooth
 */

import React from 'react';
import { Platform } from 'react-native';
import { render } from '@testing-library/react-native';

Platform.OS = 'android';

jest.mock('@/modules/bluetooth-lab/hooks/useBleCentral', () => ({
  useBleCentral: jest.fn(),
}));

jest.mock('@/native/ble-central', () => ({
  getState: jest.fn(() => 'unknown'),
  isAvailable: jest.fn(() => false),
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

import Screen from '@/modules/bluetooth-lab/screen.android';
import { useBleCentral } from '@/modules/bluetooth-lab/hooks/useBleCentral';

const baseState = {
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
};

describe('BluetoothLabScreen (Android)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useBleCentral as jest.Mock).mockReturnValue(baseState);
  });

  it('renders the same six panels', () => {
    const { getByText } = render(<Screen />);
    expect(getByText(/central state/i)).toBeTruthy();
    expect(getByText('Permission')).toBeTruthy();
    expect(getByText(/Discovered \(/)).toBeTruthy();
  });

  it('renders the Android fallback banner', () => {
    const { getByText } = render(<Screen />);
    expect(getByText(/runtime permission requests vary by android api level/i)).toBeTruthy();
  });
});
