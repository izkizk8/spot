/**
 * query-builder Test
 * Feature: 053-swiftdata
 */

import { describe, expect, it } from '@jest/globals';

import {
  applyFilter,
  applyQuery,
  applySort,
  buildFetchDescriptor,
  priorityWeight,
} from '@/modules/swiftdata-lab/query-builder';
import type { Priority, TaskItem } from '@/native/swiftdata.types';

const noon = new Date(2025, 5, 15, 12, 0, 0).getTime();
const morning = new Date(2025, 5, 15, 6, 0, 0).getTime();
const tomorrow = new Date(2025, 5, 16, 8, 0, 0).getTime();
const yesterday = new Date(2025, 5, 14, 8, 0, 0).getTime();

const make = (id: string, opts: Partial<Omit<TaskItem, 'id'>> = {}): TaskItem => ({
  id,
  title: id,
  completed: false,
  priority: 'medium',
  dueDate: null,
  createdAt: 100,
  updatedAt: 100,
  ...opts,
});

describe('priorityWeight', () => {
  it('orders high > medium > low', () => {
    expect(priorityWeight('high')).toBeGreaterThan(priorityWeight('medium'));
    expect(priorityWeight('medium')).toBeGreaterThan(priorityWeight('low'));
  });

  it.each(['low', 'medium', 'high'] as const)('returns a positive weight for %s', (p: Priority) => {
    expect(priorityWeight(p)).toBeGreaterThan(0);
  });
});

describe('applyFilter', () => {
  const tasks: readonly TaskItem[] = [
    make('a', { completed: false }),
    make('b', { completed: true }),
    make('c', { completed: false, dueDate: morning }),
    make('d', { completed: true, dueDate: tomorrow }),
    make('e', { dueDate: yesterday }),
  ];

  it('"all" returns the full list', () => {
    expect(applyFilter(tasks, 'all', noon).map((t) => t.id)).toEqual(['a', 'b', 'c', 'd', 'e']);
  });

  it('"active" keeps only !completed', () => {
    expect(applyFilter(tasks, 'active', noon).map((t) => t.id)).toEqual(['a', 'c', 'e']);
  });

  it('"completed" keeps only completed', () => {
    expect(applyFilter(tasks, 'completed', noon).map((t) => t.id)).toEqual(['b', 'd']);
  });

  it('"today" keeps only tasks whose dueDate is in the local day window of `now`', () => {
    expect(applyFilter(tasks, 'today', noon).map((t) => t.id)).toEqual(['c']);
  });
});

describe('applySort', () => {
  it('"created" sorts by createdAt desc', () => {
    const sorted = applySort(
      [make('a', { createdAt: 1 }), make('b', { createdAt: 3 }), make('c', { createdAt: 2 })],
      'created',
    );
    expect(sorted.map((t) => t.id)).toEqual(['b', 'c', 'a']);
  });

  it('"priority" sorts by weight desc, ties broken by createdAt desc', () => {
    const sorted = applySort(
      [
        make('low', { priority: 'low', createdAt: 9 }),
        make('high1', { priority: 'high', createdAt: 1 }),
        make('high2', { priority: 'high', createdAt: 5 }),
        make('med', { priority: 'medium', createdAt: 2 }),
      ],
      'priority',
    );
    expect(sorted.map((t) => t.id)).toEqual(['high2', 'high1', 'med', 'low']);
  });

  it('"dueDate" sorts asc with null last, ties broken by createdAt desc', () => {
    const sorted = applySort(
      [
        make('null1', { dueDate: null, createdAt: 1 }),
        make('null2', { dueDate: null, createdAt: 5 }),
        make('mid', { dueDate: 200, createdAt: 1 }),
        make('early', { dueDate: 100, createdAt: 1 }),
      ],
      'dueDate',
    );
    expect(sorted.map((t) => t.id)).toEqual(['early', 'mid', 'null2', 'null1']);
  });

  it('returns a new array; never mutates the input', () => {
    const original = [make('a', { createdAt: 1 }), make('b', { createdAt: 2 })];
    const ids = original.map((t) => t.id);
    applySort(original, 'created');
    expect(original.map((t) => t.id)).toEqual(ids);
  });
});

describe('applyQuery', () => {
  it('composes filter then sort', () => {
    const tasks = [
      make('a', { completed: false, priority: 'low', createdAt: 5 }),
      make('b', { completed: true, priority: 'high', createdAt: 9 }),
      make('c', { completed: false, priority: 'high', createdAt: 1 }),
    ];
    expect(applyQuery(tasks, 'active', 'priority', noon).map((t) => t.id)).toEqual(['c', 'a']);
  });
});

describe('buildFetchDescriptor', () => {
  it('returns the serialisable shape', () => {
    expect(buildFetchDescriptor('today', 'priority', 1234)).toEqual({
      predicate: 'today',
      sortBy: 'priority',
      now: 1234,
    });
  });
});
