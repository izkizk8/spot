/**
 * Universal JS bridge over iOS KeychainBridge.swift and expo-secure-store fallback.
 *
 * Three-tier resolution:
 * 1. Native module present (custom dev client on iOS) → full capabilities
 * 2. iOS/Android without native module → expo-secure-store for basic CRUD
 * 3. Web → unsupported stub
 *
 * Never throws across the boundary in normal operation (NFR-005).
 */

import { Platform } from 'react-native';
import { requireOptionalNativeModule } from 'expo-modules-core';
import * as SecureStore from 'expo-secure-store';
import type { AccessibilityClass } from '@/modules/keychain-lab/accessibility-classes';

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

export interface KeychainBridge {
  addItem(input: AddItemInput): Promise<KeychainResult>;
  getItem(args: { label: string; accessGroup?: string }): Promise<KeychainResult<string>>;
  updateItem(args: { label: string; value: string; accessGroup?: string }): Promise<KeychainResult>;
  deleteItem(args: { label: string; accessGroup?: string }): Promise<KeychainResult>;
  listLabels(args?: { accessGroup?: string }): Promise<KeychainResult<string[]>>;
  tryAccessGroupProbe(args: { accessGroup: string }): Promise<KeychainResult<{ bytes: number }>>;
}

// Try to load the native module via a getter so tests can mock it
function getNativeModule(): KeychainBridge | null {
  return requireOptionalNativeModule<KeychainBridge>('SpotKeychain');
}

// SecureStore accessibility constants
const WHEN_UNLOCKED = 0;
const AFTER_FIRST_UNLOCK = 1;

// Fallback implementation using expo-secure-store (iOS/Android only)
class SecureStoreAdapter implements KeychainBridge {
  async addItem(input: AddItemInput): Promise<KeychainResult> {
    // Only support whenUnlocked and afterFirstUnlock classes
    if (
      input.accessibilityClass !== 'whenUnlocked' &&
      input.accessibilityClass !== 'afterFirstUnlock'
    ) {
      return { kind: 'unsupported' };
    }

    // No access group support
    if (input.accessGroup) {
      return { kind: 'unsupported' };
    }

    try {
      const options: {
        requireAuthentication?: boolean;
        keychainAccessible?: number;
      } = {
        requireAuthentication: input.biometryRequired,
        keychainAccessible:
          input.accessibilityClass === 'whenUnlocked' ? WHEN_UNLOCKED : AFTER_FIRST_UNLOCK,
      };

      await SecureStore.setItemAsync(input.label, input.value, options);
      return { kind: 'ok' };
    } catch (error) {
      return { kind: 'error', message: String(error) };
    }
  }

  async getItem(args: { label: string; accessGroup?: string }): Promise<KeychainResult<string>> {
    if (args.accessGroup) {
      return { kind: 'unsupported' };
    }

    try {
      const value = await SecureStore.getItemAsync(args.label);
      if (value === null) {
        return { kind: 'not-found' };
      }
      return { kind: 'ok', value };
    } catch (error) {
      return { kind: 'error', message: String(error) };
    }
  }

  async updateItem(args: {
    label: string;
    value: string;
    accessGroup?: string;
  }): Promise<KeychainResult> {
    if (args.accessGroup) {
      return { kind: 'unsupported' };
    }

    try {
      // SecureStore doesn't distinguish update from add
      await SecureStore.setItemAsync(args.label, args.value);
      return { kind: 'ok' };
    } catch (error) {
      return { kind: 'error', message: String(error) };
    }
  }

  async deleteItem(args: { label: string; accessGroup?: string }): Promise<KeychainResult> {
    if (args.accessGroup) {
      return { kind: 'unsupported' };
    }

    try {
      await SecureStore.deleteItemAsync(args.label);
      return { kind: 'ok' };
    } catch (error) {
      // SecureStore doesn't distinguish not-found from other errors
      return { kind: 'error', message: String(error) };
    }
  }

  async listLabels(_args?: { accessGroup?: string }): Promise<KeychainResult<string[]>> {
    // No enumeration support in SecureStore
    return { kind: 'unsupported' };
  }

  async tryAccessGroupProbe(_args: {
    accessGroup: string;
  }): Promise<KeychainResult<{ bytes: number }>> {
    return { kind: 'unsupported' };
  }
}

// Web stub - all methods unsupported
class WebStub implements KeychainBridge {
  async addItem(_input: AddItemInput): Promise<KeychainResult> {
    return { kind: 'unsupported' };
  }

  async getItem(_args: { label: string; accessGroup?: string }): Promise<KeychainResult<string>> {
    return { kind: 'unsupported' };
  }

  async updateItem(_args: {
    label: string;
    value: string;
    accessGroup?: string;
  }): Promise<KeychainResult> {
    return { kind: 'unsupported' };
  }

  async deleteItem(_args: { label: string; accessGroup?: string }): Promise<KeychainResult> {
    return { kind: 'unsupported' };
  }

  async listLabels(_args?: { accessGroup?: string }): Promise<KeychainResult<string[]>> {
    return { kind: 'unsupported' };
  }

  async tryAccessGroupProbe(_args: {
    accessGroup: string;
  }): Promise<KeychainResult<{ bytes: number }>> {
    return { kind: 'unsupported' };
  }
}

// Lazy bridge resolution to support runtime Platform.OS mocking
// Bridge is selected on first method call, not at module load time
class LazyBridge implements KeychainBridge {
  private resolvedBridge?: KeychainBridge;

  private getBridge(): KeychainBridge {
    if (!this.resolvedBridge) {
      if (Platform.OS === 'web') {
        this.resolvedBridge = new WebStub();
      } else {
        const nativeModule = getNativeModule();
        if (nativeModule) {
          this.resolvedBridge = nativeModule;
        } else {
          // iOS or Android without native module
          this.resolvedBridge = new SecureStoreAdapter();
        }
      }
    }
    return this.resolvedBridge;
  }

  // Test helper to reset cached bridge
  resetBridgeForTest() {
    this.resolvedBridge = undefined;
  }

  async addItem(input: AddItemInput): Promise<KeychainResult> {
    return this.getBridge().addItem(input);
  }

  async getItem(args: { label: string; accessGroup?: string }): Promise<KeychainResult<string>> {
    return this.getBridge().getItem(args);
  }

  async updateItem(args: {
    label: string;
    value: string;
    accessGroup?: string;
  }): Promise<KeychainResult> {
    return this.getBridge().updateItem(args);
  }

  async deleteItem(args: { label: string; accessGroup?: string }): Promise<KeychainResult> {
    return this.getBridge().deleteItem(args);
  }

  async listLabels(args?: { accessGroup?: string }): Promise<KeychainResult<string[]>> {
    return this.getBridge().listLabels(args);
  }

  async tryAccessGroupProbe(args: {
    accessGroup: string;
  }): Promise<KeychainResult<{ bytes: number }>> {
    return this.getBridge().tryAccessGroupProbe(args);
  }
}

const lazyBridge = new LazyBridge();

export const keychain = lazyBridge;

// Export for tests only - allows resetting bridge cache between test scenarios
export const __resetBridgeForTest = () => lazyBridge.resetBridgeForTest();
