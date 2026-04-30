/**
 * Core Data + CloudKit Lab Screen Test (iOS)
 * Feature: 052-core-data-cloudkit
 */

import { render, screen } from '@testing-library/react-native';
import { describe, expect, it, jest } from '@jest/globals';
import React from 'react';
import { Platform } from 'react-native';

Platform.OS = 'ios';
Platform.Version = 17;

const baseStore = {
  accountStatus: 'available' as const,
  syncState: 'synced' as const,
  notes: [],
  loading: false,
  lastError: null,
  refreshAccount: jest.fn(),
  refreshNotes: jest.fn(),
  createNote: jest.fn(),
  updateNote: jest.fn(),
  deleteNote: jest.fn(),
  simulateConflict: jest.fn(),
};

const mockUseNotesStore = jest.fn(() => baseStore);

jest.mock('@/modules/coredata-cloudkit-lab/hooks/useNotesStore', () => ({
  useNotesStore: mockUseNotesStore,
}));

describe('CoreDataCloudKitLabScreen (iOS)', () => {
  it('renders all sections', () => {
    const Screen = require('@/modules/coredata-cloudkit-lab/screen').default;
    render(<Screen />);
    expect(screen.getByText(/CloudKit Account Status/i)).toBeTruthy();
    expect(screen.getByText(/Notes/)).toBeTruthy();
    expect(screen.getByText(/New Note/i)).toBeTruthy();
    expect(screen.getByText(/Conflict Demo/i)).toBeTruthy();
    expect(screen.getByText(/Schema Migration/i)).toBeTruthy();
    expect(screen.getByText(/Setup Instructions/i)).toBeTruthy();
  });

  it('calls refreshAccount and refreshNotes on mount', () => {
    const refreshAccount = jest.fn();
    const refreshNotes = jest.fn();
    mockUseNotesStore.mockReturnValueOnce({
      ...baseStore,
      refreshAccount,
      refreshNotes,
    });
    const Screen = require('@/modules/coredata-cloudkit-lab/screen').default;
    render(<Screen />);
    expect(refreshAccount).toHaveBeenCalled();
    expect(refreshNotes).toHaveBeenCalled();
  });
});
