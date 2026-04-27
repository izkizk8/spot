/**
 * @file AccelerometerCard.test.tsx
 */
import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

const mockStream = {
  isAvailable: true,
  permissionState: 'notRequired' as const,
  isRunning: false,
  latest: null,
  snapshot: jest.fn(() => [{ x: 0.1, y: 0.2, z: 0.98 }]),
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
  RATE_TO_INTERVAL_MS: { 30: 33.3, 60: 16.6, 120: 8.3 },
  useSensorStream: jest.fn(() => mockStream),
}));

import { AccelerometerCard } from '@/modules/sensors-playground/cards/AccelerometerCard';
import { useSensorStream } from '@/modules/sensors-playground/hooks/useSensorStream';

const useSensorStreamMock = useSensorStream as unknown as jest.Mock;

beforeEach(() => {
  mockStream.isAvailable = true;
  mockStream.isRunning = false;
  mockStream.permissionState = 'notRequired';
  mockStream.snapshot.mockImplementation(() => [{ x: 0.1, y: 0.2, z: 0.98 }]);
  mockStream.start.mockClear();
  mockStream.stop.mockClear();
  useSensorStreamMock.mockClear();
  useSensorStreamMock.mockImplementation(() => mockStream);
});

describe('AccelerometerCard', () => {
  it('renders title, three readouts at 3-decimal precision, picker, start button, chart', () => {
    const { getByText, getByTestId } = render(<AccelerometerCard />);
    expect(getByText('Accelerometer')).toBeTruthy();
    expect(getByTestId('readout-x').props.children).toBe('x: 0.100');
    expect(getByTestId('readout-y').props.children).toBe('y: 0.200');
    expect(getByTestId('readout-z').props.children).toBe('z: 0.980');
    expect(getByTestId('sample-rate-picker')).toBeTruthy();
    expect(getByTestId('start-stop-button')).toBeTruthy();
    expect(getByTestId('bar-chart')).toBeTruthy();
  });

  it('SampleRatePicker defaults to 60 Hz; pressing 120 Hz re-renders with rate=120', () => {
    const { getByTestId } = render(<AccelerometerCard />);
    expect(getByTestId('sample-rate-60').props.accessibilityState.selected).toBe(true);
    fireEvent.press(getByTestId('sample-rate-120'));
    const lastCall = useSensorStreamMock.mock.calls.at(-1);
    expect(lastCall?.[0].rate).toBe(120);
  });

  it('Start button calls stream.start()', () => {
    const { getByTestId } = render(<AccelerometerCard />);
    fireEvent.press(getByTestId('start-stop-button'));
    expect(mockStream.start).toHaveBeenCalledTimes(1);
  });

  it('When isRunning=true, button label is "Stop" and pressing it calls stop()', () => {
    mockStream.isRunning = true;
    const { getByTestId, getByText } = render(<AccelerometerCard />);
    expect(getByText('Stop')).toBeTruthy();
    fireEvent.press(getByTestId('start-stop-button'));
    expect(mockStream.stop).toHaveBeenCalledTimes(1);
  });

  it('Mounts the BarChart with the snapshot', () => {
    const { getByTestId } = render(<AccelerometerCard />);
    expect(getByTestId('bar-chart')).toBeTruthy();
    expect(mockStream.snapshot).toHaveBeenCalled();
  });
});
