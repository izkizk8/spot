/**
 * Jest mock for `src/native/keychain.ts` (feature 023).
 *
 * In-memory keychain: label → { value, accessibilityClass, biometryRequired, accessGroup }
 * Recordable call history capturing the exact `kSecAttrAccessible*` constant per call.
 * Per-call result injection for testing all KeychainResult kinds.
 *
 * Usage in tests:
 *
 *   import { keychain } from '@/native/keychain';
 *   import * as NativeKeychainMock from '@test/__mocks__/native-keychain';
 *
 *   beforeEach(() => {
 *     NativeKeychainMock.__reset();
 *   });
 *
 *   // Inject specific result
 *   NativeKeychainMock.__setNextResult({ kind: 'cancelled' });
 *   const result = await keychain.addItem({ ... });
 *
 *   // Assert call history with exact kSecAttrAccessible* constant
 *   const calls = NativeKeychainMock.__getCallHistory();
 *   expect(calls[0].accessibleConstant).toBe('kSecAttrAccessibleWhenUnlockedThisDeviceOnly');
 */

export type AccessibilityClass =
  | 'whenUnlocked'
  | 'afterFirstUnlock'
  | 'whenUnlockedThisDeviceOnly'
  | 'afterFirstUnlockThisDeviceOnly'
  | 'whenPasscodeSetThisDeviceOnly';

export type KeychainResult<T = void> =
  | { kind: 'ok'; value?: T }
  | { kind: 'cancelled' }
  | { kind: 'auth-failed' }
  | { kind: 'missing-entitlement' }
  | { kind: 'not-found' }
  | { kind: 'unsupported' }
  | { kind: 'error'; message: string };

export interface AddItemInput {
  label: string;
  value: string;
  accessibilityClass: AccessibilityClass;
  biometryRequired: boolean;
  accessGroup?: string;
}

interface StoredItem {
  value: string;
  accessibilityClass: AccessibilityClass;
  biometryRequired: boolean;
  accessGroup?: string;
}

interface CallRecord {
  method: string;
  label?: string;
  accessibleConstant: string;
  biometryRequired?: boolean;
  accessGroup?: string;
}

const ACCESSIBILITY_CLASS_TO_CONSTANT: Record<AccessibilityClass, string> = {
  whenUnlocked: 'kSecAttrAccessibleWhenUnlocked',
  afterFirstUnlock: 'kSecAttrAccessibleAfterFirstUnlock',
  whenUnlockedThisDeviceOnly: 'kSecAttrAccessibleWhenUnlockedThisDeviceOnly',
  afterFirstUnlockThisDeviceOnly: 'kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly',
  whenPasscodeSetThisDeviceOnly: 'kSecAttrAccessibleWhenPasscodeSetThisDeviceOnly',
};

// In-memory keychain storage
const store = new Map<string, StoredItem>();

// Call history for verification
const callHistory: CallRecord[] = [];

// Result injection queue (FIFO)
const injectedResults: KeychainResult<any>[] = [];

export const addItem = jest.fn(async (input: AddItemInput): Promise<KeychainResult> => {
  const accessibleConstant = ACCESSIBILITY_CLASS_TO_CONSTANT[input.accessibilityClass];
  callHistory.push({
    method: 'addItem',
    label: input.label,
    accessibleConstant,
    biometryRequired: input.biometryRequired,
    accessGroup: input.accessGroup,
  });

  if (injectedResults.length > 0) {
    return injectedResults.shift()!;
  }

  // Check for duplicate
  const key = `${input.label}:${input.accessGroup ?? 'default'}`;
  if (store.has(key)) {
    // Simulate errSecDuplicateItem → update behavior
    store.set(key, {
      value: input.value,
      accessibilityClass: input.accessibilityClass,
      biometryRequired: input.biometryRequired,
      accessGroup: input.accessGroup,
    });
    return { kind: 'ok' };
  }

  store.set(key, {
    value: input.value,
    accessibilityClass: input.accessibilityClass,
    biometryRequired: input.biometryRequired,
    accessGroup: input.accessGroup,
  });
  return { kind: 'ok' };
});

