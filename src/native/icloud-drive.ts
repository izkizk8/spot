/**
 * iCloud Drive Bridge — iOS variant (feature 070).
 *
 * Single seam where the `ICloudDrive` Expo Module is touched.
 * Resolved via `requireOptionalNativeModule` so the surface is
 * null-safe in unit tests where the module is absent.
 */

import { Platform } from 'react-native';
import { requireOptionalNativeModule } from 'expo-modules-core';

import {
  NATIVE_MODULE_NAME,
  ICloudDriveNotAvailable,
  type ICloudDriveBridge,
  type ICloudFileItem,
} from './icloud-drive.types';

export { ICloudDriveNotAvailable };

interface NativeICloudDrive {
  isAvailable(): Promise<boolean>;
  listFiles(): Promise<readonly ICloudFileItem[]>;
  writeFile(name: string, content: string): Promise<ICloudFileItem>;
  readFile(url: string): Promise<string>;
  deleteFile(url: string): Promise<void>;
}

function getNative(): NativeICloudDrive | null {
  return requireOptionalNativeModule<NativeICloudDrive>(NATIVE_MODULE_NAME);
}

function ensureNative(): NativeICloudDrive {
  if (Platform.OS !== 'ios') {
    throw new ICloudDriveNotAvailable(`iCloud Drive is not available on ${Platform.OS}`);
  }
  const native = getNative();
  if (!native) {
    throw new ICloudDriveNotAvailable('ICloudDrive native module is not registered');
  }
  return native;
}

export function isAvailable(): Promise<boolean> {
  try {
    return ensureNative().isAvailable();
  } catch (err) {
    return Promise.reject(err);
  }
}

export function listFiles(): Promise<readonly ICloudFileItem[]> {
  try {
    return ensureNative().listFiles();
  } catch (err) {
    return Promise.reject(err);
  }
}

export function writeFile(name: string, content: string): Promise<ICloudFileItem> {
  try {
    return ensureNative().writeFile(name, content);
  } catch (err) {
    return Promise.reject(err);
  }
}

export function readFile(url: string): Promise<string> {
  try {
    return ensureNative().readFile(url);
  } catch (err) {
    return Promise.reject(err);
  }
}

export function deleteFile(url: string): Promise<void> {
  try {
    return ensureNative().deleteFile(url);
  } catch (err) {
    return Promise.reject(err);
  }
}

export const iCloudDrive: ICloudDriveBridge = {
  isAvailable,
  listFiles,
  writeFile,
  readFile,
  deleteFile,
};

export default iCloudDrive;
