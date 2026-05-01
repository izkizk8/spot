/**
 * Type definitions for Keychain Services Lab (feature 023).
 */

import type { AccessibilityClass } from './accessibility-classes';

export interface KeychainItemMeta {
  id: string; // === label
  label: string;
  accessibilityClass: AccessibilityClass;
  biometryRequired: boolean;
  createdAt: string; // ISO 8601
}

export interface AddItemInput {
  label: string;
  value: string;
  accessibilityClass: AccessibilityClass;
  biometryRequired: boolean;
  accessGroup?: string;
}

export type KeychainResult<T = void> =
  | { kind: 'ok'; value?: T }
  | { kind: 'cancelled' }
  | { kind: 'auth-failed' }
  | { kind: 'missing-entitlement' }
  | { kind: 'not-found' }
  | { kind: 'unsupported' }
  | { kind: 'error'; message: string };

export interface MetadataIndex {
  version: 1;
  items: KeychainItemMeta[];
}
