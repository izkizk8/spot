/**
 * Jest mock for `expo-secure-store` (feature 021, extended for 023).
 *
 * In-memory map for `getItemAsync`, `setItemAsync`, `deleteItemAsync`.
 * Exposes `__setShouldThrow` to simulate SecureStore failures.
 * Captures `requireAuthentication` and `keychainAccessible` options (feature 023).
 *
 * Usage in tests:
 *
 *   import * as SecureStore from 'expo-secure-store';
 *   const mock = require('expo-secure-store') as typeof import('../../test/__mocks__/expo-secure-store');
 *   mock.__reset();
 *   mock.__setShouldThrow('get');  // next getItemAsync will reject
 *   const calls = mock.__getCallHistory();
 *   expect(calls[0].options?.requireAuthentication).toBe(true);
 */

interface SecureStoreOptions {
  requireAuthentication?: boolean;
  keychainAccessible?: number;
}

interface CallRecord {
  method: string;
  key: string;
  options?: SecureStoreOptions;
}

const store = new Map<string, string>();
let shouldThrow: 'get' | 'set' | 'delete' | 'all' | null = null;
const callHistory: CallRecord[] = [];

export const getItemAsync = jest.fn(
  async (key: string, options?: SecureStoreOptions): Promise<string | null> => {
    callHistory.push({ method: 'getItemAsync', key, options });
    if (shouldThrow === 'get' || shouldThrow === 'all') {
      throw new Error('SecureStore failure');
    }
    return store.get(key) ?? null;
  },
);

export const setItemAsync = jest.fn(
  async (key: string, value: string, options?: SecureStoreOptions): Promise<void> => {
    callHistory.push({ method: 'setItemAsync', key, options });
    if (shouldThrow === 'set' || shouldThrow === 'all') {
      throw new Error('SecureStore failure');
    }
    store.set(key, value);
  },
);

export const deleteItemAsync = jest.fn(
  async (key: string, options?: SecureStoreOptions): Promise<void> => {
    callHistory.push({ method: 'deleteItemAsync', key, options });
    if (shouldThrow === 'delete' || shouldThrow === 'all') {
      throw new Error('SecureStore failure');
    }
    store.delete(key);
  },
);

// Test helpers
export function __reset() {
  store.clear();
  shouldThrow = null;
  callHistory.length = 0;
  getItemAsync.mockClear();
  setItemAsync.mockClear();
  deleteItemAsync.mockClear();
}

export function __setShouldThrow(op: 'get' | 'set' | 'delete' | 'all' | null) {
  shouldThrow = op;
}

export function __getCallHistory(): ReadonlyArray<CallRecord> {
  return [...callHistory];
}

// Export SecureStore constants
export const WHEN_UNLOCKED = 0;
export const AFTER_FIRST_UNLOCK = 1;
export const WHEN_PASSCODE_SET_THIS_DEVICE_ONLY = 3;
