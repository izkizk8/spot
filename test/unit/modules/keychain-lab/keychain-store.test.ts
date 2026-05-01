/**
 * @jest-environment jsdom
 */

// Import store after mocks are set up
let keychainStore: typeof import('@/modules/keychain-lab/keychain-store');

describe('keychain-store', () => {
  let consoleWarnSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.resetModules();

    const mock = require('@test/__mocks__/native-keychain');
    mock.__reset();

    // Set up console spies fresh for each test
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    keychainStore = require('@/modules/keychain-lab/keychain-store');
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('list', () => {
    it('reads the metadata index from spot.keychain.lab.index', async () => {
      // Pre-populate the index
      const index = {
        version: 1,
        items: [
          {
            id: 'key1',
            label: 'key1',
            accessibilityClass: 'whenUnlocked' as const,
            biometryRequired: false,
            createdAt: '2026-01-01T00:00:00.000Z',
          },
        ],
      };

      const mock = require('@test/__mocks__/native-keychain');
      mock.__setNextResult({ kind: 'ok', value: JSON.stringify(index) });

      const items = await keychainStore.list();

      expect(items).toHaveLength(1);
      expect(items![0].label).toBe('key1');
      expect(items![0].accessibilityClass).toBe('whenUnlocked');

      const calls = mock.__getCallHistory();
      expect(calls[0].method).toBe('getItem');
      expect(calls[0].label).toBe('spot.keychain.lab.index');
    });

    it('returns null if the index read throws', async () => {
      consoleWarnSpy.mockClear();

      const mock = require('@test/__mocks__/native-keychain');
      mock.__setNextResult({ kind: 'error', message: 'Keychain locked' });

      const items = await keychainStore.list();

      expect(items).toBeNull();
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to read keychain index'),
        expect.anything(),
      );
    });

    it('returns empty array if index not found', async () => {
      const mock = require('@test/__mocks__/native-keychain');
      mock.__setNextResult({ kind: 'not-found' });

      const items = await keychainStore.list();

      expect(items).toEqual([]);
    });

    it('never includes the value field in the index', async () => {
      const mock = require('@test/__mocks__/native-keychain');

      // Add an item with a value
      await keychainStore.add({
        label: 'secret-key',
        value: 'super-secret-value',
        accessibilityClass: 'whenUnlocked',
        biometryRequired: false,
      });

      // Read the index back from the mock store (use the same mock instance)
      const getResult = await mock.keychain.getItem({
        label: 'spot.keychain.lab.index',
      });

      expect(getResult.kind).toBe('ok');
      // Only parse and check if we got 'ok' (assertion already made above)
      const index = JSON.parse((getResult as any).value!);
      expect(index.items.every((item: any) => !('value' in item))).toBe(true);
    });
  });

  describe('add', () => {
    it('writes the item and updates the metadata index', async () => {
      await keychainStore.add({
        label: 'test-key',
        value: 'test-value',
        accessibilityClass: 'whenUnlockedThisDeviceOnly',
        biometryRequired: true,
      });

      const mock = require('@test/__mocks__/native-keychain');
      const calls = mock.__getCallHistory();

      // Should have called addItem for the actual secret
      const addCall = calls.find((c: any) => c.method === 'addItem' && c.label === 'test-key');
      expect(addCall).toBeDefined();
      expect(addCall?.accessibleConstant).toBe('kSecAttrAccessibleWhenUnlockedThisDeviceOnly');
      expect(addCall?.biometryRequired).toBe(true);

      // Should have updated the index
      const items = await keychainStore.list();
      expect(items).toHaveLength(1);
      expect(items![0].label).toBe('test-key');
      expect(items![0].accessibilityClass).toBe('whenUnlockedThisDeviceOnly');
      expect(items![0].biometryRequired).toBe(true);
      expect(items![0].createdAt).toBeTruthy();
    });

    it('performs upsert on duplicate label', async () => {
      await keychainStore.add({
        label: 'dup-key',
        value: 'first-value',
        accessibilityClass: 'whenUnlocked',
        biometryRequired: false,
      });

      await keychainStore.add({
        label: 'dup-key',
        value: 'second-value',
        accessibilityClass: 'afterFirstUnlock',
        biometryRequired: true,
      });

      const items = await keychainStore.list();
      expect(items).toHaveLength(1);
      expect(items![0].label).toBe('dup-key');
      expect(items![0].accessibilityClass).toBe('afterFirstUnlock');
      expect(items![0].biometryRequired).toBe(true);

      // Verify the value was updated
      const getResult = await keychainStore.get('dup-key');
      expect(getResult).toBe('second-value');
    });

    it('preserves createdAt on upsert', async () => {
      await keychainStore.add({
        label: 'time-key',
        value: 'v1',
        accessibilityClass: 'whenUnlocked',
        biometryRequired: false,
      });

      const items1 = await keychainStore.list();
      const originalCreatedAt = items1![0].createdAt;

      // Wait a bit and update
      await new Promise((resolve) => setTimeout(resolve, 10));

      await keychainStore.add({
        label: 'time-key',
        value: 'v2',
        accessibilityClass: 'whenUnlocked',
        biometryRequired: false,
      });

      const items2 = await keychainStore.list();
      expect(items2![0].createdAt).toBe(originalCreatedAt);
    });

    it('tolerates bridge errors with a single console.warn', async () => {
      consoleWarnSpy.mockClear();

      const mock = require('@test/__mocks__/native-keychain');
      mock.__setNextResult({ kind: 'error', message: 'Keychain full' });

      await keychainStore.add({
        label: 'fail-key',
        value: 'fail-value',
        accessibilityClass: 'whenUnlocked',
        biometryRequired: false,
      });

      expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to add item'),
        expect.anything(),
      );
    });

    it('produces zero warns/errors on cancellation', async () => {
      consoleWarnSpy.mockClear();
      consoleErrorSpy.mockClear();

      const mock = require('@test/__mocks__/native-keychain');
      mock.__setNextResult({ kind: 'cancelled' });

      await keychainStore.add({
        label: 'cancel-key',
        value: 'cancel-value',
        accessibilityClass: 'whenUnlocked',
        biometryRequired: false,
      });

      expect(consoleWarnSpy).not.toHaveBeenCalled();
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });
  });

  describe('get', () => {
    it('returns the cleartext value from the keychain', async () => {
      await keychainStore.add({
        label: 'get-key',
        value: 'secret-value',
        accessibilityClass: 'whenUnlocked',
        biometryRequired: false,
      });

      const value = await keychainStore.get('get-key');
      expect(value).toBe('secret-value');
    });

    it('returns null if item not found', async () => {
      const value = await keychainStore.get('nonexistent');
      expect(value).toBeNull();
    });

    it('tolerates bridge errors with a single console.warn', async () => {
      consoleWarnSpy.mockClear();

      const mock = require('@test/__mocks__/native-keychain');
      mock.__setNextResult({ kind: 'error', message: 'Keychain error' });

      const value = await keychainStore.get('error-key');

      expect(value).toBeNull();
      expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('delete', () => {
    it('removes the item and updates the index', async () => {
      await keychainStore.add({
        label: 'del-key',
        value: 'del-value',
        accessibilityClass: 'whenUnlocked',
        biometryRequired: false,
      });

      await keychainStore.deleteItem('del-key');

      const items = await keychainStore.list();
      expect(items).toHaveLength(0);

      const mock = require('@test/__mocks__/native-keychain');
      const calls = mock.__getCallHistory();
      const delCall = calls.find((c: any) => c.method === 'deleteItem' && c.label === 'del-key');
      expect(delCall).toBeDefined();
    });

    it('is idempotent when item not found', async () => {
      consoleWarnSpy.mockClear();

      await keychainStore.deleteItem('nonexistent');

      // No warning for not-found (idempotent delete)
      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });

    it('tolerates bridge errors with a single console.warn', async () => {
      consoleWarnSpy.mockClear();

      const mock = require('@test/__mocks__/native-keychain');
      mock.__setNextResult({ kind: 'error', message: 'Delete failed' });

      await keychainStore.deleteItem('fail-key');

      expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('tryAccessGroupProbe', () => {
    it('delegates to the bridge', async () => {
      const mock = require('@test/__mocks__/native-keychain');
      mock.__setNextResult({ kind: 'ok', value: { bytes: 42 } });

      const result = await keychainStore.tryAccessGroupProbe('group.test');

      expect(result.kind).toBe('ok');
      const value = result.kind === 'ok' ? result.value : undefined;
      expect(value).toEqual({ bytes: 42 });

      const calls = mock.__getCallHistory();
      expect(calls[0].method).toBe('tryAccessGroupProbe');
      expect(calls[0].accessGroup).toBe('group.test');
    });

    it('returns missing-entitlement without console.error', async () => {
      consoleErrorSpy.mockClear();

      const mock = require('@test/__mocks__/native-keychain');
      mock.__setNextResult({ kind: 'missing-entitlement' });

      const result = await keychainStore.tryAccessGroupProbe('group.test');

      expect(result.kind).toBe('missing-entitlement');
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });
  });
});
