/**
 * Task types for the SwiftData Lab module
 * Feature: 053-swiftdata
 *
 * Re-exports the bridge value types and adds JS-side helpers used
 * by the editor, list, and stats card.
 */

import type { Priority, TaskDraft, TaskFilter, TaskItem, TaskSort } from '@/native/swiftdata.types';

export type { Priority, TaskDraft, TaskFilter, TaskItem, TaskSort };

export const EMPTY_TITLE = 'Untitled task' as const;
export const DEFAULT_PRIORITY: Priority = 'medium';

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Build a `TaskDraft` from an optional partial. Empty fields fall
 * back to safe defaults so the draft is always valid for
 * `createTask`.
 */
export function createDraft(partial?: Partial<TaskDraft>): TaskDraft {
  return {
    title: partial?.title?.trim() || EMPTY_TITLE,
    completed: partial?.completed ?? false,
    priority: partial?.priority ?? DEFAULT_PRIORITY,
    dueDate: partial?.dueDate ?? null,
  };
}

/**
 * Type guard — narrow an unknown value to a `TaskItem`.
 */
export function isTaskItem(value: unknown): value is TaskItem {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === 'string' &&
    typeof v.title === 'string' &&
    typeof v.completed === 'boolean' &&
    (v.priority === 'low' || v.priority === 'medium' || v.priority === 'high') &&
    (v.dueDate === null || typeof v.dueDate === 'number') &&
    typeof v.createdAt === 'number' &&
    typeof v.updatedAt === 'number'
  );
}

/**
 * Pure: is `dueDate` inside the local-day window starting at `now`?
 *
 * The window is `[startOfDay(now), startOfDay(now) + 24h)`. Tasks
 * with a null due-date are never "today".
 */
export function isToday(dueDate: number | null | undefined, now: number): boolean {
  if (dueDate === null || dueDate === undefined) return false;
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const startMs = start.getTime();
  return dueDate >= startMs && dueDate < startMs + DAY_MS;
}

export interface TaskStats {
  total: number;
  completed: number;
  active: number;
  byPriority: Record<Priority, number>;
  /** Completion rate in [0,1]; 0 when there are no tasks. */
  completionRate: number;
}

/**
 * Pure: compute the stats panel from a task list.
 */
export function computeStats(tasks: readonly TaskItem[]): TaskStats {
  const byPriority: Record<Priority, number> = { low: 0, medium: 0, high: 0 };
  let completed = 0;
  for (const t of tasks) {
    byPriority[t.priority] += 1;
    if (t.completed) completed += 1;
  }
  const total = tasks.length;
  const active = total - completed;
  const completionRate = total === 0 ? 0 : completed / total;
  return { total, completed, active, byPriority, completionRate };
}