export const getItem = jest.fn(
  async (args: { label: string; accessGroup?: string }): Promise<KeychainResult<string>> => {
    const key = `${args.label}:${args.accessGroup ?? 'default'}`;
    const item = store.get(key);

    callHistory.push({
      method: 'getItem',
      label: args.label,
      accessibleConstant: item ? ACCESSIBILITY_CLASS_TO_CONSTANT[item.accessibilityClass] : '',
      accessGroup: args.accessGroup,
    });

    if (injectedResults.length > 0) {
      return injectedResults.shift()!;
    }

    if (!item) {
      return { kind: 'not-found' };
    }

    return { kind: 'ok', value: item.value };
  },
);

export const updateItem = jest.fn(
  async (args: { label: string; value: string; accessGroup?: string }): Promise<KeychainResult> => {
    const key = `${args.label}:${args.accessGroup ?? 'default'}`;
    const item = store.get(key);

    callHistory.push({
      method: 'updateItem',
      label: args.label,
      accessibleConstant: item ? ACCESSIBILITY_CLASS_TO_CONSTANT[item.accessibilityClass] : '',
      accessGroup: args.accessGroup,
    });

    if (injectedResults.length > 0) {
      return injectedResults.shift()!;
    }

    if (!item) {
      return { kind: 'not-found' };
    }

    store.set(key, { ...item, value: args.value });
    return { kind: 'ok' };
  },
);

export const deleteItem = jest.fn(
  async (args: { label: string; accessGroup?: string }): Promise<KeychainResult> => {
    const key = `${args.label}:${args.accessGroup ?? 'default'}`;
    const item = store.get(key);

    callHistory.push({
      method: 'deleteItem',
      label: args.label,
      accessibleConstant: item ? ACCESSIBILITY_CLASS_TO_CONSTANT[item.accessibilityClass] : '',
      accessGroup: args.accessGroup,
    });

    if (injectedResults.length > 0) {
      return injectedResults.shift()!;
    }

    if (!store.has(key)) {
      return { kind: 'not-found' };
    }

    store.delete(key);
    return { kind: 'ok' };
  },
);

export const listLabels = jest.fn(
  async (args?: { accessGroup?: string }): Promise<KeychainResult<string[]>> => {
    callHistory.push({
      method: 'listLabels',
      accessibleConstant: '',
      accessGroup: args?.accessGroup,
    });

    if (injectedResults.length > 0) {
      return injectedResults.shift()!;
    }

    const labels: string[] = [];
    const targetGroup = args?.accessGroup ?? 'default';
    for (const [key] of store.entries()) {
      const [label, group] = key.split(':');
      if (group === targetGroup) {
        labels.push(label);
      }
    }

    return { kind: 'ok', value: labels };
  },
);

export const tryAccessGroupProbe = jest.fn(
  async (args: { accessGroup: string }): Promise<KeychainResult<{ bytes: number }>> => {
    callHistory.push({
      method: 'tryAccessGroupProbe',
      accessibleConstant: '',
      accessGroup: args.accessGroup,
    });

    if (injectedResults.length > 0) {
      return injectedResults.shift()!;
    }

    return { kind: 'ok', value: { bytes: 27 } };
  },
);

// Test helper functions
export function __reset() {
  store.clear();
  callHistory.length = 0;
  injectedResults.length = 0;
  addItem.mockClear();
  getItem.mockClear();
  updateItem.mockClear();
  deleteItem.mockClear();
  listLabels.mockClear();
  tryAccessGroupProbe.mockClear();
}

export function __setNextResult(result: KeychainResult<any>) {
  injectedResults.push(result);
}

export function __getCallHistory(): ReadonlyArray<CallRecord> {
  return [...callHistory];
}

export function __getStore(): ReadonlyMap<string, StoredItem> {
  return new Map(store);
}

// Re-export the bridge interface
export const keychain = {
  addItem,
  getItem,
  updateItem,
  deleteItem,
  listLabels,
  tryAccessGroupProbe,
};
