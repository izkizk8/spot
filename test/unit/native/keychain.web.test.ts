/**
 * @jest-environment jsdom
 */

// Unmock the keychain module so we can test the real implementation
jest.unmock('@/native/keychain');

// Mock Platform.OS as web at the top - before any imports
jest.mock('react-native', () => ({
  Platform: {
    OS: 'web',
    select: jest.fn((obj: any) => obj.web || obj.default),
  },
}));

// Mock expo-secure-store (not used on web, but needed to avoid module errors)
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

// Mock expo-modules-core before importing keychain (no native module on web)
jest.mock('expo-modules-core', () => ({
  requireOptionalNativeModule: jest.fn(() => null),
}));

describe('native/keychain (Web - unsupported stub)', () => {
  let keychain: typeof import('@/native/keychain').keychain;

  beforeEach(() => {
    const keychainModule = require('@/native/keychain');
    keychain = keychainModule.keychain;
    keychainModule.__resetBridgeForTest();
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
