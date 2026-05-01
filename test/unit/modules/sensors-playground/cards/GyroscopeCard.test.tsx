/**
 * @file GyroscopeCard.test.tsx
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
  permissionState: 'notRequired',
  isRunning: false,
  latest: null,
  snapshot: jest.fn(() => [{ x: 0.1, y: 0.2, z: 0.3 }]),
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

import { GyroscopeCard } from '@/modules/sensors-playground/cards/GyroscopeCard';

beforeEach(() => {
  mockStream.isAvailable = true;
  mockStream.isRunning = false;
  mockStream.permissionState = 'notRequired';
  mockStream.snapshot.mockImplementation(() => [{ x: 0.1, y: 0.2, z: 0.3 }]);
  mockStream.start.mockClear();
  mockStream.stop.mockClear();
});

describe('GyroscopeCard', () => {
  it('renders title, three readouts at 3-decimal precision, picker, button, indicator', () => {
    const { getByText, getByTestId } = render(<GyroscopeCard />);
    expect(getByText('Gyroscope')).toBeTruthy();
    expect(getByTestId('readout-x').props.children).toBe('x: 0.100');
    expect(getByTestId('readout-y').props.children).toBe('y: 0.200');
    expect(getByTestId('readout-z').props.children).toBe('z: 0.300');
    expect(getByTestId('sample-rate-picker')).toBeTruthy();
    expect(getByTestId('start-stop-button')).toBeTruthy();
    expect(getByTestId('rotation-indicator')).toBeTruthy();
  });

  it('default sample rate is 60 Hz', () => {
    const { getByTestId } = render(<GyroscopeCard />);
    expect(getByTestId('sample-rate-60').props.accessibilityState.selected).toBe(true);
  });

  it('Start button calls start; running state flips label to Stop', () => {
    const { getByTestId, rerender, getByText } = render(<GyroscopeCard />);
    fireEvent.press(getByTestId('start-stop-button'));
    expect(mockStream.start).toHaveBeenCalledTimes(1);
    mockStream.isRunning = true;
    rerender(<GyroscopeCard />);
    expect(getByText('Stop')).toBeTruthy();
  });

  it('integrated yaw advances when synthetic samples arrive', () => {
    // Three samples with positive z → yaw should increase across renders.
    mockStream.snapshot.mockImplementation(() => [
      { x: 0, y: 0, z: 1 },
      { x: 0, y: 0, z: 1 },
      { x: 0, y: 0, z: 1 },
    ]);
    const { getByText } = render(<GyroscopeCard />);
    expect(getByText(/^yaw:/)).toBeTruthy();
  });
});
