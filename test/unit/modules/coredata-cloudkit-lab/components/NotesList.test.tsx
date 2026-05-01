/**
 * NotesList Test
 * Feature: 052-core-data-cloudkit
 */

import { render, screen } from '@testing-library/react-native';
import { describe, expect, it } from '@jest/globals';
import React from 'react';

import NotesList from '@/modules/coredata-cloudkit-lab/components/NotesList';

describe('NotesList', () => {
  it('renders the empty state when there are no notes', () => {
    render(<NotesList notes={[]} />);
    expect(screen.getByText(/No notes yet/i)).toBeTruthy();
  });

  it('renders a loading state when loading', () => {
    render(<NotesList notes={[]} loading />);
    expect(screen.getByText(/Loading/i)).toBeTruthy();
  });

  it('renders a row for each note', () => {
    render(
      <NotesList
        notes={[
          { id: 'a', title: 'First', body: 'fa', createdAt: 1, updatedAt: 1 },
          { id: 'b', title: 'Second', body: 'fb', createdAt: 1, updatedAt: 1 },
        ]}
      />,
    );
    expect(screen.getByText('First')).toBeTruthy();
    expect(screen.getByText('Second')).toBeTruthy();
  });
});
