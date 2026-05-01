/**
 * useHomeKit hook tests.
 * Feature: 044-homekit
 *
 * The native HomeKit bridge is mocked at the import boundary via
 * `__setHomeKitBridgeForTests`. The hook never touches a real native
 * module. Tests cover: init success, init error, home auto-select,
 * accessories refresh on selection change, characteristic read /
 * write, observer subscribe / unsubscribe / counter increment,
 * unmount cleanup.
 *
 * @jest-environment jsdom
 */

import React from 'react';
import { act, render } from '@testing-library/react-native';

import {
  __setHomeKitBridgeForTests,
  useHomeKit,
  type UseHomeKitReturn,
} from '@/modules/homekit-lab/hooks/useHomeKit';
import type { AccessoryRecord, HomeKitBridge, HomeRecord } from '@/native/homekit.types';

const HOMES: readonly HomeRecord[] = [
  { id: 'h1', name: 'Cabin', isPrimary: true, rooms: [{ id: 'r1', name: 'Living' }] },
  { id: 'h2', name: 'Apt', isPrimary: false, rooms: [] },
];

const ACCESSORIES: readonly AccessoryRecord[] = [
  {
    id: 'a1',
    homeId: 'h1',
    roomId: 'r1',
    roomName: 'Living',
    name: 'Lamp',
    reachable: true,
    characteristics: [{ id: 'c1', serviceId: 's1', name: 'Power', kind: 'bool', writable: true }],
  },
];

interface MockBridge extends HomeKitBridge {
  isAvailable: jest.Mock;
  getAuthStatus: jest.Mock;
  requestAccess: jest.Mock;
  getHomes: jest.Mock;
  getAccessories: jest.Mock;
  readCharacteristic: jest.Mock;
  writeCharacteristic: jest.Mock;
  observeCharacteristic: jest.Mock;
}

function makeBridge(): MockBridge {
  return {
    isAvailable: jest.fn(() => true),
    getAuthStatus: jest.fn(async () => 'authorized'),
    requestAccess: jest.fn(async () => 'authorized'),
    getHomes: jest.fn(async () => HOMES),
    getAccessories: jest.fn(async (_homeId: string) => ACCESSORIES),
    readCharacteristic: jest.fn(async () => true),
    writeCharacteristic: jest.fn(async () => undefined),
    observeCharacteristic: jest.fn(() => () => {}),
  };
}

interface Handle {
  current: UseHomeKitReturn | null;
}

const handle: Handle = { current: null };

function Harness() {
  const hk = useHomeKit();
  React.useEffect(() => {
    handle.current = hk;
  });
  return null;
}

let bridge: MockBridge;

beforeEach(() => {
  bridge = makeBridge();
  __setHomeKitBridgeForTests(bridge);
  handle.current = null;
});

afterEach(() => {
  __setHomeKitBridgeForTests(null);
  jest.clearAllMocks();
});

async function flush() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
  });
}

describe('useHomeKit — init', () => {
  it('starts with notDetermined / not initialised', async () => {
    render(<Harness />);
    expect(handle.current?.authStatus).toBe('notDetermined');
    expect(handle.current?.initialised).toBe(false);
    expect(handle.current?.homes).toEqual([]);
    await act(async () => {});
  });

  it('init() loads homes and auto-selects the primary', async () => {
    render(<Harness />);
    await act(async () => {
      await handle.current?.init();
    });
    await flush();
    expect(handle.current?.initialised).toBe(true);
    expect(handle.current?.authStatus).toBe('authorized');
    expect(handle.current?.homes).toEqual(HOMES);
    expect(handle.current?.selectedHomeId).toBe('h1');
    expect(handle.current?.available).toBe(true);
  });

  it('init() captures bridge errors into lastError', async () => {
    bridge.requestAccess.mockRejectedValueOnce(new Error('boom'));
    render(<Harness />);
    await act(async () => {
      await handle.current?.init();
    });
    expect(handle.current?.lastError).toBe('boom');
    expect(handle.current?.initialised).toBe(false);
  });

  it('init() with denied status does not load homes', async () => {
    bridge.requestAccess.mockResolvedValueOnce('denied');
    render(<Harness />);
    await act(async () => {
      await handle.current?.init();
    });
    expect(handle.current?.authStatus).toBe('denied');
    expect(handle.current?.initialised).toBe(true);
    expect(handle.current?.homes).toEqual([]);
    expect(bridge.getHomes).not.toHaveBeenCalled();
  });

  it('falls back to first home when no primary exists', async () => {
    bridge.getHomes.mockResolvedValueOnce([
      { id: 'x1', name: 'Only', isPrimary: false, rooms: [] },
    ]);
    render(<Harness />);
    await act(async () => {
      await handle.current?.init();
    });
    await flush();
    expect(handle.current?.selectedHomeId).toBe('x1');
  });
});

