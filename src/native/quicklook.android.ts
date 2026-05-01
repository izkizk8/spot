/**
 * QuickLook Bridge - Android variant
 * Feature: 032-document-picker-quicklook
 *
 * Android path: throws QuickLookNotSupported from present(),
 * returns false from isAvailable() (B2).
 *
 * @see specs/032-document-picker-quicklook/contracts/quicklook-bridge.contract.ts
 */

import { QuickLookBridge, QuickLookNotSupported } from './quicklook.types';

export { QuickLookNotSupported };

export const bridge: QuickLookBridge = Object.freeze({
  isAvailable: (): boolean => false,

  present: (_uri: string): Promise<never> =>
    Promise.reject(new QuickLookNotSupported('Quick Look is iOS-only')),
});
