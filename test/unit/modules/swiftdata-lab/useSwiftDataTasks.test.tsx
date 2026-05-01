/**
 * useSwiftDataTasks Hook Test
 * Feature: 053-swiftdata
 *
 * Exercises CRUD, filter, sort, derived stats, and error paths.
 */

import { renderHook, act } from '@testing-library/react-native';
import { describe, expect, it, beforeEach, afterEach, jest } from '@jest/globals';

import {
  __setSwiftDataBridgeForTests,
  useSwiftDataTasks,
} from '@/modules/swiftdata-lab/hooks/useSwiftDataTasks';
import type {
  Priority,
  SchemaInfo,
  SwiftDataBridge,
  TaskDraft,
  TaskItem,
} from '@/native/swiftdata.types';

const noon = new Date(2025, 5, 15, 12, 0, 0).getTime();
const morning = new Date(2025, 5, 15, 6, 0, 0).getTime();
const tomorrow = new Date(2025, 5, 16, 8, 0, 0).getTime();

const sample = (id: string, opts: Partial<Omit<TaskItem, 'id'>> = {}): TaskItem => ({
  id,
  title: `t-${id}`,
  completed: false,
  priority: 'medium' as Priority,
  dueDate: null,
  createdAt: 1,
  updatedAt: 1,
  ...opts,
});

