/**
 * useBleCentral hook — unit tests (T015).
 * Feature: 035-core-bluetooth
 *
 * The bridge module is mocked at the import boundary (FR-021); the mock
 * exposes a controllable emitter so the test can drive
 * `peripheralDiscovered`, `connectionStateChange`, and
 * `characteristicValue` events by hand.
 */

import { act, renderHook } from '@testing-library/react-native';

type Listener = (payload: unknown) => void;
const listeners: Record<string, Set<Listener>> = {};

function emit(event: string, payload: unknown): void {
  listeners[event]?.forEach((l) => l(payload));
}

jest.mock('@/native/ble-central', () => ({
  getState: jest.fn(() => 'unknown'),
  isAvailable: jest.fn(() => true),
  requestPermission: jest.fn(() => Promise.resolve('granted')),
  startScan: jest.fn(() => Promise.resolve()),
  stopScan: jest.fn(() => Promise.resolve()),
  connect: jest.fn(() => Promise.resolve()),
  disconnect: jest.fn(() => Promise.resolve()),
  discoverServices: jest.fn(() => Promise.resolve([])),
  discoverCharacteristics: jest.fn(() => Promise.resolve([])),
  readCharacteristic: jest.fn(() => Promise.resolve({ bytesHex: 'ab', byteLength: 1 })),
  writeCharacteristic: jest.fn(() => Promise.resolve({ byteLength: 1 })),
  subscribeCharacteristic: jest.fn(() => Promise.resolve()),
  unsubscribeCharacteristic: jest.fn(() => Promise.resolve()),
  emitter: {
    on(event: string, handler: Listener) {
      if (!listeners[event]) listeners[event] = new Set();
      listeners[event].add(handler);
      return () => {
        listeners[event].delete(handler);
      };
    },
  },
}));

import * as bridge from '@/native/ble-central';
import { useBleCentral } from '@/modules/bluetooth-lab/hooks/useBleCentral';

