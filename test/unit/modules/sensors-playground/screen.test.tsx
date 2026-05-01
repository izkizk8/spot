/**
 * @file screen.test.tsx
 * @description Integration test for SensorsPlaygroundScreen (T027).
 * Mocks useSensorStream globally; one mock-state object per sensor.
 */
import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

type Perm = 'granted' | 'denied' | 'undetermined' | 'notRequired';

function makeMockStream(name: string) {
  return {
    __name: name,
    isAvailable: true,
    permissionState: 'notRequired' as Perm,
    isRunning: false,
    latest: null,
    snapshot: jest.fn(() => []),
    subscribeToSnapshot: jest.fn(() => () => {}),
    start: jest.fn(async () => {}),
    stop: jest.fn(),
    requestPermission: jest.fn(async () => 'granted' as const),
  };
}

const mocks = {
  Accelerometer: makeMockStream('Accelerometer'),
  Gyroscope: makeMockStream('Gyroscope'),
  Magnetometer: makeMockStream('Magnetometer'),
  DeviceMotion: makeMockStream('DeviceMotion'),
};

jest.mock('@/modules/sensors-playground/hooks/useSensorStream', () => ({
  __esModule: true,
  Sensors: {
    Accelerometer: { name: 'Accelerometer' },
    Gyroscope: { name: 'Gyroscope' },
    Magnetometer: { name: 'Magnetometer' },
    DeviceMotion: { name: 'DeviceMotion' },
  },
  useSensorStream: jest.fn((opts: { sensor: { name: keyof typeof mocks } }) => {
    return mocks[opts.sensor.name];
  }),
}));

import SensorsPlaygroundScreen from '@/modules/sensors-playground/screen';

beforeEach(() => {
  Object.values(mocks).forEach((m) => {
    m.isAvailable = true;
    m.isRunning = false;
    m.permissionState = 'notRequired';
    m.start.mockClear();
    m.stop.mockClear();
  });
});

describe('SensorsPlaygroundScreen', () => {
  it('renders header title and a Start All button', () => {
    const { getByTestId, getByText } = render(<SensorsPlaygroundScreen />);
    expect(getByTestId('sensors-playground-title')).toBeTruthy();
    expect(getByText('Sensors Playground')).toBeTruthy();
    expect(getByText('Start All')).toBeTruthy();
  });

  it('renders the four cards in canonical order (Accelerometer → Gyroscope → Magnetometer → DeviceMotion)', () => {
    const { getByTestId } = render(<SensorsPlaygroundScreen />);
    expect(getByTestId('accelerometer-card')).toBeTruthy();
    expect(getByTestId('gyroscope-card')).toBeTruthy();
    expect(getByTestId('magnetometer-card')).toBeTruthy();
    expect(getByTestId('device-motion-card')).toBeTruthy();
  });

  it('Start All calls each available card.start(); header label flips to Stop All', () => {
    const { getByTestId, getByText } = render(<SensorsPlaygroundScreen />);
    fireEvent.press(getByTestId('start-all-button'));
    expect(mocks.Accelerometer.start).toHaveBeenCalledTimes(1);
    expect(mocks.Gyroscope.start).toHaveBeenCalledTimes(1);
    expect(mocks.Magnetometer.start).toHaveBeenCalledTimes(1);
    expect(mocks.DeviceMotion.start).toHaveBeenCalledTimes(1);
    expect(getByText('Stop All')).toBeTruthy();
  });

  it('Stop All calls each card.stop()', () => {
    const { getByTestId } = render(<SensorsPlaygroundScreen />);
    fireEvent.press(getByTestId('start-all-button'));
    fireEvent.press(getByTestId('start-all-button'));
    expect(mocks.Accelerometer.stop).toHaveBeenCalledTimes(1);
    expect(mocks.Gyroscope.stop).toHaveBeenCalledTimes(1);
    expect(mocks.Magnetometer.stop).toHaveBeenCalledTimes(1);
    expect(mocks.DeviceMotion.stop).toHaveBeenCalledTimes(1);
  });

  it('Start All skips cards whose isAvailable is false (FR-030)', () => {
    mocks.Magnetometer.isAvailable = false;
    const { getByTestId } = render(<SensorsPlaygroundScreen />);
    fireEvent.press(getByTestId('start-all-button'));
    expect(mocks.Accelerometer.start).toHaveBeenCalledTimes(1);
    expect(mocks.Gyroscope.start).toHaveBeenCalledTimes(1);
    expect(mocks.DeviceMotion.start).toHaveBeenCalledTimes(1);
    expect(mocks.Magnetometer.start).not.toHaveBeenCalled();
  });
});
