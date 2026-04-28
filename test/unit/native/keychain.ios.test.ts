/**
 * @jest-environment jsdom
 */

// Unmock the keychain module so we can test the real implementation
jest.unmock('@/native/keychain');

// Mock Platform.OS as iOS at the top - before any imports
jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
    select: jest.fn((obj: any) => obj.ios || obj.default),
  },
}));

// Mock expo-secure-store with inline implementation to avoid circular dependency
const mockStore = new Map<string, string>();
const mockCallHistory: Array<{ method: string; key: string; options?: any }> = [];
let mockShouldThrow: string | null = null;

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async (key: string, options?: any) => {
    mockCallHistory.push({ method: 'getItemAsync', key, options });
    if (mockShouldThrow === 'get' || mockShouldThrow === 'all') {
      throw new Error('SecureStore failure');
    }
    return mockStore.get(key) ?? null;
  }),
  setItemAsync: jest.fn(async (key: string, value: string, options?: any) => {
    mockCallHistory.push({ method: 'setItemAsync', key, options });
    if (mockShouldThrow === 'set' || mockShouldThrow === 'all') {
      throw new Error('SecureStore failure');
    }
    mockStore.set(key, value);
  }),
  deleteItemAsync: jest.fn(async (key: string, options?: any) => {
    mockCallHistory.push({ method: 'deleteItemAsync', key, options });
    if (mockShouldThrow === 'delete' || mockShouldThrow === 'all') {
      throw new Error('SecureStore failure');
    }
    mockStore.delete(key);
  }),
}));

// Helper to reset SecureStore mock state
function resetSecureStoreMock() {
  mockStore.clear();
  mockShouldThrow = null;
  mockCallHistory.length = 0;
}

// Mock expo-modules-core before importing keychain
let mockNativeModule: any = null;
jest.mock('expo-modules-core', () => ({
  requireOptionalNativeModule: jest.fn((moduleName: string) => {
    if (moduleName === 'SpotKeychain') {
      return mockNativeModule;
    }
    return null;
  }),
}));

describe('native/keychain (iOS with native module)', () => {
  let keychain: typeof import('@/native/keychain').keychain;
  let NativeKeychainMock: typeof import('@test/__mocks__/native-keychain');

  beforeEach(() => {
    NativeKeychainMock = require('@test/__mocks__/native-keychain');
    NativeKeychainMock.__reset();
    mockNativeModule = NativeKeychainMock.keychain;
    const keychainModule = require('@/native/keychain');
    keychain = keychainModule.keychain;
    keychainModule.__resetBridgeForTest();
  });

  it('delegates addItem to the native module', async () => {
    const input = {
      label: 'test-key',
      value: 'secret',
      accessibilityClass: 'whenUnlockedThisDeviceOnly' as const,
      biometryRequired: false,
    };

    const result = await keychain.addItem(input);

    expect(result.kind).toBe('ok');
    const calls = NativeKeychainMock.__getCallHistory();
    expect(calls).toHaveLength(1);
    expect(calls[0].method).toBe('addItem');
    expect(calls[0].label).toBe('test-key');
    expect(calls[0].accessibleConstant).toBe('kSecAttrAccessibleWhenUnlockedThisDeviceOnly');
    expect(calls[0].biometryRequired).toBe(false);
  });

  it('captures the exact kSecAttrAccessible* constant per call', async () => {
    await keychain.addItem({
      label: 'key1',
      value: 'val1',
      accessibilityClass: 'whenUnlocked',
      biometryRequired: false,
    });

    await keychain.addItem({
      label: 'key2',
      value: 'val2',
      accessibilityClass: 'afterFirstUnlock',
      biometryRequired: true,
    });

    const calls = NativeKeychainMock.__getCallHistory();
    expect(calls[0].accessibleConstant).toBe('kSecAttrAccessibleWhenUnlocked');
    expect(calls[1].accessibleConstant).toBe('kSecAttrAccessibleAfterFirstUnlock');
    expect(calls[1].biometryRequired).toBe(true);
  });

  it('returns injected KeychainResult kinds', async () => {
    NativeKeychainMock.__setNextResult({ kind: 'cancelled' });
    const result1 = await keychain.addItem({
      label: 'k',
      value: 'v',
      accessibilityClass: 'whenUnlocked',
      biometryRequired: false,
    });
    expect(result1.kind).toBe('cancelled');

    NativeKeychainMock.__setNextResult({ kind: 'auth-failed' });
    const result2 = await keychain.addItem({
      label: 'k2',
      value: 'v2',
      accessibilityClass: 'afterFirstUnlock',
      biometryRequired: false,
    });
    expect(result2.kind).toBe('auth-failed');

    NativeKeychainMock.__setNextResult({ kind: 'missing-entitlement' });
    const result3 = await keychain.tryAccessGroupProbe({ accessGroup: 'group.test' });
    expect(result3.kind).toBe('missing-entitlement');
  });

  it('upgrades errSecDuplicateItem to ok via update semantics', async () => {
    // First add
    await keychain.addItem({
      label: 'dup',
      value: 'first',
      accessibilityClass: 'whenUnlocked',
      biometryRequired: false,
    });

    // Second add (duplicate) should return ok
    const result = await keychain.addItem({
      label: 'dup',
      value: 'second',
      accessibilityClass: 'whenUnlocked',
      biometryRequired: false,
    });

    expect(result.kind).toBe('ok');

    // Verify the value was updated
    const getResult = await keychain.getItem({ label: 'dup' });
    expect(getResult.kind).toBe('ok');
    const value = getResult.kind === 'ok' ? getResult.value : undefined;
    expect(value).toBe('second');
  });

  it('does not throw across the boundary in normal operation', async () => {
    // All documented results should be returned as typed results, not thrown
    const results = [
      { kind: 'ok' as const },
      { kind: 'cancelled' as const },
      { kind: 'auth-failed' as const },
      { kind: 'not-found' as const },
      { kind: 'missing-entitlement' as const },
      { kind: 'unsupported' as const },
      { kind: 'error' as const, message: 'test error' },
    ];

    for (const injected of results) {
      NativeKeychainMock.__setNextResult(injected);
      const result = await keychain.addItem({
        label: 'k',
        value: 'v',
        accessibilityClass: 'whenUnlocked',
        biometryRequired: false,
      });
      expect(result.kind).toBe(injected.kind);
    }
  });

  it('produces zero console.warn/error on cancellation', async () => {
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    NativeKeychainMock.__setNextResult({ kind: 'cancelled' });
    await keychain.addItem({
      label: 'k',
      value: 'v',
      accessibilityClass: 'whenUnlocked',
      biometryRequired: false,
    });

    expect(consoleWarnSpy).not.toHaveBeenCalled();
    expect(consoleErrorSpy).not.toHaveBeenCalled();

    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });
});

