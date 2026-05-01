/**
 * @jest-environment jsdom
 */

// Unmock the keychain module so we can test the real implementation
jest.unmock('@/native/keychain');

// Mock Platform.OS as Android at the top - before any imports
jest.mock('react-native', () => ({
  Platform: {
    OS: 'android',
    select: jest.fn((obj: any) => obj.android || obj.default),
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

// Mock expo-modules-core before importing keychain (no native module on Android)
jest.mock('expo-modules-core', () => ({
  requireOptionalNativeModule: jest.fn(() => null),
}));

describe('native/keychain (Android - expo-secure-store adapter)', () => {
  let keychain: typeof import('@/native/keychain').keychain;

  beforeEach(() => {
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
