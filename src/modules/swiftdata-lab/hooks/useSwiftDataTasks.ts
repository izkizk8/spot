/**
 * useSwiftDataTasks Hook
 * Feature: 053-swiftdata
 *
 * State machine for the SwiftData lab. Tracks the schema info, the
 * TaskItem list, the current filter / sort selections, the derived
 * visible list, the derived stats panel, the loading flag, and the
 * last error. The native bridge is replaceable at the import
 * boundary via `__setSwiftDataBridgeForTests` for unit tests.
 */

import { useCallback, useMemo, useState } from 'react';

import swiftdataDefault from '@/native/swiftdata';
import type {
  SchemaInfo,
  SwiftDataBridge,
  TaskDraft,
  TaskFilter,
  TaskItem,
  TaskSort,
} from '@/native/swiftdata.types';

import { applyQuery } from '../query-builder';
import { computeStats, type TaskStats } from '../task-types';

let mockBridge: SwiftDataBridge | null = null;

export function __setSwiftDataBridgeForTests(bridge: SwiftDataBridge | null) {
  mockBridge = bridge;
}

function getBridge(): SwiftDataBridge {
  if (mockBridge) return mockBridge;
  return swiftdataDefault;
}

interface UseSwiftDataTasksOptions {
  /**
   * Optional clock override used by the `today` filter. Defaults to
   * `Date.now`. Tests pin the clock via this hook.
   */
  now?: () => number;
}

export interface SwiftDataTasksState {
  schema: SchemaInfo | null;
  tasks: readonly TaskItem[];
  visibleTasks: readonly TaskItem[];
  filter: TaskFilter;
  sort: TaskSort;
  stats: TaskStats;
  loading: boolean;
  lastError: Error | null;
}

export interface SwiftDataTasksActions {
  setFilter: (filter: TaskFilter) => void;
  setSort: (sort: TaskSort) => void;
  refreshSchema: () => Promise<void>;
  refreshTasks: () => Promise<void>;
  createTask: (draft: TaskDraft) => Promise<TaskItem | null>;
  updateTask: (id: string, patch: Partial<TaskDraft>) => Promise<TaskItem | null>;
  deleteTask: (id: string) => Promise<void>;
  toggleCompleted: (id: string) => Promise<TaskItem | null>;
}

export function useSwiftDataTasks(
  options: UseSwiftDataTasksOptions = {},
): SwiftDataTasksState & SwiftDataTasksActions {
  const nowFn = options.now ?? Date.now;

  const [schema, setSchema] = useState<SchemaInfo | null>(null);
  const [tasks, setTasks] = useState<readonly TaskItem[]>([]);
  const [filter, setFilter] = useState<TaskFilter>('all');
  const [sort, setSort] = useState<TaskSort>('created');
  const [loading, setLoading] = useState(false);
  const [lastError, setLastError] = useState<Error | null>(null);

  const refreshSchema = useCallback(async () => {
    try {
      const bridge = getBridge();
      const info = await bridge.getSchemaInfo();
      setSchema(info);
    } catch (err) {
      setLastError(err as Error);
      setSchema(null);
    }
  }, []);

  const refreshTasks = useCallback(async () => {
    setLoading(true);
    setLastError(null);
    try {
      const bridge = getBridge();
      const list = await bridge.fetchTasks();
      setTasks(list);
    } catch (err) {
      setLastError(err as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  const createTask = useCallback(async (draft: TaskDraft): Promise<TaskItem | null> => {
    setLastError(null);
    try {
      const bridge = getBridge();
      const task = await bridge.createTask(draft);
      setTasks((prev) => [task, ...prev]);
      return task;
    } catch (err) {
      setLastError(err as Error);
      return null;
    }
  }, []);

  const updateTask = useCallback(
    async (id: string, patch: Partial<TaskDraft>): Promise<TaskItem | null> => {
      setLastError(null);
      try {
        const bridge = getBridge();
        const task = await bridge.updateTask(id, patch);
        setTasks((prev) => prev.map((t) => (t.id === id ? task : t)));
        return task;
      } catch (err) {
        setLastError(err as Error);
        return null;
      }
    },
    [],
  );

  const deleteTask = useCallback(async (id: string) => {
    setLastError(null);
    try {
      const bridge = getBridge();
      await bridge.deleteTask(id);
      setTasks((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      setLastError(err as Error);
    }
  }, []);

  const toggleCompleted = useCallback(
    async (id: string): Promise<TaskItem | null> => {
      const current = tasks.find((t) => t.id === id);
      if (!current) return null;
      return updateTask(id, { completed: !current.completed });
    },
    [tasks, updateTask],
  );

  // Derived list. Re-runs whenever the inputs change; the clock
  // override (`options.now`) is read on each render so tests can
  // pin time without re-running the hook.
  const visibleTasks = useMemo(
    () => applyQuery(tasks, filter, sort, nowFn()),
    [tasks, filter, sort, nowFn],
  );

  const stats = useMemo(() => computeStats(tasks), [tasks]);

  return {
    schema,
    tasks,
    visibleTasks,
    filter,
    sort,
    stats,
    loading,
    lastError,
    setFilter,
    setSort,
    refreshSchema,
    refreshTasks,
    createTask,
    updateTask,
    deleteTask,
    toggleCompleted,
  };
}
