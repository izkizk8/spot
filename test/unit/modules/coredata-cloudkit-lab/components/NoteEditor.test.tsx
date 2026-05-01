/**
 * NoteEditor Test
 * Feature: 052-core-data-cloudkit
 */

import { fireEvent, render, screen } from '@testing-library/react-native';
import { describe, expect, it, jest } from '@jest/globals';
import React from 'react';

import NoteEditor from '@/modules/coredata-cloudkit-lab/components/NoteEditor';

describe('NoteEditor', () => {
  it('renders the New Note title for empty editor', () => {
    render(<NoteEditor onSubmit={jest.fn()} />);
    expect(screen.getByText(/New Note/i)).toBeTruthy();
  });

  it('renders the Edit Note title when initial is provided', () => {
    render(
      <NoteEditor
        initial={{
          id: 'a',
          title: 'T',
          body: 'B',
          createdAt: 1,
          updatedAt: 2,
        }}
        onSubmit={jest.fn()}
      />,
    );
    expect(screen.getByText(/Edit Note/i)).toBeTruthy();
  });

  it('submits the entered title and body', () => {
    const onSubmit = jest.fn();
    render(<NoteEditor onSubmit={onSubmit} />);
    fireEvent.changeText(screen.getByPlaceholderText('Title'), 'Hello');
    fireEvent.changeText(screen.getByPlaceholderText('Body'), 'World');
    fireEvent.press(screen.getByText('Create'));
    expect(onSubmit).toHaveBeenCalledWith({ title: 'Hello', body: 'World' });
  });

  it('renders Cancel only when onCancel is supplied', () => {
    const onCancel = jest.fn();
    const { rerender } = render(<NoteEditor onSubmit={jest.fn()} />);
    expect(screen.queryByText('Cancel')).toBeNull();
    rerender(<NoteEditor onSubmit={jest.fn()} onCancel={onCancel} />);
    fireEvent.press(screen.getByText('Cancel'));
    expect(onCancel).toHaveBeenCalled();
  });
});
