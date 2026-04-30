/**
 * SwiftData Bridge Types
 * Feature: 053-swiftdata
 *
 * Shared type definitions for the SwiftData bridge. iOS 17+
 * `@Model class TaskItem` exposed through an Expo Module surface.
 */

export const NATIVE_MODULE_NAME = 'SwiftData' as const;

/**
 * Task priority — mirrors the Swift enum.
 */
export type Priority = 'low' | 'medium' | 'high';

/**
 * Persisted TaskItem entity. Timestamps are epoch ms.
 */
export interface TaskItem {
  id: string;
  title: string;
  completed: boolean;
  priority: Priority;
  dueDate: number | null;
  createdAt: number;
  updatedAt: number;
}

/**
 * Insert / patch payload — id and timestamps assigned by the bridge.
 */
export interface TaskDraft {
  title: string;
  completed?: boolean;
  priority?: Priority;
  dueDate?: number | null;
}

export type TaskFilter = 'all' | 'active' | 'completed' | 'today';

export type TaskSort = 'created' | 'priority' | 'dueDate';

export interface TaskQuery {
  filter?: TaskFilter;
  sort?: TaskSort;
}

/**
 * Schema metadata surfaced by `getSchemaInfo` — used by the
 * CapabilityCard.
 */
export interface SchemaInfo {
  available: boolean;
  containerName: string;
  modelNames: readonly string[];
}

export interface SwiftDataBridge {
  getSchemaInfo(): Promise<SchemaInfo>;
  fetchTasks(query?: TaskQuery): Promise<readonly TaskItem[]>;
  createTask(draft: TaskDraft): Promise<TaskItem>;
  updateTask(id: string, patch: Partial<TaskDraft>): Promise<TaskItem>;
  deleteTask(id: string): Promise<void>;
}

export class SwiftDataNotSupported extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SwiftDataNotSupported';
  }
}
