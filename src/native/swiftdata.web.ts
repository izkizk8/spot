/**
 * SwiftData Bridge — Web stub (feature 053).
 *
 * SwiftData is iOS-only. All methods reject with
 * `SwiftDataNotSupported`.
 */

import {
  SwiftDataNotSupported,
  type SchemaInfo,
  type SwiftDataBridge,
  type TaskDraft,
  type TaskItem,
  type TaskQuery,
} from './swiftdata.types';

export { SwiftDataNotSupported };

const ERR = (): SwiftDataNotSupported =>
  new SwiftDataNotSupported('SwiftData is not supported on web');

export function getSchemaInfo(): Promise<SchemaInfo> {
  return Promise.reject(ERR());
}

export function fetchTasks(_query?: TaskQuery): Promise<readonly TaskItem[]> {
  return Promise.reject(ERR());
}

export function createTask(_draft: TaskDraft): Promise<TaskItem> {
  return Promise.reject(ERR());
}

export function updateTask(_id: string, _patch: Partial<TaskDraft>): Promise<TaskItem> {
  return Promise.reject(ERR());
}

export function deleteTask(_id: string): Promise<void> {
  return Promise.reject(ERR());
}

export const swiftdata: SwiftDataBridge = {
  getSchemaInfo,
  fetchTasks,
  createTask,
  updateTask,
  deleteTask,
};

export default swiftdata;
