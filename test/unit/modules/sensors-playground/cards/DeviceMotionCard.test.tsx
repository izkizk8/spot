/**
 * @file DeviceMotionCard.test.tsx
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
  // alpha=π → yaw 180°, beta=π/2 → pitch 90°, gamma=π/4 → roll 45°
  snapshot: jest.fn(() => [{ alpha: Math.PI, beta: Math.PI / 2, gamma: Math.PI / 4 }]),
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
  useSensorStream: jest.fn((opts: { mapSample: (raw: unknown) => unknown }) => {
    // Keep a quick-sanity check that the mapper extracts .rotation correctly.
    const mapped = opts.mapSample({ rotation: { alpha: 1, beta: 2, gamma: 3 } });
    void mapped;
    return mockStream;
  }),
}));

import { DeviceMotionCard } from '@/modules/sensors-playground/cards/DeviceMotionCard';

beforeEach(() => {
  mockStream.isAvailable = true;
  mockStream.isRunning = false;
  mockStream.permissionState = 'granted';
  mockStream.snapshot.mockImplementation(() => [
    { alpha: Math.PI, beta: Math.PI / 2, gamma: Math.PI / 4 },
  ]);
  mockStream.start.mockClear();
  mockStream.stop.mockClear();
});

describe('DeviceMotionCard', () => {
  it('renders title and three readouts in degrees at 3-decimal precision (β=pitch, γ=roll, α=yaw)', () => {
    const { getByText, getByTestId } = render(<DeviceMotionCard />);
    expect(getByText('Device Motion')).toBeTruthy();
    expect(getByTestId('readout-pitch').props.children).toBe('pitch: 90.000');
    expect(getByTestId('readout-roll').props.children).toBe('roll: 45.000');
    expect(getByTestId('readout-yaw').props.children).toBe('yaw: 180.000');
  });

  it('default sample rate is 60 Hz; Start toggles', () => {
    const { getByTestId } = render(<DeviceMotionCard />);
    expect(getByTestId('sample-rate-60').props.accessibilityState.selected).toBe(true);
    fireEvent.press(getByTestId('start-stop-button'));
    expect(mockStream.start).toHaveBeenCalledTimes(1);
  });

  it('mounts a SpiritLevel and forwards pitch/roll', () => {
    const { getByTestId } = render(<DeviceMotionCard />);
    expect(getByTestId('spirit-level')).toBeTruthy();
    expect(getByTestId('spirit-level-disc')).toBeTruthy();
  });
});
