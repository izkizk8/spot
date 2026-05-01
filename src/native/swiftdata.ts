/**
 * SwiftData Bridge — iOS variant (feature 053).
 *
 * Single seam where the `SwiftData` Expo Module is touched. Resolved
 * via `requireOptionalNativeModule` so the surface is null-safe in
 * unit tests where the module is absent.
 */

import { Platform } from 'react-native';
import { requireOptionalNativeModule } from 'expo-modules-core';

import {
  NATIVE_MODULE_NAME,
  SwiftDataNotSupported,
  type SchemaInfo,
  type SwiftDataBridge,
  type TaskDraft,
  type TaskItem,
  type TaskQuery,
} from './swiftdata.types';

export { SwiftDataNotSupported };

interface NativeSwiftData {
  getSchemaInfo(): Promise<SchemaInfo>;
  fetchTasks(query?: TaskQuery): Promise<readonly TaskItem[]>;
  createTask(draft: TaskDraft): Promise<TaskItem>;
  updateTask(id: string, patch: Partial<TaskDraft>): Promise<TaskItem>;
  deleteTask(id: string): Promise<void>;
}

function getNative(): NativeSwiftData | null {
  return requireOptionalNativeModule<NativeSwiftData>(NATIVE_MODULE_NAME);
}

function ensureNative(): NativeSwiftData {
  if (Platform.OS !== 'ios') {
    throw new SwiftDataNotSupported(`SwiftData is not available on ${Platform.OS}`);
  }
  const native = getNative();
  if (!native) {
    throw new SwiftDataNotSupported('SwiftData native module is not registered');
  }
  return native;
}

export function getSchemaInfo(): Promise<SchemaInfo> {
  try {
    return ensureNative().getSchemaInfo();
  } catch (err) {
    return Promise.reject(err);
  }
}

export function fetchTasks(query?: TaskQuery): Promise<readonly TaskItem[]> {
  try {
    return ensureNative().fetchTasks(query);
  } catch (err) {
    return Promise.reject(err);
  }
}

export function createTask(draft: TaskDraft): Promise<TaskItem> {
  try {
    return ensureNative().createTask(draft);
  } catch (err) {
    return Promise.reject(err);
  }
}

export function updateTask(id: string, patch: Partial<TaskDraft>): Promise<TaskItem> {
  try {
    return ensureNative().updateTask(id, patch);
  } catch (err) {
    return Promise.reject(err);
  }
}

export function deleteTask(id: string): Promise<void> {
  try {
    return ensureNative().deleteTask(id);
  } catch (err) {
    return Promise.reject(err);
  }
}

export const swiftdata: SwiftDataBridge = {
  getSchemaInfo,
  fetchTasks,
  createTask,
  updateTask,
  deleteTask,
};

export default swiftdata;
