/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render } from '@testing-library/react-native';

import { __setRoomPlanBridgeForTests } from '@/modules/lidar-roomplan-lab/hooks/useRoomCapture';
import type { RoomPlanBridge } from '@/native/roomplan.types';

const mockBridge: RoomPlanBridge = {
  isSupported: jest.fn(() => true),
  startCapture: jest.fn(async () => {
    throw new Error('unused');
  }),
  stopCapture: jest.fn(async () => undefined),
  exportUSDZ: jest.fn(async () => 'file:///tmp/x.usdz'),
  subscribe: jest.fn(() => () => {}),
};

jest.mock('@/native/share-sheet', () => ({
  bridge: {
    isAvailable: () => true,
    present: jest.fn(async () => ({ activityType: null, completed: false })),
  },
}));

beforeEach(() => {
  __setRoomPlanBridgeForTests(mockBridge);
});

afterEach(() => {
  __setRoomPlanBridgeForTests(null);
  jest.clearAllMocks();
});

import LidarRoomplanLabScreen from '@/modules/lidar-roomplan-lab/screen';

describe('lidar-roomplan-lab screen (iOS)', () => {
  it('renders all primary sections', () => {
    const { getByTestId } = render(<LidarRoomplanLabScreen />);
    expect(getByTestId('roomplan-capability-card')).toBeTruthy();
    expect(getByTestId('roomplan-scan-launcher')).toBeTruthy();
    expect(getByTestId('roomplan-live-status-card')).toBeTruthy();
    expect(getByTestId('roomplan-rooms-list')).toBeTruthy();
    expect(getByTestId('roomplan-room-detail')).toBeTruthy();
  });

  it('renders the empty rooms state by default', () => {
    const { getByTestId } = render(<LidarRoomplanLabScreen />);
    expect(getByTestId('roomplan-rooms-empty')).toBeTruthy();
  });

  it('renders the empty room detail by default (no selection)', () => {
    const { getByTestId } = render(<LidarRoomplanLabScreen />);
    expect(getByTestId('roomplan-room-detail-empty')).toBeTruthy();
  });
});
