/**
 * PassKit bridge — Android stub.
 * Feature: 036-passkit-wallet
 *
 * Contract: B4 — all methods reject with PassKitNotSupported.
 *
 * @see specs/036-passkit-wallet/contracts/passkit-bridge.md
 */

import type { AddPassResult, PassMetadata } from './passkit.types';
import {
  PassKitCancelled,
  PassKitDownloadFailed,
  PassKitInvalidPass,
  PassKitNotSupported,
  PassKitOpenUnsupported,
} from './passkit.types';

/**
 * canAddPasses() — Android stub.
 * Contract: B4
 */
export async function canAddPasses(): Promise<boolean> {
  return false;
}

/**
 * isPassLibraryAvailable() — Android stub.
 * Contract: B4
 */
export async function isPassLibraryAvailable(): Promise<boolean> {
  return false;
}

/**
 * passes() — Android stub.
 * Contract: B4
 */
export async function passes(): Promise<PassMetadata[]> {
  throw new PassKitNotSupported();
}

/**
 * addPassFromBytes() — Android stub.
 * Contract: B4
 */
export async function addPassFromBytes(_base64: string): Promise<AddPassResult> {
  throw new PassKitNotSupported();
}

/**
 * addPassFromURL() — Android stub.
 * Contract: B4
 */
export async function addPassFromURL(_url: string): Promise<AddPassResult> {
  throw new PassKitNotSupported();
}

/**
 * openPass() — Android stub.
 * Contract: B4
 */
export async function openPass(_passTypeIdentifier: string, _serialNumber: string): Promise<void> {
  throw new PassKitNotSupported();
}

// Re-export error classes for cross-platform identity (B7)
export {
  PassKitCancelled,
  PassKitDownloadFailed,
  PassKitInvalidPass,
  PassKitNotSupported,
  PassKitOpenUnsupported,
};