describe('useBleCentral', () => {
  beforeEach(() => {
    for (const k of Object.keys(listeners)) delete listeners[k];
    jest.clearAllMocks();
  });

  it('mounts with default state', () => {
    const { result } = renderHook(() => useBleCentral());
    expect(result.current.central).toBe('unknown');
    expect(result.current.permission).toBe('undetermined');
    expect(result.current.scan).toBe('idle');
    expect(result.current.discovered).toEqual([]);
    expect(result.current.connected).toBeNull();
    expect(result.current.lastError).toBeNull();
  });

  it('subscribes to the bridge emitter on mount', () => {
    renderHook(() => useBleCentral());
    expect(listeners.stateChange?.size).toBe(1);
    expect(listeners.peripheralDiscovered?.size).toBe(1);
    expect(listeners.connectionStateChange?.size).toBe(1);
    expect(listeners.characteristicValue?.size).toBe(1);
  });

  it('updates central state when stateChange fires', () => {
    const { result } = renderHook(() => useBleCentral());
    act(() => {
      emit('stateChange', { state: 'poweredOn' });
    });
    expect(result.current.central).toBe('poweredOn');
  });

  it('rejects setScan(true) when not poweredOn (no-op + lastError)', () => {
    const { result } = renderHook(() => useBleCentral());
    act(() => {
      result.current.setScan(true);
    });
    expect(result.current.scan).toBe('idle');
    expect(result.current.lastError).toMatch(/not powered on/i);
  });

  it('starts scanning when setScan(true) and central is poweredOn', async () => {
    const { result } = renderHook(() => useBleCentral());
    act(() => {
      emit('stateChange', { state: 'poweredOn' });
    });
    await act(async () => {
      result.current.setScan(true);
    });
    expect(result.current.scan).toBe('scanning');
    expect(bridge.startScan).toHaveBeenCalled();
  });

  it('rejects invalid UUIDs in setFilter', () => {
    const { result } = renderHook(() => useBleCentral());
    act(() => {
      result.current.setFilter('not-a-uuid');
    });
    expect(result.current.lastError).toMatch(/invalid uuid/i);
    expect(result.current.scanFilter).toEqual([]);
  });

  it('accepts 4-char short and 36-char full UUIDs', () => {
    const { result } = renderHook(() => useBleCentral());
    act(() => {
      result.current.setFilter('180f, 0000180a-0000-1000-8000-00805f9b34fb');
    });
    expect(result.current.lastError).toBeNull();
    expect(result.current.scanFilter).toEqual(['180f', '0000180a-0000-1000-8000-00805f9b34fb']);
  });

  it('builds discovered list from peripheralDiscovered events', () => {
    const { result } = renderHook(() => useBleCentral());
    act(() => {
      emit('peripheralDiscovered', {
        peripheral: {
          id: 'a',
          name: 'a-name',
          rssi: -40,
          serviceUUIDs: [],
          lastSeen: Date.now(),
        },
      });
    });
    expect(result.current.discovered).toHaveLength(1);
    expect(result.current.discovered[0].id).toBe('a');
  });

  it('connect → discover services flow populates connected snapshot', async () => {
    (bridge.discoverServices as jest.Mock).mockResolvedValueOnce([
      { id: 's1', uuid: '180f', isWellKnown: true, characteristics: [] },
    ]);
    (bridge.discoverCharacteristics as jest.Mock).mockResolvedValueOnce([
      { id: 'c1', uuid: '2a19', serviceId: 's1', properties: ['read'], isSubscribed: false },
    ]);
    const { result } = renderHook(() => useBleCentral());
    act(() => {
      emit('stateChange', { state: 'poweredOn' });
      emit('peripheralDiscovered', {
        peripheral: {
          id: 'p1',
          name: 'p',
          rssi: -40,
          serviceUUIDs: [],
          lastSeen: Date.now(),
        },
      });
    });
    await act(async () => {
      await result.current.connect('p1');
    });
    expect(result.current.connected).not.toBeNull();
    expect(result.current.connected?.connectionState).toBe('connected');
    expect(result.current.connected?.services).toHaveLength(1);
    expect(result.current.connected?.services[0].characteristics).toHaveLength(1);
  });

  it('action functions are stable across renders', () => {
    const { result, rerender } = renderHook(() => useBleCentral());
    const { setScan, setFilter, connect, disconnect, read, write, subscribe, unsubscribe } =
      result.current;
    rerender(undefined);
    expect(result.current.setScan).toBe(setScan);
    expect(result.current.setFilter).toBe(setFilter);
    expect(result.current.connect).toBe(connect);
    expect(result.current.disconnect).toBe(disconnect);
    expect(result.current.read).toBe(read);
    expect(result.current.write).toBe(write);
    expect(result.current.subscribe).toBe(subscribe);
    expect(result.current.unsubscribe).toBe(unsubscribe);
  });

  it('unmount detaches every listener (no callback fires after unmount)', () => {
    const { unmount } = renderHook(() => useBleCentral());
    expect(listeners.stateChange?.size).toBe(1);
    unmount();
    expect(listeners.stateChange?.size).toBe(0);
    expect(listeners.peripheralDiscovered?.size).toBe(0);
    expect(listeners.connectionStateChange?.size).toBe(0);
    expect(listeners.characteristicValue?.size).toBe(0);
  });

  it('classifies BleNotSupported / BleNotAuthorized into lastError captions', async () => {
    const { BleNotAuthorized: AuthErr } = jest.requireActual('@/native/ble-central.types');
    (bridge.requestPermission as jest.Mock).mockRejectedValueOnce(new AuthErr('denied'));
    const { result } = renderHook(() => useBleCentral());
    await act(async () => {
      await result.current.requestPermission();
    });
    expect(result.current.lastError).toMatch(/denied/i);
  });
});
