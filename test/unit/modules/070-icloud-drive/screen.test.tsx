/**
 * iCloud Drive Lab Screen Test (iOS)
 * Feature: 070-icloud-drive
 */

import { render, screen, fireEvent } from '@testing-library/react-native';
import { describe, expect, it, jest } from '@jest/globals';
import React from 'react';
import { Platform } from 'react-native';

Platform.OS = 'ios';
Platform.Version = 16;

import type {
  ICloudDriveState,
  ICloudDriveActions,
} from '@/modules/icloud-drive-lab/hooks/useICloudDrive';

type StoreShape = ICloudDriveState & ICloudDriveActions;

const baseStore: StoreShape = {
  available: true as boolean | null,
  files: [],
  loading: false,
  lastError: null,
  checkAvailability: jest.fn(async () => {}),
  refresh: jest.fn(async () => {}),
  writeFile: jest.fn(async (_name: string, _content: string) => {}),
  readFile: jest.fn(async (_url: string): Promise<string | null> => null),
  deleteFile: jest.fn(async (_url: string) => {}),
};

const mockUseICloudDrive = jest.fn(() => baseStore);

jest.mock('@/modules/icloud-drive-lab/hooks/useICloudDrive', () => ({
  useICloudDrive: mockUseICloudDrive,
}));

describe('ICloudDriveLabScreen (iOS)', () => {
  it('renders all sections', () => {
    const Screen = require('@/modules/icloud-drive-lab/screen').default;
    render(<Screen />);
    expect(screen.getByText(/Entitlement Required/i)).toBeTruthy();
    expect(screen.getByText(/Availability/i)).toBeTruthy();
    expect(screen.getAllByText(/iCloud Files/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Refresh Files/i)).toBeTruthy();
    expect(screen.getByText(/Setup Instructions/i)).toBeTruthy();
  });

  it('calls refresh when Refresh Files is pressed', () => {
    const Screen = require('@/modules/icloud-drive-lab/screen').default;
    render(<Screen />);
    fireEvent.press(screen.getByText(/Refresh Files/i));
    expect(baseStore.refresh).toHaveBeenCalledTimes(1);
  });

  it('calls writeFile when Write Demo File is pressed', () => {
    const Screen = require('@/modules/icloud-drive-lab/screen').default;
    render(<Screen />);
    fireEvent.press(screen.getByText(/Write Demo File/i));
    expect(baseStore.writeFile).toHaveBeenCalledTimes(1);
  });

  it('shows error message when lastError is set', () => {
    mockUseICloudDrive.mockReturnValueOnce({
      ...baseStore,
      lastError: new Error('bridge-error'),
    });
    const Screen = require('@/modules/icloud-drive-lab/screen').default;
    render(<Screen />);
    expect(screen.getByText(/bridge-error/)).toBeTruthy();
  });

  it('shows unavailable copy when available is false', () => {
    mockUseICloudDrive.mockReturnValueOnce({
      ...baseStore,
      available: false,
    });
    const Screen = require('@/modules/icloud-drive-lab/screen').default;
    render(<Screen />);
    expect(screen.getByText(/unavailable/i)).toBeTruthy();
  });
});
