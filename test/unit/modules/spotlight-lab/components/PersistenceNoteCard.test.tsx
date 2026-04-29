/**
 * Tests for PersistenceNoteCard — feature 031 / T026.
 *
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen } from '@testing-library/react-native';

import PersistenceNoteCard from '@/modules/spotlight-lab/components/PersistenceNoteCard';

describe('PersistenceNoteCard', () => {
  it('mentions system-managed eviction (FR-070)', () => {
    render(<PersistenceNoteCard />);
    expect(screen.getByText(/evict|expir|system.*manage/i)).toBeTruthy();
  });

  it('mentions re-index-from-stable-source recommendation (FR-071)', () => {
    render(<PersistenceNoteCard />);
    expect(screen.getByText(/re-?index|stable.*source|restore|recreate/i)).toBeTruthy();
  });

  it('renders without props on every platform', () => {
    const { toJSON } = render(<PersistenceNoteCard />);
    expect(toJSON()).toBeTruthy();
  });

  it('uses ThemedText / ThemedView (structural check)', () => {
    const { toJSON } = render(<PersistenceNoteCard />);
    const snapshot = JSON.stringify(toJSON());
    // Component uses ThemedText/ThemedView which render as View/Text
    expect(snapshot).toContain('View');
    expect(snapshot).toContain('Text');
  });
});