describe('useSwiftDataTasks', () => {
  let bridge: SwiftDataBridge;
  let initialTasks: TaskItem[];

  beforeEach(() => {
    initialTasks = [
      sample('a', { priority: 'high', createdAt: 5, dueDate: morning }),
      sample('b', { priority: 'low', completed: true, createdAt: 9 }),
      sample('c', { priority: 'medium', createdAt: 1, dueDate: tomorrow }),
    ];
    const schema: SchemaInfo = {
      available: true,
      containerName: 'SwiftDataLab.store',
      modelNames: ['TaskItem'],
    };
    bridge = {
      getSchemaInfo: jest.fn(async (): Promise<SchemaInfo> => schema),
      fetchTasks: jest.fn(async (): Promise<readonly TaskItem[]> => initialTasks),
      createTask: jest.fn(
        async (draft: TaskDraft): Promise<TaskItem> => ({
          id: 'new',
          title: draft.title,
          completed: draft.completed ?? false,
          priority: draft.priority ?? 'medium',
          dueDate: draft.dueDate ?? null,
          createdAt: 100,
          updatedAt: 100,
        }),
      ),
      updateTask: jest.fn(async (id: string, patch: Partial<TaskDraft>): Promise<TaskItem> => {
        const found = initialTasks.find((t) => t.id === id);
        return {
          id,
          title: patch.title ?? found?.title ?? 'x',
          completed: patch.completed ?? found?.completed ?? false,
          priority: patch.priority ?? found?.priority ?? 'medium',
          dueDate: patch.dueDate ?? found?.dueDate ?? null,
          createdAt: found?.createdAt ?? 1,
          updatedAt: 200,
        };
      }),
      deleteTask: jest.fn(async (_id: string): Promise<void> => {}),
    };
    __setSwiftDataBridgeForTests(bridge);
  });

  afterEach(() => {
    __setSwiftDataBridgeForTests(null);
  });

  it('initial state is empty / idle', () => {
    bridge.fetchTasks = jest.fn(async (): Promise<readonly TaskItem[]> => []);
    const schema: SchemaInfo = { available: false, containerName: '', modelNames: [] };
    bridge.getSchemaInfo = jest.fn(async () => schema);
    __setSwiftDataBridgeForTests(bridge);
    const { result } = renderHook(() => useSwiftDataTasks({ now: () => noon }));
    expect(result.current.tasks).toEqual([]);
    expect(result.current.filter).toBe('all');
    expect(result.current.sort).toBe('created');
    expect(result.current.lastError).toBeNull();
  });

  it('refreshSchema and refreshTasks populate state when called', async () => {
    const { result } = renderHook(() => useSwiftDataTasks({ now: () => noon }));
    await act(async () => {
      await result.current.refreshSchema();
      await result.current.refreshTasks();
    });
    expect(bridge.getSchemaInfo).toHaveBeenCalledTimes(1);
    expect(bridge.fetchTasks).toHaveBeenCalledTimes(1);
    expect(result.current.tasks.map((t) => t.id)).toEqual(['a', 'b', 'c']);
    expect(result.current.schema?.available).toBe(true);
  });

  it('refreshSchema records error and clears schema', async () => {
    bridge.getSchemaInfo = jest.fn(async () => {
      throw new Error('schema-failed');
    });
    __setSwiftDataBridgeForTests(bridge);
    const { result } = renderHook(() => useSwiftDataTasks({ now: () => noon }));
    await act(async () => {
      await result.current.refreshSchema();
    });
    expect(result.current.schema).toBeNull();
    expect(result.current.lastError?.message).toBe('schema-failed');
  });

  it('refreshTasks records error and resets loading', async () => {
    bridge.fetchTasks = jest.fn(async () => {
      throw new Error('fetch-failed');
    });
    __setSwiftDataBridgeForTests(bridge);
    const { result } = renderHook(() => useSwiftDataTasks({ now: () => noon }));
    await act(async () => {
      await result.current.refreshTasks();
    });
    expect(result.current.lastError?.message).toBe('fetch-failed');
    expect(result.current.loading).toBe(false);
  });

  it('createTask prepends the new task', async () => {
    const { result } = renderHook(() => useSwiftDataTasks({ now: () => noon }));
    await act(async () => {
      await result.current.refreshTasks();
    });
    await act(async () => {
      await result.current.createTask({ title: 'fresh' });
    });
    expect(result.current.tasks[0]?.id).toBe('new');
    expect(result.current.tasks).toHaveLength(4);
  });

  it('createTask error path returns null and records error', async () => {
    bridge.createTask = jest.fn(async () => {
      throw new Error('create-failed');
    });
    __setSwiftDataBridgeForTests(bridge);
    const { result } = renderHook(() => useSwiftDataTasks({ now: () => noon }));
    let returned: TaskItem | null = sample('placeholder');
    await act(async () => {
      returned = await result.current.createTask({ title: 'x' });
    });
    expect(returned).toBeNull();
    expect(result.current.lastError?.message).toBe('create-failed');
  });

  it('updateTask replaces the existing task', async () => {
    const { result } = renderHook(() => useSwiftDataTasks({ now: () => noon }));
    await act(async () => {
      await result.current.refreshTasks();
    });
    await act(async () => {
      await result.current.updateTask('a', { title: 'changed' });
    });
    const a = result.current.tasks.find((t) => t.id === 'a');
    expect(a?.title).toBe('changed');
  });

  it('updateTask error path', async () => {
    bridge.updateTask = jest.fn(async () => {
      throw new Error('update-failed');
    });
    __setSwiftDataBridgeForTests(bridge);
    const { result } = renderHook(() => useSwiftDataTasks({ now: () => noon }));
    await act(async () => {
      await result.current.updateTask('a', { title: 'x' });
    });
    expect(result.current.lastError?.message).toBe('update-failed');
  });

  it('deleteTask removes the task', async () => {
    const { result } = renderHook(() => useSwiftDataTasks({ now: () => noon }));
    await act(async () => {
      await result.current.refreshTasks();
    });
    await act(async () => {
      await result.current.deleteTask('a');
    });
    expect(result.current.tasks.map((t) => t.id)).toEqual(['b', 'c']);
  });

  it('deleteTask error path', async () => {
    bridge.deleteTask = jest.fn(async () => {
      throw new Error('delete-failed');
    });
    __setSwiftDataBridgeForTests(bridge);
    const { result } = renderHook(() => useSwiftDataTasks({ now: () => noon }));
    await act(async () => {
      await result.current.deleteTask('a');
    });
    expect(result.current.lastError?.message).toBe('delete-failed');
  });

  it('toggleCompleted flips the completed flag via updateTask', async () => {
    const { result } = renderHook(() => useSwiftDataTasks({ now: () => noon }));
    await act(async () => {
      await result.current.refreshTasks();
    });
    await act(async () => {
      await result.current.toggleCompleted('a');
    });
    const a = result.current.tasks.find((t) => t.id === 'a');
    expect(a?.completed).toBe(true);
  });

  it('toggleCompleted is a no-op when the id does not exist', async () => {
    const { result } = renderHook(() => useSwiftDataTasks({ now: () => noon }));
    await act(async () => {
      await result.current.refreshTasks();
    });
    let returned: TaskItem | null = sample('placeholder');
    await act(async () => {
      returned = await result.current.toggleCompleted('does-not-exist');
    });
    expect(returned).toBeNull();
  });

  it('setFilter recomputes visibleTasks ("active")', async () => {
    const { result } = renderHook(() => useSwiftDataTasks({ now: () => noon }));
    await act(async () => {
      await result.current.refreshTasks();
    });
    act(() => {
      result.current.setFilter('active');
    });
    expect(result.current.visibleTasks.every((t) => !t.completed)).toBe(true);
    expect(result.current.visibleTasks.map((t) => t.id)).toEqual(['a', 'c']);
  });

  it('setFilter "today" honours the pinned clock', async () => {
    const { result } = renderHook(() => useSwiftDataTasks({ now: () => noon }));
    await act(async () => {
      await result.current.refreshTasks();
    });
    act(() => {
      result.current.setFilter('today');
    });
    // Only "a" has dueDate=morning of the pinned day.
    expect(result.current.visibleTasks.map((t) => t.id)).toEqual(['a']);
  });

  it('setSort "priority" reorders visibleTasks', async () => {
    const { result } = renderHook(() => useSwiftDataTasks({ now: () => noon }));
    await act(async () => {
      await result.current.refreshTasks();
    });
    act(() => {
      result.current.setSort('priority');
    });
    expect(result.current.visibleTasks.map((t) => t.id)).toEqual(['a', 'c', 'b']);
  });

  it('stats reflects the current task list', async () => {
    const { result } = renderHook(() => useSwiftDataTasks({ now: () => noon }));
    await act(async () => {
      await result.current.refreshTasks();
    });
    expect(result.current.stats.total).toBe(3);
    expect(result.current.stats.completed).toBe(1);
    expect(result.current.stats.byPriority).toEqual({ low: 1, medium: 1, high: 1 });
  });
});
