/**
 * @file MagnetometerCard.test.tsx
 */
import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

const mockStream: {
  isAvailable: boolean;
  permissionState: 'granted' | 'denied' | 'undetermined' | 'notRequired';
  isRunning: boolean;
  latest: unknown;
  snapshot: jest.Mock;
  subscribeToSnapshot: jest.Mock;
  start: jest.Mock;
  stop: jest.Mock;
  requestPermission: jest.Mock;
} = {
  isAvailable: true,
  permissionState: 'granted',
  isRunning: false,
  latest: null,
  snapshot: jest.fn(() => [{ x: 1.234, y: 5.678, z: 9.012 }]),
  subscribeToSnapshot: jest.fn(() => () => {}),
  start: jest.fn(async () => {}),
  stop: jest.fn(),
  requestPermission: jest.fn(async () => 'granted' as const),
};

jest.mock('@/modules/sensors-playground/hooks/useSensorStream', () => ({
  __esModule: true,
  Sensors: {
    Accelerometer: { name: 'Accelerometer' },
    Gyroscope: { name: 'Gyroscope' },
    Magnetometer: { name: 'Magnetometer' },
    DeviceMotion: { name: 'DeviceMotion' },
  },
  useSensorStream: jest.fn(() => mockStream),
}));

import { MagnetometerCard } from '@/modules/sensors-playground/cards/MagnetometerCard';

beforeEach(() => {
  mockStream.isAvailable = true;
  mockStream.isRunning = false;
  mockStream.permissionState = 'granted';
  mockStream.snapshot.mockImplementation(() => [{ x: 1.234, y: 5.678, z: 9.012 }]);
  mockStream.start.mockClear();
  mockStream.stop.mockClear();
});

describe('MagnetometerCard', () => {
  it('renders title, three readouts at 3-decimal precision, picker, button, compass', () => {
    const { getByText, getByTestId } = render(<MagnetometerCard />);
    expect(getByText('Magnetometer')).toBeTruthy();
    expect(getByTestId('readout-x').props.children).toBe('x: 1.234');
    expect(getByTestId('readout-y').props.children).toBe('y: 5.678');
    expect(getByTestId('readout-z').props.children).toBe('z: 9.012');
    expect(getByTestId('sample-rate-picker')).toBeTruthy();
    expect(getByTestId('compass-needle')).toBeTruthy();
  });

  it('default sample rate is 60 Hz', () => {
    const { getByTestId } = render(<MagnetometerCard />);
    expect(getByTestId('sample-rate-60').props.accessibilityState.selected).toBe(true);
  });

  it('Start button toggles', () => {
    const { getByTestId } = render(<MagnetometerCard />);
    fireEvent.press(getByTestId('start-stop-button'));
    expect(mockStream.start).toHaveBeenCalledTimes(1);
  });

  it('renders denied notice when permissionState=denied (FR-030, US4)', () => {
    mockStream.permissionState = 'denied';
    const { getByTestId } = render(<MagnetometerCard />);
    expect(getByTestId('permission-notice-denied')).toBeTruthy();
    expect(getByTestId('permission-open-settings')).toBeTruthy();
  });

  it('renders unsupported notice when isAvailable=false (Web)', () => {
    mockStream.isAvailable = false;
    const { getByTestId } = render(<MagnetometerCard />);
    expect(getByTestId('permission-notice-unsupported')).toBeTruthy();
  });
});
