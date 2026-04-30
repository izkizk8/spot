/**
 * useRoomCapture hook tests.
 * Feature: 048-lidar-roomplan
 *
 * The native RoomPlan bridge is mocked at the import boundary
 * via `__setRoomPlanBridgeForTests`. AsyncStorage is mocked
 * globally by the project's jest setup.
 *
 * @jest-environment jsdom
 */

import React from 'react';
import { act, render } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  __setRoomPlanBridgeForTests,
  useRoomCapture,
  type UseRoomCaptureReturn,
} from '@/modules/lidar-roomplan-lab/hooks/useRoomCapture';
import { STORAGE_KEY } from '@/modules/lidar-roomplan-lab/room-store';
import type {
  RoomCaptureResult,
  RoomPlanBridge,
  ScanPhase,
  ScanPhaseListener,
} from '@/native/roomplan.types';

interface MockBridge extends RoomPlanBridge {
  isSupported: jest.Mock;
  startCapture: jest.Mock;
  stopCapture: jest.Mock;
  exportUSDZ: jest.Mock;
  subscribe: jest.Mock;
  __emit(phase: ScanPhase): void;
}

function makeBridge(): MockBridge {
  let listener: ScanPhaseListener | null = null;
  const subscribe = jest.fn((cb: ScanPhaseListener) => {
    listener = cb;
    return () => {
      listener = null;
    };
  });
  const sample: RoomCaptureResult = {
    id: 'room-1',
    name: 'Office',
    dimensions: { widthM: 3, lengthM: 4, heightM: 2.5 },
    surfaces: { walls: 4, windows: 2, doors: 1, openings: 1, objects: 6 },
    createdAt: '2026-05-12T00:00:00.000Z',
    usdzPath: null,
  };
  const bridge: Partial<MockBridge> = {
    isSupported: jest.fn(() => true),
    startCapture: jest.fn(async () => sample),
    stopCapture: jest.fn(async () => undefined),
    exportUSDZ: jest.fn(async (id: string) => `file:///tmp/${id}.usdz`),
    subscribe,
    __emit(phase: ScanPhase) {
      listener?.(phase);
    },
  };
  return bridge as MockBridge;
}

interface Handle {
  current: UseRoomCaptureReturn | null;
}

const handle: Handle = { current: null };

function Harness() {
  const r = useRoomCapture();
  React.useEffect(() => {
    handle.current = r;
  });
  return null;
}

let bridge: MockBridge;

beforeEach(async () => {
  bridge = makeBridge();
  __setRoomPlanBridgeForTests(bridge);
  handle.current = null;
  await AsyncStorage.clear();
});

afterEach(() => {
  __setRoomPlanBridgeForTests(null);
  jest.clearAllMocks();
});

async function flush() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
  });
}

