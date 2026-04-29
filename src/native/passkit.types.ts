/**
 * PassKit bridge types and error classes.
 * Feature: 036-passkit-wallet
 *
 * @see specs/036-passkit-wallet/contracts/passkit-bridge.md
 */

/**
 * Native module name for PassKit bridge.
 * Contract: B1
 */
export const NATIVE_MODULE_NAME = 'PassKitBridge' as const;

/**
 * Pass category union matching PKPassType.
 * Contract: B1
 */
export type PassCategory = 'boardingPass' | 'coupon' | 'eventTicket' | 'generic' | 'storeCard';

/**
 * Pass metadata returned by PKPassLibrary.passes().
 * Contract: B1, B8
 */
export interface PassMetadata {
  passTypeIdentifier: string;
  serialNumber: string;
  organizationName: string | null;
  localizedDescription: string | null;
  passType: PassCategory;
}

/**
 * Capabilities shape for canAddPasses() and isPassLibraryAvailable().
 * Contract: B1
 */
export interface Capabilities {
  isPassLibraryAvailable: boolean;
  canAddPasses: boolean;
}

/**
 * Result shape for addPassFromBytes() and addPassFromURL().
 * Contract: B6
 */
export interface AddPassResult {
  added: boolean;
}

/**
 * PassKit bridge interface matching native module surface.
 * Contract: B1, B2
 */
export interface PassKitBridge {
  canAddPasses(): Promise<boolean>;
  isPassLibraryAvailable(): Promise<boolean>;
  passes(): Promise<PassMetadata[]>;
  addPassFromBytes(base64: string): Promise<AddPassResult>;
  addPassFromURL(url: string): Promise<AddPassResult>;
  openPass(passTypeIdentifier: string, serialNumber: string): Promise<void>;
}

/**
 * PassKit not supported on this platform (Android / Web).
 * Contract: B4, B7
 */
export class PassKitNotSupported extends Error {
  constructor(message = 'PassKit is not supported on this platform') {
    super(message);
    this.name = 'PassKitNotSupported';
    Object.setPrototypeOf(this, PassKitNotSupported.prototype);
  }
}

/**
 * openPass() requires iOS 13.4+.
 * Contract: B5, B7
 */
export class PassKitOpenUnsupported extends Error {
  constructor(message = 'openPass requires iOS 13.4+') {
    super(message);
    this.name = 'PassKitOpenUnsupported';
    Object.setPrototypeOf(this, PassKitOpenUnsupported.prototype);
  }
}

/**
 * URL fetch failed or network error.
 * Contract: B7
 */
export class PassKitDownloadFailed extends Error {
  constructor(message = 'Pass download failed') {
    super(message);
    this.name = 'PassKitDownloadFailed';
    Object.setPrototypeOf(this, PassKitDownloadFailed.prototype);
  }
}

/**
 * Pass invalid or unsigned.
 * Contract: B7
 */
export class PassKitInvalidPass extends Error {
  constructor(message = 'Pass is invalid or unsigned') {
    super(message);
    this.name = 'PassKitInvalidPass';
    Object.setPrototypeOf(this, PassKitInvalidPass.prototype);
  }
}

/**
 * User cancelled PKAddPassesViewController.
 * Contract: B6, B7
 */
export class PassKitCancelled extends Error {
  constructor(message = 'User cancelled') {
    super(message);
    this.name = 'PassKitCancelled';
    Object.setPrototypeOf(this, PassKitCancelled.prototype);
  }
}
