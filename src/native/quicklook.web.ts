/**
 * QuickLook Bridge - Web variant
 * Feature: 032-document-picker-quicklook
 *
 * Web path: same shape as Android. MUST NOT import expo-modules-core
 * to avoid pulling native symbols into the web bundle (SC-007).
 *
 * @see specs/032-document-picker-quicklook/contracts/quicklook-bridge.contract.ts
 */

import {
  QuickLookBridge,
  QuickLookNotSupported,
} from './quicklook.types';

export { QuickLookNotSupported };

export const bridge: QuickLookBridge = Object.freeze({
  isAvailable: (): boolean => false,

  present: (uri: string): Promise<never> =>
    Promise.reject(new QuickLookNotSupported('Quick Look is iOS-only')),
});
