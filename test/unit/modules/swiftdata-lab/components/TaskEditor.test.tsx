/**
 * TaskEditor Test
 * Feature: 053-swiftdata
 */

import { fireEvent, render, screen } from '@testing-library/react-native';
import { describe, expect, it, jest } from '@jest/globals';
import React from 'react';

import TaskEditor from '@/modules/swiftdata-lab/components/TaskEditor';

describe('TaskEditor', () => {
  it('renders the New Task title for empty editor', () => {
    render(<TaskEditor onSubmit={jest.fn()} />);
    expect(screen.getByText(/New Task/i)).toBeTruthy();
  });

  it('renders the Edit Task title when initial is provided', () => {
    render(
      <TaskEditor
        initial={{
          id: 'a',
          title: 'T',
          completed: false,
          priority: 'high',
          dueDate: null,
          createdAt: 1,
          updatedAt: 2,
        }}
        onSubmit={jest.fn()}
      />,
    );
    expect(screen.getByText(/Edit Task/i)).toBeTruthy();
  });

  it('submits the entered title and selected priority', () => {
    const onSubmit = jest.fn();
    render(<TaskEditor onSubmit={onSubmit} />);
    fireEvent.changeText(screen.getByPlaceholderText('Title'), 'Buy bread');
    fireEvent.press(screen.getByLabelText('Priority High'));
    fireEvent.press(screen.getByText('Create'));
    expect(onSubmit).toHaveBeenCalledWith({
      title: 'Buy bread',
      completed: false,
      priority: 'high',
      dueDate: null,
    });
  });

  it('parses a numeric due date', () => {
    const onSubmit = jest.fn();
    render(<TaskEditor onSubmit={onSubmit} />);
    fireEvent.changeText(screen.getByPlaceholderText('Title'), 'Pay bill');
    fireEvent.changeText(screen.getByLabelText(/Due date/i), '12345');
    fireEvent.press(screen.getByText('Create'));
    expect(onSubmit).toHaveBeenCalledWith({
      title: 'Pay bill',
      completed: false,
      priority: 'medium',
      dueDate: 12345,
    });
  });

  it('treats a non-numeric due date as null', () => {
    const onSubmit = jest.fn();
    render(<TaskEditor onSubmit={onSubmit} />);
    fireEvent.changeText(screen.getByPlaceholderText('Title'), 'X');
    fireEvent.changeText(screen.getByLabelText(/Due date/i), 'not-a-number');
    fireEvent.press(screen.getByText('Create'));
    expect(onSubmit).toHaveBeenCalledWith({
      title: 'X',
      completed: false,
      priority: 'medium',
      dueDate: null,
    });
  });

  it('renders Cancel only when onCancel is supplied', () => {
    const onCancel = jest.fn();
    const { rerender } = render(<TaskEditor onSubmit={jest.fn()} />);
    expect(screen.queryByText('Cancel')).toBeNull();
    rerender(<TaskEditor onSubmit={jest.fn()} onCancel={onCancel} />);
    fireEvent.press(screen.getByText('Cancel'));
    expect(onCancel).toHaveBeenCalled();
  });
});
