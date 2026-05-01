/**
 * @file useSensorStream.test.tsx
 * @description Contract tests for useSensorStream seam (T006).
 */
import { act, renderHook, waitFor } from '@testing-library/react-native';

const makeSensor = () => ({
  isAvailableAsync: jest.fn(async () => true),
  setUpdateInterval: jest.fn(),
  addListener: jest.fn(() => ({ remove: jest.fn() })),
  getPermissionsAsync: jest.fn(async () => ({
    status: 'granted',
    granted: true,
    canAskAgain: true,
    expires: 'never',
  })),
  requestPermissionsAsync: jest.fn(async () => ({
    status: 'granted',
    granted: true,
    canAskAgain: true,
    expires: 'never',
  })),
});

jest.mock('expo-sensors', () => ({
  Accelerometer: makeSensor(),
  Gyroscope: makeSensor(),
  Magnetometer: makeSensor(),
  DeviceMotion: makeSensor(),
}));

import { useSensorStream } from '@/modules/sensors-playground/hooks/useSensorStream';

type SensorMock = ReturnType<typeof makeSensor>;

function makeFreshSensor(overrides: Partial<SensorMock> = {}): SensorMock {
  const sub = { remove: jest.fn() };
  const base: SensorMock = {
    isAvailableAsync: jest.fn(async () => true),
    setUpdateInterval: jest.fn(),
    addListener: jest.fn(() => sub),
    getPermissionsAsync: jest.fn(async () => ({
      status: 'granted',
      granted: true,
      canAskAgain: true,
      expires: 'never',
    })),
    requestPermissionsAsync: jest.fn(async () => ({
      status: 'granted',
      granted: true,
      canAskAgain: true,
      expires: 'never',
    })),
  };
  return { ...base, ...overrides } as SensorMock;
}

