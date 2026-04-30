/**
 * Query Builder for the SwiftData Lab module
 * Feature: 053-swiftdata
 *
 * Pure helpers that mirror the Swift `FetchDescriptor` predicate /
 * sortBy assembly on the JS side. The hook uses `applyQuery` to
 * keep the visible list consistent without a native round-trip on
 * every filter / sort change. `buildFetchDescriptor` returns the
 * serialisable shape the bridge would send to Swift.
 */

import { isToday, type TaskFilter, type TaskItem, type TaskSort } from './task-types';
import type { Priority } from '@/native/swiftdata.types';

export const PRIORITY_WEIGHT: Record<Priority, number> = {
  low: 1,
  medium: 2,
  high: 3,
};

/**
 * Pure: integer weight for sort comparisons. Higher == more urgent.
 */
export function priorityWeight(priority: Priority): number {
  return PRIORITY_WEIGHT[priority];
}

/**
 * Pure: keep tasks matching `filter`. `today` is parameterised by
 * `now` so callers (and tests) can pin time.
 */
export function applyFilter(
  tasks: readonly TaskItem[],
  filter: TaskFilter,
  now: number,
): readonly TaskItem[] {
  switch (filter) {
    case 'all':
      return tasks;
    case 'active':
      return tasks.filter((t) => !t.completed);
    case 'completed':
      return tasks.filter((t) => t.completed);
    case 'today':
      return tasks.filter((t) => isToday(t.dueDate, now));
  }
}

/**
 * Pure: sort tasks. Returns a new array; never mutates the input.
 *
 * - `created`: createdAt desc
 * - `priority`: weight desc, then createdAt desc
 * - `dueDate`: dueDate asc with `null` last, then createdAt desc
 */
export function applySort(tasks: readonly TaskItem[], sort: TaskSort): readonly TaskItem[] {
  const copy = [...tasks];
  switch (sort) {
    case 'created':
      copy.sort((a, b) => b.createdAt - a.createdAt);
      return copy;
    case 'priority':
      copy.sort((a, b) => {
        const w = priorityWeight(b.priority) - priorityWeight(a.priority);
        if (w !== 0) return w;
        return b.createdAt - a.createdAt;
      });
      return copy;
    case 'dueDate':
      copy.sort((a, b) => {
        const aNull = a.dueDate === null;
        const bNull = b.dueDate === null;
        if (aNull && bNull) return b.createdAt - a.createdAt;
        if (aNull) return 1;
        if (bNull) return -1;
        const d = (a.dueDate as number) - (b.dueDate as number);
        if (d !== 0) return d;
        return b.createdAt - a.createdAt;
      });
      return copy;
  }
}

/**
 * Pure: filter then sort.
 */
export function applyQuery(
  tasks: readonly TaskItem[],
  filter: TaskFilter,
  sort: TaskSort,
  now: number,
): readonly TaskItem[] {
  return applySort(applyFilter(tasks, filter, now), sort);
}

export interface FetchDescriptorShape {
  predicate: TaskFilter;
  sortBy: TaskSort;
  /** Reference timestamp used by the `today` predicate. */
  now: number;
}

/**
 * Pure: serialisable mirror of a Swift `FetchDescriptor<TaskItem>`.
 * The Swift side converts this back into a real predicate and
 * `SortDescriptor`s.
 */
export function buildFetchDescriptor(
  filter: TaskFilter,
  sort: TaskSort,
  now: number,
): FetchDescriptorShape {
  return { predicate: filter, sortBy: sort, now };
}
