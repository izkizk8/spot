/**
 * Jest mock for `expo-secure-store` (feature 021).
 *
 * In-memory map for `getItemAsync`, `setItemAsync`, `deleteItemAsync`.
 * Exposes `__setShouldThrow` to simulate SecureStore failures.
 *
 * Usage in tests:
 *
 *   import * as SecureStore from 'expo-secure-store';
 *   const mock = require('expo-secure-store') as typeof import('../../test/__mocks__/expo-secure-store');
 *   mock.__reset();
 *   mock.__setShouldThrow('get');  // next getItemAsync will reject
 */

const store = new Map<string, string>();
let shouldThrow: 'get' | 'set' | 'delete' | 'all' | null = null;

export const getItemAsync = jest.fn(async (key: string): Promise<string | null> => {
  if (shouldThrow === 'get' || shouldThrow === 'all') {
    throw new Error('SecureStore failure');
  }
  return store.get(key) ?? null;
});

export const setItemAsync = jest.fn(async (key: string, value: string): Promise<void> => {
  if (shouldThrow === 'set' || shouldThrow === 'all') {
    throw new Error('SecureStore failure');
  }
  store.set(key, value);
});

export const deleteItemAsync = jest.fn(async (key: string): Promise<void> => {
  if (shouldThrow === 'delete' || shouldThrow === 'all') {
    throw new Error('SecureStore failure');
  }
  store.delete(key);
});

// Test helpers
export function __reset() {
  store.clear();
  shouldThrow = null;
  getItemAsync.mockClear();
  setItemAsync.mockClear();
  deleteItemAsync.mockClear();
}

export function __setShouldThrow(op: 'get' | 'set' | 'delete' | 'all' | null) {
  shouldThrow = op;
}