describe('useSensorStream', () => {
  it('available + no permission needed: start() attaches listener and sets interval', async () => {
    const sensor = makeFreshSensor();
    const { result } = renderHook(() =>
      useSensorStream({
        sensor,
        mapSample: (raw) => raw as { x: number; y: number; z: number },
        requiresPermission: false,
        rate: 60,
      }),
    );
    await waitFor(() => expect(result.current.isAvailable).toBe(true));
    await act(async () => {
      await result.current.start();
    });
    expect(sensor.addListener).toHaveBeenCalledTimes(1);
    expect(sensor.setUpdateInterval).toHaveBeenCalledWith(1000 / 60);
    expect(result.current.isRunning).toBe(true);
  });

  it('isAvailableAsync returns false: isAvailable=false; start() is no-op', async () => {
    const sensor = makeFreshSensor({
      isAvailableAsync: jest.fn(async () => false),
    } as Partial<SensorMock>);
    const { result } = renderHook(() =>
      useSensorStream({
        sensor,
        mapSample: (raw) => raw,
        requiresPermission: false,
        rate: 60,
      }),
    );
    await waitFor(() => expect(result.current.isAvailable).toBe(false));
    await act(async () => {
      await result.current.start();
    });
    expect(sensor.addListener).not.toHaveBeenCalled();
  });

  it('isAvailableAsync throws: treated as unavailable, no unhandled rejection', async () => {
    const sensor = makeFreshSensor({
      isAvailableAsync: jest.fn(async () => {
        throw new Error('nope');
      }),
    } as Partial<SensorMock>);
    const { result } = renderHook(() =>
      useSensorStream({
        sensor,
        mapSample: (raw) => raw,
        requiresPermission: false,
        rate: 60,
      }),
    );
    await waitFor(() => expect(result.current.isAvailable).toBe(false));
    await act(async () => {
      await result.current.start();
    });
    expect(sensor.addListener).not.toHaveBeenCalled();
  });

  it('permission undetermined → start() requests; granted attaches listener', async () => {
    const sensor = makeFreshSensor({
      getPermissionsAsync: jest.fn(async () => ({
        status: 'undetermined',
        granted: false,
        canAskAgain: true,
        expires: 'never',
      })),
      requestPermissionsAsync: jest.fn(async () => ({
        status: 'granted',
        granted: true,
        canAskAgain: true,
        expires: 'never',
      })),
    } as Partial<SensorMock>);
    const { result } = renderHook(() =>
      useSensorStream({
        sensor,
        mapSample: (raw) => raw,
        requiresPermission: true,
        rate: 60,
      }),
    );
    await waitFor(() => expect(result.current.permissionState).toBe('undetermined'));
    await act(async () => {
      await result.current.start();
    });
    expect(sensor.requestPermissionsAsync).toHaveBeenCalledTimes(1);
    expect(sensor.addListener).toHaveBeenCalledTimes(1);
  });

  it('permission denied: start() does not subscribe', async () => {
    const sensor = makeFreshSensor({
      getPermissionsAsync: jest.fn(async () => ({
        status: 'denied',
        granted: false,
        canAskAgain: false,
        expires: 'never',
      })),
    } as Partial<SensorMock>);
    const { result } = renderHook(() =>
      useSensorStream({
        sensor,
        mapSample: (raw) => raw,
        requiresPermission: true,
        rate: 60,
      }),
    );
    await waitFor(() => expect(result.current.permissionState).toBe('denied'));
    await act(async () => {
      await result.current.start();
    });
    expect(sensor.addListener).not.toHaveBeenCalled();
  });

  it('rate change while running: setUpdateInterval re-called, addListener NOT re-called', async () => {
    const sensor = makeFreshSensor();
    let rate: 30 | 60 | 120 = 60;
    const { result, rerender } = renderHook(() =>
      useSensorStream({
        sensor,
        mapSample: (raw) => raw,
        requiresPermission: false,
        rate,
      }),
    );
    await waitFor(() => expect(result.current.isAvailable).toBe(true));
    await act(async () => {
      await result.current.start();
    });
    expect(sensor.addListener).toHaveBeenCalledTimes(1);
    sensor.setUpdateInterval.mockClear();
    rate = 120;
    rerender({});
    expect(sensor.setUpdateInterval).toHaveBeenCalledWith(1000 / 120);
    expect(sensor.addListener).toHaveBeenCalledTimes(1);
  });

  it('sample handler updates latest and pushes into ring buffer', async () => {
    const sensor = makeFreshSensor();
    const { result } = renderHook(() =>
      useSensorStream({
        sensor,
        mapSample: (raw) => raw as { v: number },
        requiresPermission: false,
        rate: 60,
      }),
    );
    await waitFor(() => expect(result.current.isAvailable).toBe(true));
    await act(async () => {
      await result.current.start();
    });
    const handler = (sensor.addListener.mock.calls[0] as unknown as [(raw: unknown) => void])[0];
    await act(async () => {
      handler({ v: 1 });
      handler({ v: 2 });
      handler({ v: 3 });
    });
    expect(result.current.latest).toEqual({ v: 3 });
    expect(result.current.snapshot(3)).toEqual([{ v: 1 }, { v: 2 }, { v: 3 }]);
  });

  it('subscribeToSnapshot fires per sample; unsubscribe stops it', async () => {
    const sensor = makeFreshSensor();
    const { result } = renderHook(() =>
      useSensorStream({
        sensor,
        mapSample: (raw) => raw,
        requiresPermission: false,
        rate: 60,
      }),
    );
    await waitFor(() => expect(result.current.isAvailable).toBe(true));
    await act(async () => {
      await result.current.start();
    });
    const handler = (sensor.addListener.mock.calls[0] as unknown as [(raw: unknown) => void])[0];
    const listener = jest.fn();
    const unsub = result.current.subscribeToSnapshot(listener);
    await act(async () => {
      handler({});
      handler({});
    });
    expect(listener).toHaveBeenCalledTimes(2);
    unsub();
    await act(async () => {
      handler({});
    });
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it('stop(): subscription.remove() called, isRunning false, ring buffer NOT cleared', async () => {
    const sensor = makeFreshSensor();
    const { result } = renderHook(() =>
      useSensorStream({
        sensor,
        mapSample: (raw) => raw as { v: number },
        requiresPermission: false,
        rate: 60,
      }),
    );
    await waitFor(() => expect(result.current.isAvailable).toBe(true));
    await act(async () => {
      await result.current.start();
    });
    const sub = sensor.addListener.mock.results[0]!.value;
    const handler = (sensor.addListener.mock.calls[0] as unknown as [(raw: unknown) => void])[0];
    await act(async () => {
      handler({ v: 1 });
    });
    await act(async () => {
      result.current.stop();
    });
    expect(sub.remove).toHaveBeenCalledTimes(1);
    expect(result.current.isRunning).toBe(false);
    expect(result.current.snapshot(1)).toEqual([{ v: 1 }]); // not cleared
  });

  it('unmount while running: subscription.remove() called', async () => {
    const sensor = makeFreshSensor();
    const { result, unmount } = renderHook(() =>
      useSensorStream({
        sensor,
        mapSample: (raw) => raw,
        requiresPermission: false,
        rate: 60,
      }),
    );
    await waitFor(() => expect(result.current.isAvailable).toBe(true));
    await act(async () => {
      await result.current.start();
    });
    const sub = sensor.addListener.mock.results[0]!.value;
    unmount();
    expect(sub.remove).toHaveBeenCalledTimes(1);
  });
});
