/**
 * Bluetooth Lab Screen — Web variant tests (T038).
 * Feature: 035-core-bluetooth
 */

import React from 'react';
import { Platform } from 'react-native';
import { render } from '@testing-library/react-native';

Platform.OS = 'web';

jest.mock('@/modules/bluetooth-lab/hooks/useBleCentral', () => ({
  useBleCentral: jest.fn(),
}));

import Screen from '@/modules/bluetooth-lab/screen.web';
import { useBleCentral } from '@/modules/bluetooth-lab/hooks/useBleCentral';

const baseState = {
  central: 'unsupported',
  permission: 'notApplicable',
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

describe('BluetoothLabScreen (Web)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useBleCentral as jest.Mock).mockReturnValue(baseState);
  });

  it('renders a "not supported" notice when navigator.bluetooth is undefined', () => {
    const { getByText } = render(<Screen />);
    expect(getByText(/web bluetooth is not available/i)).toBeTruthy();
  });

  it('omits the IOSOnlyBanner on web', () => {
    const { queryByText } = render(<Screen />);
    // The Android-fallback banner copy must not appear on Web
    expect(queryByText(/runtime permission requests vary/i)).toBeNull();
  });

  it('renders ScanControls / DiscoveredList when supported', () => {
    (useBleCentral as jest.Mock).mockReturnValue({
      ...baseState,
      central: 'poweredOn',
    });
    const { getByText } = render(<Screen />);
    expect(getByText('Scan')).toBeTruthy();
    expect(getByText(/Discovered \(/)).toBeTruthy();
  });

  it('does NOT eager-import the iOS bridge at evaluation time (SC-007)', () => {
    jest.isolateModules(() => {
      jest.doMock('@/native/ble-central.ts', () => {
        throw new Error('iOS bridge MUST NOT be imported at evaluation time on web');
      });
      expect(() => {
        require('@/modules/bluetooth-lab/screen.web');
      }).not.toThrow();
    });
  });
});
