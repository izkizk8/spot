/**
 * BLE Central bridge — unit tests (T005).
 * Feature: 035-core-bluetooth
 *
 * Exercises invariants documented in
 * `contracts/ble-central-bridge.md`. The upstream `react-native-ble-plx`
 * library is mocked at the import boundary (FR-021) via `test/setup.ts`;
 * the only file in the project that imports it is the bridge itself.
 *
 * Platform-specific behaviour (iOS<13 short-circuit, Android API-level
 * permission set) is exercised end-to-end through the hook tests
 * (`useBleCentral.test.tsx`) where the bridge is mocked at the import
 * boundary; here we focus on the contract surface and the SC-007
 * static-import assertion (Web bundle does NOT pull in the iOS bridge
 * at evaluation time).
 */

import {
  BleNotAuthorized,
  BleNotPoweredOn,
  BleNotSupported,
  BleOperationFailed,
  NATIVE_MODULE_NAME,
} from '@/native/ble-central.types';

async function expectRejectsWithName(p: Promise<unknown>, expectedName: string) {
  let captured: { name?: string } | null = null;
  try {
    await p;
  } catch (e) {
    captured = e as { name?: string };
  }
  expect(captured).not.toBeNull();
  expect(captured?.name).toBe(expectedName);
}

describe('ble-central bridge — types', () => {
  it(`exports NATIVE_MODULE_NAME = '${NATIVE_MODULE_NAME}'`, () => {
    expect(NATIVE_MODULE_NAME).toBe('BleCentralBridge');
  });

  it('typed error classes carry stable codes and names', () => {
    expect(new BleNotSupported('x')).toBeInstanceOf(BleNotSupported);
    expect(new BleNotAuthorized('x')).toBeInstanceOf(BleNotAuthorized);
    expect(new BleNotPoweredOn('x')).toBeInstanceOf(BleNotPoweredOn);
    expect(new BleOperationFailed('connection-failed', 'x').code).toBe('connection-failed');
    expect(new BleOperationFailed('failed').name).toBe('BleOperationFailed');
    expect(new BleNotSupported().name).toBe('BleNotSupported');
    expect(new BleNotAuthorized().name).toBe('BleNotAuthorized');
    expect(new BleNotPoweredOn().name).toBe('BleNotPoweredOn');
  });
});

describe('ble-central bridge — Web variant', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('rejects every async method when navigator.bluetooth is undefined', async () => {
    const originalNav = (globalThis as { navigator?: unknown }).navigator;
    (globalThis as { navigator?: unknown }).navigator = { userAgent: 'jest' };
    const web = require('@/native/ble-central.web');
    web.__resetForTests();

    expect(web.getState()).toBe('unsupported');
    expect(web.isAvailable()).toBe(false);

    async function rejectsUnsupported(p: Promise<unknown>) {
      await expectRejectsWithName(p, 'BleNotSupported');
    }

    await rejectsUnsupported(web.requestPermission());
    await rejectsUnsupported(web.startScan({ allowDuplicates: false }));
    await rejectsUnsupported(web.stopScan());
    await rejectsUnsupported(web.connect('id'));
    await rejectsUnsupported(web.disconnect('id'));
    await rejectsUnsupported(web.discoverServices('id'));
    await rejectsUnsupported(web.discoverCharacteristics('s'));
    await rejectsUnsupported(web.readCharacteristic('id'));
    await rejectsUnsupported(web.writeCharacteristic('id', new Uint8Array(), false));
    await rejectsUnsupported(web.subscribeCharacteristic('id'));
    await rejectsUnsupported(web.unsubscribeCharacteristic('id'));

    (globalThis as { navigator?: unknown }).navigator = originalNav;
  });

  it('emitter.on returns an unsubscribe handle', () => {
    const web = require('@/native/ble-central.web');
    web.__resetForTests();
    const handler = jest.fn();
    const off = web.emitter.on('stateChange', handler);
    expect(typeof off).toBe('function');
    off();
  });

  it('auto-promotes no-filter scan to acceptAllDevices: true (FR-026)', async () => {
    const requestDevice = jest.fn().mockResolvedValue({ id: 'd1', name: 'd' });
    (globalThis as { navigator?: unknown }).navigator = {
      bluetooth: { requestDevice, getAvailability: () => Promise.resolve(true) },
    };
    jest.resetModules();
    const web = require('@/native/ble-central.web');
    web.__resetForTests();
    await web.startScan({ allowDuplicates: false });
    expect(requestDevice).toHaveBeenCalledTimes(1);
    expect(requestDevice.mock.calls[0][0]).toEqual({ acceptAllDevices: true });
    (globalThis as { navigator?: unknown }).navigator = undefined;
  });

  it('passes service-UUID filters when provided', async () => {
    const requestDevice = jest.fn().mockResolvedValue({ id: 'd1', name: 'd' });
    (globalThis as { navigator?: unknown }).navigator = {
      bluetooth: { requestDevice, getAvailability: () => Promise.resolve(true) },
    };
    jest.resetModules();
    const web = require('@/native/ble-central.web');
    web.__resetForTests();
    await web.startScan({ serviceUUIDs: ['180f'], allowDuplicates: false });
    expect(requestDevice.mock.calls[0][0]).toEqual({ filters: [{ services: ['180f'] }] });
    (globalThis as { navigator?: unknown }).navigator = undefined;
  });

  it('does NOT eager-import the iOS bridge at evaluation time (SC-007)', () => {
    let importedIOS = false;
    jest.isolateModules(() => {
      jest.doMock('@/native/ble-central', () => {
        importedIOS = true;
        return {};
      });
      expect(() => {
        require('@/native/ble-central.web');
      }).not.toThrow();
    });
    expect(importedIOS).toBe(false);
  });
});

describe('ble-central bridge — iOS / Android variants surface', () => {
  it('iOS variant exports the documented public surface', () => {
    // Use an absolute path require to bypass any module-name aliasing that
    // a previous `jest.doMock(...)` may have registered in this test file.
    const ble = jest.requireActual<typeof import('../../../src/native/ble-central')>(
      '../../../src/native/ble-central',
    );
    expect(typeof ble.getState).toBe('function');
    expect(typeof ble.isAvailable).toBe('function');
    expect(typeof ble.requestPermission).toBe('function');
    expect(typeof ble.startScan).toBe('function');
    expect(typeof ble.stopScan).toBe('function');
    expect(typeof ble.connect).toBe('function');
    expect(typeof ble.disconnect).toBe('function');
    expect(typeof ble.discoverServices).toBe('function');
    expect(typeof ble.discoverCharacteristics).toBe('function');
    expect(typeof ble.readCharacteristic).toBe('function');
    expect(typeof ble.writeCharacteristic).toBe('function');
    expect(typeof ble.subscribeCharacteristic).toBe('function');
    expect(typeof ble.unsubscribeCharacteristic).toBe('function');
    expect(typeof ble.emitter.on).toBe('function');
  });

  it('Android variant exports the documented public surface', () => {
    const ble = jest.requireActual<typeof import('../../../src/native/ble-central.android')>(
      '../../../src/native/ble-central.android',
    );
    expect(typeof ble.getState).toBe('function');
    expect(typeof ble.requestPermission).toBe('function');
    expect(typeof ble.startScan).toBe('function');
    expect(typeof ble.stopScan).toBe('function');
    expect(typeof ble.connect).toBe('function');
    expect(typeof ble.disconnect).toBe('function');
    expect(typeof ble.discoverServices).toBe('function');
    expect(typeof ble.emitter.on).toBe('function');
  });
});