describe('native/keychain (iOS without native module - expo-secure-store fallback)', () => {
  let keychain: typeof import('@/native/keychain').keychain;

  beforeEach(() => {
    mockNativeModule = null;
    resetSecureStoreMock();
    const keychainModule = require('@/native/keychain');
    keychain = keychainModule.keychain;
    keychainModule.__resetBridgeForTest();
  });

  it('delegates basic CRUD to expo-secure-store', async () => {
    await keychain.addItem({
      label: 'key1',
      value: 'val1',
      accessibilityClass: 'whenUnlocked',
      biometryRequired: false,
    });

    expect(mockCallHistory.some((c: any) => c.method === 'setItemAsync' && c.key === 'key1')).toBe(
      true,
    );
  });

  it('maps biometryRequired to requireAuthentication', async () => {
    resetSecureStoreMock();

    await keychain.addItem({
      label: 'biometric-key',
      value: 'secret',
      accessibilityClass: 'whenUnlocked',
      biometryRequired: true,
    });

    const setCall = mockCallHistory.find(
      (c: any) => c.method === 'setItemAsync' && c.key === 'biometric-key',
    );
    expect(setCall?.options?.requireAuthentication).toBe(true);
  });

  it('maps accessibilityClass to keychainAccessible (clamped to WHEN_UNLOCKED and AFTER_FIRST_UNLOCK)', async () => {
    // whenUnlocked → WHEN_UNLOCKED (0)
    resetSecureStoreMock();
    await keychain.addItem({
      label: 'k1',
      value: 'v1',
      accessibilityClass: 'whenUnlocked',
      biometryRequired: false,
    });
    expect(mockCallHistory[0].options?.keychainAccessible).toBe(0); // WHEN_UNLOCKED

    // afterFirstUnlock → AFTER_FIRST_UNLOCK (1)
    resetSecureStoreMock();
    await keychain.addItem({
      label: 'k2',
      value: 'v2',
      accessibilityClass: 'afterFirstUnlock',
      biometryRequired: false,
    });
    expect(mockCallHistory[0].options?.keychainAccessible).toBe(1); // AFTER_FIRST_UNLOCK
  });

  it('returns unsupported for accessGroup usage', async () => {
    const result = await keychain.addItem({
      label: 'k',
      value: 'v',
      accessibilityClass: 'whenUnlocked',
      biometryRequired: false,
      accessGroup: 'group.test',
    });

    expect(result.kind).toBe('unsupported');
  });

  it('returns unsupported for ACL classes outside the two-class clamp', async () => {
    const result1 = await keychain.addItem({
      label: 'k',
      value: 'v',
      accessibilityClass: 'whenUnlockedThisDeviceOnly',
      biometryRequired: false,
    });
    expect(result1.kind).toBe('unsupported');

    const result2 = await keychain.addItem({
      label: 'k',
      value: 'v',
      accessibilityClass: 'whenPasscodeSetThisDeviceOnly',
      biometryRequired: false,
    });
    expect(result2.kind).toBe('unsupported');
  });

  it('returns unsupported for tryAccessGroupProbe', async () => {
    const result = await keychain.tryAccessGroupProbe({ accessGroup: 'group.test' });
    expect(result.kind).toBe('unsupported');
  });
});