describe('useHomeKit — selection / accessories', () => {
  it('refreshes accessories when a home is selected', async () => {
    render(<Harness />);
    await act(async () => {
      await handle.current?.init();
    });
    await flush();
    expect(bridge.getAccessories).toHaveBeenCalledWith('h1');
    expect(handle.current?.accessories).toEqual(ACCESSORIES);
  });

  it('selectHome resets accessory + characteristic selection', async () => {
    render(<Harness />);
    await act(async () => {
      await handle.current?.init();
    });
    await flush();
    await act(async () => {
      handle.current?.selectAccessory('a1');
      handle.current?.selectCharacteristic('c1');
    });
    expect(handle.current?.selectedAccessoryId).toBe('a1');
    expect(handle.current?.selectedCharacteristicId).toBe('c1');
    await act(async () => {
      handle.current?.selectHome('h2');
    });
    expect(handle.current?.selectedHomeId).toBe('h2');
    expect(handle.current?.selectedAccessoryId).toBeNull();
    expect(handle.current?.selectedCharacteristicId).toBeNull();
  });

  it('selectHome(null) clears accessories', async () => {
    render(<Harness />);
    await act(async () => {
      await handle.current?.init();
    });
    await flush();
    await act(async () => {
      handle.current?.selectHome(null);
    });
    expect(handle.current?.accessories).toEqual([]);
  });

  it('captures getAccessories errors into lastError', async () => {
    bridge.getAccessories.mockRejectedValueOnce(new Error('oops'));
    render(<Harness />);
    await act(async () => {
      await handle.current?.init();
    });
    await flush();
    expect(handle.current?.lastError).toBe('oops');
  });
});

describe('useHomeKit — read / write', () => {
  it('readValue calls bridge and stores the result', async () => {
    render(<Harness />);
    await act(async () => {
      await handle.current?.init();
    });
    await flush();
    await act(async () => {
      handle.current?.selectAccessory('a1');
      handle.current?.selectCharacteristic('c1');
    });
    await act(async () => {
      await handle.current?.readValue();
    });
    expect(bridge.readCharacteristic).toHaveBeenCalledWith('a1', 'c1');
    expect(handle.current?.lastReadValue).toBe(true);
  });

  it('writeValue calls bridge and remembers the written value', async () => {
    render(<Harness />);
    await act(async () => {
      await handle.current?.init();
    });
    await flush();
    await act(async () => {
      handle.current?.selectAccessory('a1');
      handle.current?.selectCharacteristic('c1');
    });
    await act(async () => {
      await handle.current?.writeValue(true);
    });
    expect(bridge.writeCharacteristic).toHaveBeenCalledWith('a1', 'c1', true);
    expect(handle.current?.lastReadValue).toBe(true);
  });

  it('writeValue without selection records a lastError', async () => {
    render(<Harness />);
    await act(async () => {
      await handle.current?.writeValue(false);
    });
    expect(handle.current?.lastError).toMatch(/No characteristic/);
    expect(bridge.writeCharacteristic).not.toHaveBeenCalled();
  });

  it('readValue without selection records a lastError', async () => {
    render(<Harness />);
    await act(async () => {
      await handle.current?.readValue();
    });
    expect(handle.current?.lastError).toMatch(/No characteristic/);
  });

  it('captures readCharacteristic errors', async () => {
    bridge.readCharacteristic.mockRejectedValueOnce(new Error('rd'));
    render(<Harness />);
    await act(async () => {
      await handle.current?.init();
    });
    await flush();
    await act(async () => {
      handle.current?.selectAccessory('a1');
      handle.current?.selectCharacteristic('c1');
    });
    await act(async () => {
      await handle.current?.readValue();
    });
    expect(handle.current?.lastError).toBe('rd');
  });
});

describe('useHomeKit — observer', () => {
  it('toggleObserver subscribes, increments count, then unsubscribes', async () => {
    let captured: ((value: boolean | number | string) => void) | null = null;
    const unsubscribe = jest.fn();
    bridge.observeCharacteristic.mockImplementation((_a, _c, listener) => {
      captured = listener;
      return unsubscribe;
    });

    render(<Harness />);
    await act(async () => {
      await handle.current?.init();
    });
    await flush();
    await act(async () => {
      handle.current?.selectAccessory('a1');
      handle.current?.selectCharacteristic('c1');
    });
    await act(async () => {
      handle.current?.toggleObserver();
    });
    expect(handle.current?.observerActive).toBe(true);

    await act(async () => {
      captured?.(true);
      captured?.(false);
    });
    expect(handle.current?.observerUpdateCount).toBe(2);
    expect(handle.current?.lastReadValue).toBe(false);

    await act(async () => {
      handle.current?.toggleObserver();
    });
    expect(handle.current?.observerActive).toBe(false);
    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });

  it('toggleObserver without selection records a lastError', async () => {
    render(<Harness />);
    await act(async () => {
      handle.current?.toggleObserver();
    });
    expect(handle.current?.lastError).toMatch(/No characteristic/);
  });

  it('reset() tears down the observer and clears counters', async () => {
    const unsubscribe = jest.fn();
    bridge.observeCharacteristic.mockImplementation(() => unsubscribe);
    render(<Harness />);
    await act(async () => {
      await handle.current?.init();
    });
    await flush();
    await act(async () => {
      handle.current?.selectAccessory('a1');
      handle.current?.selectCharacteristic('c1');
    });
    await act(async () => {
      handle.current?.toggleObserver();
    });
    expect(handle.current?.observerActive).toBe(true);
    await act(async () => {
      handle.current?.reset();
    });
    expect(handle.current?.observerActive).toBe(false);
    expect(handle.current?.observerUpdateCount).toBe(0);
    expect(handle.current?.lastError).toBeNull();
    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });

  it('tears the observer down on unmount', async () => {
    const unsubscribe = jest.fn();
    bridge.observeCharacteristic.mockImplementation(() => unsubscribe);
    const { unmount } = render(<Harness />);
    await act(async () => {
      await handle.current?.init();
    });
    await flush();
    await act(async () => {
      handle.current?.selectAccessory('a1');
      handle.current?.selectCharacteristic('c1');
    });
    await act(async () => {
      handle.current?.toggleObserver();
    });
    unmount();
    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });
});
