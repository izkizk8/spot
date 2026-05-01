/**
 * iCloud Drive Bridge Types
 * Feature: 070-icloud-drive
 *
 * Shared type definitions for the NSFileCoordinator / NSMetadataQuery
 * iCloud Drive bridge. iOS 16+ only.
 */

export const NATIVE_MODULE_NAME = 'ICloudDrive' as const;

/**
 * Metadata for a single file in the ubiquity container.
 */
export interface ICloudFileItem {
  name: string;
  url: string;
  size: number;
  modifiedAt: number;
}

export interface ICloudDriveBridge {
  isAvailable(): Promise<boolean>;
  listFiles(): Promise<readonly ICloudFileItem[]>;
  writeFile(name: string, content: string): Promise<ICloudFileItem>;
  readFile(url: string): Promise<string>;
  deleteFile(url: string): Promise<void>;
}

export class ICloudDriveNotAvailable extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ICloudDriveNotAvailable';
  }
}
