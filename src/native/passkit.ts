/**
 * PassKit bridge — iOS implementation.
 * Feature: 036-passkit-wallet
 *
 * Contracts: B1, B2, B3, B5, B6, B8, B9
 *
 * @see specs/036-passkit-wallet/contracts/passkit-bridge.md
 */

import { requireOptionalNativeModule } from 'expo-modules-core';
import { Platform } from 'react-native';

import type { AddPassResult, PassKitBridge, PassMetadata } from './passkit.types';
import {
  NATIVE_MODULE_NAME,
  PassKitCancelled,
  PassKitDownloadFailed,
  PassKitInvalidPass,
  PassKitNotSupported,
  PassKitOpenUnsupported,
} from './passkit.types';

/**
 * Native module instance.
 * Contract: B1, B2 — `requireOptionalNativeModule` is called lazily on every
 * bridge invocation so tests can swap the mocked native implementation
 * without resetting the module registry.
 */
function getBridge(): PassKitBridge {
  const native = requireOptionalNativeModule<PassKitBridge>(NATIVE_MODULE_NAME);
  if (!native) {
    throw new PassKitNotSupported();
  }
  return native;
}

/**
 * Promise chain for serialising mutating operations.
 * Contract: B3 (R-A)
 */
let enqueue: Promise<any> = Promise.resolve();

/**
 * Parse iOS version string to numeric tuple.
 * Handles "13.10" correctly (NOT parseFloat).
 * Contract: B5
 */
function parseIOSVersion(version: string): [number, number] {
  const parts = version.split('.').map((p) => parseInt(p, 10));
  return [parts[0] || 0, parts[1] || 0];
}

/**
 * Check if iOS version >= 13.4.
 * Contract: B5
 */
function isOpenPassSupported(): boolean {
  if (Platform.OS !== 'ios') return false;
  const osVersion =
    typeof Platform.constants?.osVersion === 'string' ? Platform.constants.osVersion : '0.0';
  const [major, minor] = parseIOSVersion(osVersion);
  return major > 13 || (major === 13 && minor >= 4);
}

/**
 * canAddPasses() — iOS.
 * Contract: B2
 */
export async function canAddPasses(): Promise<boolean> {
  return getBridge().canAddPasses();
}

/**
 * isPassLibraryAvailable() — iOS.
 * Contract: B2
 */
export async function isPassLibraryAvailable(): Promise<boolean> {
  return getBridge().isPassLibraryAvailable();
}

/**
 * passes() — iOS.
 * Contract: B2, B8
 */
export async function passes(): Promise<PassMetadata[]> {
  return getBridge().passes();
}

/**
 * addPassFromBytes() — iOS.
 * Contract: B2, B3 (serialised), B6
 */
export async function addPassFromBytes(base64: string): Promise<AddPassResult> {
  const next = enqueue.then(() => getBridge().addPassFromBytes(base64));
  enqueue = next.catch(() => ({})); // Keep chain alive even on error
  return next;
}

/**
 * addPassFromURL() — iOS.
 * Contract: B2, B3 (serialised), B6
 */
export async function addPassFromURL(url: string): Promise<AddPassResult> {
  const next = enqueue.then(() => getBridge().addPassFromURL(url));
  enqueue = next.catch(() => ({})); // Keep chain alive even on error
  return next;
}

/**
 * openPass() — iOS 13.4+.
 * Contract: B5
 */
export async function openPass(passTypeIdentifier: string, serialNumber: string): Promise<void> {
  if (!isOpenPassSupported()) {
    throw new PassKitOpenUnsupported();
  }
  return getBridge().openPass(passTypeIdentifier, serialNumber);
}

// Re-export error classes for cross-platform identity (B7)
export {
  PassKitCancelled,
  PassKitDownloadFailed,
  PassKitInvalidPass,
  PassKitNotSupported,
  PassKitOpenUnsupported,
};