describe('useRoomCapture', () => {
  it('initial state mirrors empty rooms + capability snapshot', async () => {
    render(<Harness />);
    await flush();
    const r = handle.current!;
    expect(r.supported).toBe(true);
    expect(r.rooms).toEqual([]);
    expect(r.selectedRoomId).toBeNull();
    expect(r.selectedRoom).toBeNull();
    expect(r.phase).toBe('idle');
    expect(r.isScanning).toBe(false);
    expect(r.lastError).toBeNull();
    expect(bridge.subscribe).toHaveBeenCalledTimes(1);
  });

  it('hydrates rooms from AsyncStorage on mount', async () => {
    const persisted = [
      {
        id: 'r-pre',
        name: 'Persisted',
        dimensions: { widthM: 2, lengthM: 2, heightM: 2 },
        surfaces: { walls: 4, windows: 0, doors: 1, openings: 0, objects: 0 },
        createdAt: '2026-05-11T00:00:00.000Z',
        usdzPath: null,
      },
    ];
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(persisted));
    render(<Harness />);
    await flush();
    expect(handle.current!.rooms).toEqual(persisted);
  });

  it('startScan persists the room and selects it', async () => {
    render(<Harness />);
    await flush();
    await act(async () => {
      await handle.current!.startScan();
    });
    await flush();
    expect(bridge.startCapture).toHaveBeenCalledTimes(1);
    expect(handle.current!.rooms).toHaveLength(1);
    expect(handle.current!.selectedRoomId).toBe('room-1');
    expect(handle.current!.phase).toBe('completed');
    expect(handle.current!.isScanning).toBe(false);
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    expect(raw).toBeTruthy();
    expect(JSON.parse(raw as string)).toHaveLength(1);
  });

  it('startScan records lastError + transitions to error phase on rejection', async () => {
    bridge.startCapture.mockRejectedValueOnce(new Error('LiDAR unavailable'));
    render(<Harness />);
    await flush();
    await act(async () => {
      await handle.current!.startScan();
    });
    await flush();
    expect(handle.current!.lastError).toBe('LiDAR unavailable');
    expect(handle.current!.phase).toBe('error');
    expect(handle.current!.isScanning).toBe(false);
    expect(handle.current!.rooms).toEqual([]);
  });

  it('stopScan delegates to the bridge and resets phase to idle', async () => {
    render(<Harness />);
    await flush();
    await act(async () => {
      await handle.current!.stopScan();
    });
    expect(bridge.stopCapture).toHaveBeenCalledTimes(1);
    expect(handle.current!.phase).toBe('idle');
  });

  it('exportSelectedUSDZ writes the path back into the room', async () => {
    render(<Harness />);
    await flush();
    await act(async () => {
      await handle.current!.startScan();
    });
    await flush();
    await act(async () => {
      const path = await handle.current!.exportSelectedUSDZ();
      expect(path).toBe('file:///tmp/room-1.usdz');
    });
    await flush();
    expect(bridge.exportUSDZ).toHaveBeenCalledWith('room-1');
    expect(handle.current!.selectedRoom?.usdzPath).toBe('file:///tmp/room-1.usdz');
  });

  it('exportSelectedUSDZ surfaces an error when no room is selected', async () => {
    render(<Harness />);
    await flush();
    let returned: string | null = 'sentinel';
    await act(async () => {
      returned = await handle.current!.exportSelectedUSDZ();
    });
    expect(returned).toBeNull();
    expect(handle.current!.lastError).toBe('No room selected');
  });

  it('deleteRoom removes the entry and clears selection if needed', async () => {
    render(<Harness />);
    await flush();
    await act(async () => {
      await handle.current!.startScan();
    });
    await flush();
    expect(handle.current!.selectedRoomId).toBe('room-1');
    await act(async () => {
      await handle.current!.deleteRoom('room-1');
    });
    await flush();
    expect(handle.current!.rooms).toEqual([]);
    expect(handle.current!.selectedRoomId).toBeNull();
  });

  it('subscribe routes phase events into state', async () => {
    render(<Harness />);
    await flush();
    act(() => {
      bridge.__emit('processing');
    });
    await flush();
    expect(handle.current!.phase).toBe('processing');
  });

  it('reset clears lastError + phase + isScanning', async () => {
    bridge.startCapture.mockRejectedValueOnce(new Error('boom'));
    render(<Harness />);
    await flush();
    await act(async () => {
      await handle.current!.startScan();
    });
    await flush();
    expect(handle.current!.lastError).toBe('boom');
    act(() => {
      handle.current!.reset();
    });
    await flush();
    expect(handle.current!.lastError).toBeNull();
    expect(handle.current!.phase).toBe('idle');
    expect(handle.current!.isScanning).toBe(false);
  });

  it('survives bridge.isSupported throwing on mount', async () => {
    bridge.isSupported.mockImplementationOnce(() => {
      throw new Error('not loaded');
    });
    render(<Harness />);
    await flush();
    expect(handle.current!.supported).toBe(false);
  });

  it('unsubscribes on unmount', async () => {
    const remove = jest.fn();
    bridge.subscribe.mockImplementationOnce(() => remove);
    const { unmount } = render(<Harness />);
    await flush();
    unmount();
    expect(remove).toHaveBeenCalledTimes(1);
  });

  it('selectRoom changes selection and resolves selectedRoom', async () => {
    render(<Harness />);
    await flush();
    await act(async () => {
      await handle.current!.startScan();
    });
    await flush();
    act(() => {
      handle.current!.selectRoom(null);
    });
    await flush();
    expect(handle.current!.selectedRoomId).toBeNull();
    expect(handle.current!.selectedRoom).toBeNull();
    act(() => {
      handle.current!.selectRoom('room-1');
    });
    await flush();
    expect(handle.current!.selectedRoom?.id).toBe('room-1');
  });
});
