/**
 * TasksList Test
 * Feature: 053-swiftdata
 */

import { render, screen } from '@testing-library/react-native';
import { describe, expect, it } from '@jest/globals';
import React from 'react';

import TasksList from '@/modules/swiftdata-lab/components/TasksList';
import type { TaskItem } from '@/native/swiftdata.types';

const make = (id: string): TaskItem => ({
  id,
  title: `Task ${id}`,
  completed: false,
  priority: 'medium',
  dueDate: null,
  createdAt: 1,
  updatedAt: 1,
});

describe('TasksList', () => {
  it('renders the empty state when there are no tasks', () => {
    render(<TasksList tasks={[]} />);
    expect(screen.getByText(/No tasks/i)).toBeTruthy();
  });

  it('renders the loading state when loading', () => {
    render(<TasksList tasks={[]} loading />);
    expect(screen.getByText(/Loading/i)).toBeTruthy();
  });

  it('honours a custom emptyLabel', () => {
    render(<TasksList tasks={[]} emptyLabel="Nothing matches the filter" />);
    expect(screen.getByText('Nothing matches the filter')).toBeTruthy();
  });

  it('renders a row for each task', () => {
    render(<TasksList tasks={[make('a'), make('b')]} />);
    expect(screen.getByText('Task a')).toBeTruthy();
    expect(screen.getByText('Task b')).toBeTruthy();
  });
});
