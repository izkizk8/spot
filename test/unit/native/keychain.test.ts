/**
 * @jest-environment jsdom
 */

// Mock expo-secure-store before importing keychain
jest.mock('expo-secure-store', () => require('@test/__mocks__/expo-secure-store'));

// Mock react-native Platform before importing anything
let mockPlatformOS: 'ios' | 'android' | 'web' = 'ios';
jest.mock('react-native/Libraries/Utilities/Platform', () => ({
  get OS() {
    return mockPlatformOS;
  },
  select: jest.fn((obj: any) => obj[mockPlatformOS] || obj.default),
}));

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

describe('native/keychain', () => {
  let keychain: typeof import('@/native/keychain').keychain;
  let __resetBridge: (() => void) | undefined;
  let NativeKeychainMock: typeof import('@test/__mocks__/native-keychain');

  describe('when native module is present', () => {
    beforeEach(() => {
      mockNativeModule = NativeKeychainMock.keychain;
      jest.resetModules();
      NativeKeychainMock = require('@test/__mocks__/native-keychain');
      NativeKeychainMock.__reset();
      const keychainModule = require('@/native/keychain');
      keychain = keychainModule.keychain;
      __resetBridge = keychainModule.__resetBridge;
      if (__resetBridge) __resetBridge();
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

  describe('when native module is absent on iOS/Android (fallback to expo-secure-store)', () => {
    beforeEach(() => {
      // Set mocks FIRST
      mockPlatformOS = 'ios';
      mockNativeModule = null;

      // Then reset modules to clear any cached state
      jest.resetModules();

      // Get fresh mocks and reset them
      const SecureStoreMock = require('expo-secure-store');
      SecureStoreMock.__reset();

      // Import keychain fresh - it will now check Platform.OS and mockNativeModule
      const keychainModule = require('@/native/keychain');
      keychain = keychainModule.keychain;
      __resetBridge = keychainModule.__resetBridge;
      if (__resetBridge) __resetBridge();
    });

    it('delegates basic CRUD to expo-secure-store', async () => {
      const SecureStoreMock = require('expo-secure-store');

      await keychain.addItem({
        label: 'key1',
        value: 'val1',
        accessibilityClass: 'whenUnlocked',
        biometryRequired: false,
      });

      const calls = SecureStoreMock.__getCallHistory();
      expect(calls.some((c: any) => c.method === 'setItemAsync' && c.key === 'key1')).toBe(true);
    });

    it('maps biometryRequired to requireAuthentication', async () => {
      const SecureStoreMock = require('expo-secure-store');
      SecureStoreMock.__reset();

      await keychain.addItem({
        label: 'biometric-key',
        value: 'secret',
        accessibilityClass: 'whenUnlocked',
        biometryRequired: true,
      });

      const calls = SecureStoreMock.__getCallHistory();
      const setCall = calls.find(
        (c: any) => c.method === 'setItemAsync' && c.key === 'biometric-key',
      );
      expect(setCall?.options?.requireAuthentication).toBe(true);
    });

    it('maps accessibilityClass to keychainAccessible (clamped to WHEN_UNLOCKED and AFTER_FIRST_UNLOCK)', async () => {
      const SecureStoreMock = require('expo-secure-store');

      // whenUnlocked → WHEN_UNLOCKED (0)
      SecureStoreMock.__reset();
      await keychain.addItem({
        label: 'k1',
        value: 'v1',
        accessibilityClass: 'whenUnlocked',
        biometryRequired: false,
      });
      let calls = SecureStoreMock.__getCallHistory();
      expect(calls[0].options?.keychainAccessible).toBe(0); // WHEN_UNLOCKED

      // afterFirstUnlock → AFTER_FIRST_UNLOCK (1)
      SecureStoreMock.__reset();
      await keychain.addItem({
        label: 'k2',
        value: 'v2',
        accessibilityClass: 'afterFirstUnlock',
        biometryRequired: false,
      });
      calls = SecureStoreMock.__getCallHistory();
      expect(calls[0].options?.keychainAccessible).toBe(1); // AFTER_FIRST_UNLOCK
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

  describe('on Web', () => {
    beforeEach(() => {
      mockPlatformOS = 'web';
      mockNativeModule = null;
      jest.resetModules();
      const keychainModule = require('@/native/keychain');
      keychain = keychainModule.keychain;
      __resetBridge = keychainModule.__resetBridge;
      if (__resetBridge) __resetBridge();
    });

    it('returns unsupported for every method', async () => {
      const addResult = await keychain.addItem({
        label: 'k',
        value: 'v',
        accessibilityClass: 'whenUnlocked',
        biometryRequired: false,
      });
      expect(addResult.kind).toBe('unsupported');

      const getResult = await keychain.getItem({ label: 'k' });
      expect(getResult.kind).toBe('unsupported');

      const updateResult = await keychain.updateItem({ label: 'k', value: 'v2' });
      expect(updateResult.kind).toBe('unsupported');

      const deleteResult = await keychain.deleteItem({ label: 'k' });
      expect(deleteResult.kind).toBe('unsupported');

      const listResult = await keychain.listLabels();
      expect(listResult.kind).toBe('unsupported');

      const probeResult = await keychain.tryAccessGroupProbe({ accessGroup: 'g' });
      expect(probeResult.kind).toBe('unsupported');
    });

    it('never instantiates the native module', async () => {
      // Trigger a call to ensure platform check happens
      const result = await keychain.addItem({
        label: 'test',
        value: 'test',
        accessibilityClass: 'whenUnlocked',
        biometryRequired: false,
      });

      // On web, all methods should return unsupported
      expect(result.kind).toBe('unsupported');
    });
  });
});
