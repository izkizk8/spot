/**
 * TaskRow Test
 * Feature: 053-swiftdata
 */

import { fireEvent, render, screen } from '@testing-library/react-native';
import { describe, expect, it, jest } from '@jest/globals';
import React from 'react';

import TaskRow from '@/modules/swiftdata-lab/components/TaskRow';
import type { TaskItem } from '@/native/swiftdata.types';

const base: TaskItem = {
  id: 'a',
  title: 'Walk dog',
  completed: false,
  priority: 'high',
  dueDate: null,
  createdAt: 1,
  updatedAt: 1,
};

describe('TaskRow', () => {
  it('renders title and the priority pill', () => {
    render(<TaskRow task={base} />);
    expect(screen.getByText('Walk dog')).toBeTruthy();
    expect(screen.getByText('High')).toBeTruthy();
  });

  it('shows "No due date" when dueDate is null', () => {
    render(<TaskRow task={base} />);
    expect(screen.getByText(/No due date/)).toBeTruthy();
  });

  it('formats the due date when set', () => {
    const due = new Date(2025, 0, 5).getTime();
    render(<TaskRow task={{ ...base, dueDate: due }} />);
    expect(screen.getByText(/Due 2025-01-05/)).toBeTruthy();
  });

  it('fires onToggle / onEdit / onDelete', () => {
    const onToggle = jest.fn();
    const onEdit = jest.fn();
    const onDelete = jest.fn();
    render(<TaskRow task={base} onToggle={onToggle} onEdit={onEdit} onDelete={onDelete} />);
    fireEvent.press(screen.getByLabelText(/Mark complete/));
    fireEvent.press(screen.getByText('Edit'));
    fireEvent.press(screen.getByText('Delete'));
    expect(onToggle).toHaveBeenCalledWith(base);
    expect(onEdit).toHaveBeenCalledWith(base);
    expect(onDelete).toHaveBeenCalledWith(base);
  });

  it('toggle label switches when completed', () => {
    render(<TaskRow task={{ ...base, completed: true }} />);
    expect(screen.getByLabelText(/Mark incomplete/)).toBeTruthy();
  });
});
