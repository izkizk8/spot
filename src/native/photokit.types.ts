/**
 * PhotoKit Bridge Types
 * Feature: 057-photokit
 *
 * Shared type definitions for the PHPickerViewController bridge.
 * iOS 14+ photo library access exposed through an Expo Module surface.
 */

export const NATIVE_MODULE_NAME = 'PhotoKit' as const;

/**
 * Photo-library authorization status — mirrors `PHAuthorizationStatus`.
 */
export type AuthorizationStatus =
  | 'notDetermined'
  | 'restricted'
  | 'denied'
  | 'authorized'
  | 'limited';

/**
 * A single asset returned from PHPickerViewController.
 * `creationDate` is epoch ms; `null` when the asset has no creation date.
 */
export interface PhotoAsset {
  id: string;
  uri: string;
  width: number;
  height: number;
  mediaType: 'image' | 'video';
  filename: string;
  creationDate: number | null;
}

/**
 * Configuration forwarded to `PHPickerConfiguration`.
 * `selectionLimit: 0` means unlimited (PHPicker default).
 */
export interface PickerConfig {
  selectionLimit?: number;
  mediaTypes?: ('image' | 'video')[];
}

export interface PhotoKitBridge {
  requestAuthorization(): Promise<AuthorizationStatus>;
  getAuthorizationStatus(): Promise<AuthorizationStatus>;
  presentPicker(config?: PickerConfig): Promise<readonly PhotoAsset[]>;
}

export class PhotoKitNotSupported extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PhotoKitNotSupported';
  }
}
