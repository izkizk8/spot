/**
 * NoteRow Test
 * Feature: 052-core-data-cloudkit
 */

import { fireEvent, render, screen } from '@testing-library/react-native';
import { describe, expect, it, jest } from '@jest/globals';
import React from 'react';

import NoteRow from '@/modules/coredata-cloudkit-lab/components/NoteRow';

const note = {
  id: 'a',
  title: 'My note',
  body: 'Body content',
  createdAt: 1,
  updatedAt: 2,
};

describe('NoteRow', () => {
  it('renders the title and body preview', () => {
    render(<NoteRow note={note} />);
    expect(screen.getByText('My note')).toBeTruthy();
    expect(screen.getByText('Body content')).toBeTruthy();
  });

  it('triggers onEdit when Edit is pressed', () => {
    const onEdit = jest.fn();
    render(<NoteRow note={note} onEdit={onEdit} />);
    fireEvent.press(screen.getByText('Edit'));
    expect(onEdit).toHaveBeenCalledWith(note);
  });

  it('triggers onDelete when Delete is pressed', () => {
    const onDelete = jest.fn();
    render(<NoteRow note={note} onDelete={onDelete} />);
    fireEvent.press(screen.getByText('Delete'));
    expect(onDelete).toHaveBeenCalledWith(note);
  });

  it('handles missing handlers without throwing', () => {
    render(<NoteRow note={note} />);
    expect(() => fireEvent.press(screen.getByText('Edit'))).not.toThrow();
    expect(() => fireEvent.press(screen.getByText('Delete'))).not.toThrow();
  });
});
