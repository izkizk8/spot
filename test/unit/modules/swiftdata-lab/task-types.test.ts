/**
 * task-types Test
 * Feature: 053-swiftdata
 */

import { describe, expect, it } from '@jest/globals';

import {
  DEFAULT_PRIORITY,
  EMPTY_TITLE,
  computeStats,
  createDraft,
  isTaskItem,
  isToday,
} from '@/modules/swiftdata-lab/task-types';
import type { TaskItem } from '@/native/swiftdata.types';

describe('createDraft', () => {
  it('returns defaults when called with no argument', () => {
    expect(createDraft()).toEqual({
      title: EMPTY_TITLE,
      completed: false,
      priority: DEFAULT_PRIORITY,
      dueDate: null,
    });
  });

  it('trims the title', () => {
    expect(createDraft({ title: '  Hello  ' }).title).toBe('Hello');
  });

  it('falls back to EMPTY_TITLE for blank titles', () => {
    expect(createDraft({ title: '   ' }).title).toBe(EMPTY_TITLE);
    expect(createDraft({ title: '' }).title).toBe(EMPTY_TITLE);
  });

  it('passes priority and completed through', () => {
    expect(createDraft({ priority: 'high', completed: true })).toMatchObject({
      priority: 'high',
      completed: true,
    });
  });

  it('preserves explicit null dueDate', () => {
    expect(createDraft({ dueDate: null }).dueDate).toBeNull();
  });

  it('preserves explicit numeric dueDate', () => {
    expect(createDraft({ dueDate: 1234 }).dueDate).toBe(1234);
  });

  it('produces a fresh object on every call', () => {
    const a = createDraft();
    const b = createDraft();
    expect(a).not.toBe(b);
  });
});

describe('isTaskItem', () => {
  const validTask: TaskItem = {
    id: 'a',
    title: 't',
    completed: false,
    priority: 'medium',
    dueDate: null,
    createdAt: 1,
    updatedAt: 2,
  };

  it('accepts a fully-typed task', () => {
    expect(isTaskItem(validTask)).toBe(true);
  });

  it('accepts a task with a numeric dueDate', () => {
    expect(isTaskItem({ ...validTask, dueDate: 100 })).toBe(true);
  });

  it('rejects a missing field', () => {
    const { id: _id, ...rest } = validTask;
    expect(isTaskItem(rest)).toBe(false);
  });

  it('rejects an unknown priority', () => {
    expect(isTaskItem({ ...validTask, priority: 'urgent' })).toBe(false);
  });

  it('rejects a wrong-typed dueDate', () => {
    expect(isTaskItem({ ...validTask, dueDate: 'tomorrow' })).toBe(false);
  });

  it('rejects null and primitives', () => {
    expect(isTaskItem(null)).toBe(false);
    expect(isTaskItem(undefined)).toBe(false);
    expect(isTaskItem('task')).toBe(false);
    expect(isTaskItem(7)).toBe(false);
  });
});

describe('isToday', () => {
  // Pin "now" to noon on 2025-06-15 local time.
  const noon = new Date(2025, 5, 15, 12, 0, 0).getTime();
  const sameDayMorning = new Date(2025, 5, 15, 6, 0, 0).getTime();
  const sameDayJustBeforeMidnight = new Date(2025, 5, 15, 23, 59, 59, 999).getTime();
  const yesterdayLate = new Date(2025, 5, 14, 23, 59, 59).getTime();
  const tomorrow = new Date(2025, 5, 16, 0, 0, 1).getTime();

  it('rejects null / undefined dueDate', () => {
    expect(isToday(null, noon)).toBe(false);
    expect(isToday(undefined, noon)).toBe(false);
  });

  it('accepts same-day morning', () => {
    expect(isToday(sameDayMorning, noon)).toBe(true);
  });

  it('accepts same-day just before midnight', () => {
    expect(isToday(sameDayJustBeforeMidnight, noon)).toBe(true);
  });

  it('rejects yesterday late evening', () => {
    expect(isToday(yesterdayLate, noon)).toBe(false);
  });

  it('rejects tomorrow', () => {
    expect(isToday(tomorrow, noon)).toBe(false);
  });
});

const makeStat = (
  id: string,
  priority: 'low' | 'medium' | 'high',
  completed: boolean,
): TaskItem => ({
  id,
  title: id,
  completed,
  priority,
  dueDate: null,
  createdAt: 1,
  updatedAt: 1,
});

describe('computeStats', () => {
  it('returns zeros for an empty list', () => {
    const s = computeStats([]);
    expect(s.total).toBe(0);
    expect(s.active).toBe(0);
    expect(s.completed).toBe(0);
    expect(s.completionRate).toBe(0);
    expect(s.byPriority).toEqual({ low: 0, medium: 0, high: 0 });
  });

  it('counts completion + priority', () => {
    const s = computeStats([
      makeStat('a', 'high', true),
      makeStat('b', 'high', false),
      makeStat('c', 'medium', true),
      makeStat('d', 'low', false),
    ]);
    expect(s.total).toBe(4);
    expect(s.completed).toBe(2);
    expect(s.active).toBe(2);
    expect(s.completionRate).toBe(0.5);
    expect(s.byPriority).toEqual({ low: 1, medium: 1, high: 2 });
  });

  it('completionRate lands in [0,1]', () => {
    expect(computeStats([makeStat('a', 'low', true)]).completionRate).toBe(1);
    expect(computeStats([makeStat('a', 'low', false)]).completionRate).toBe(0);
  });
});
