/**
 * iCloud Drive Bridge — Android stub (feature 070).
 *
 * iCloud Drive is iOS-only. All methods reject with
 * `ICloudDriveNotAvailable`. MUST NOT import the iOS variant.
 */

import {
  ICloudDriveNotAvailable,
  type ICloudDriveBridge,
  type ICloudFileItem,
} from './icloud-drive.types';

export { ICloudDriveNotAvailable };

const ERR = (): ICloudDriveNotAvailable =>
  new ICloudDriveNotAvailable('iCloud Drive is not available on Android');

export function isAvailable(): Promise<boolean> {
  return Promise.reject(ERR());
}

export function listFiles(): Promise<readonly ICloudFileItem[]> {
  return Promise.reject(ERR());
}

export function writeFile(_name: string, _content: string): Promise<ICloudFileItem> {
  return Promise.reject(ERR());
}

export function readFile(_url: string): Promise<string> {
  return Promise.reject(ERR());
}

export function deleteFile(_url: string): Promise<void> {
  return Promise.reject(ERR());
}

export const iCloudDrive: ICloudDriveBridge = {
  isAvailable,
  listFiles,
  writeFile,
  readFile,
  deleteFile,
};

export default iCloudDrive;
