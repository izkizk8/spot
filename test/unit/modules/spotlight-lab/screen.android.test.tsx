/**
 * Tests for spotlight-lab Android screen — feature 031 / T040.
 *
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen } from '@testing-library/react-native';

import * as bridge from '@/native/spotlight';

jest.mock('@/native/spotlight');

const mockBridge = bridge as jest.Mocked<typeof bridge>;

beforeEach(() => {
  jest.clearAllMocks();
  mockBridge.isAvailable.mockReturnValue(false);
  mockBridge.index.mockRejectedValue(new Error('Not available'));
  mockBridge.delete.mockRejectedValue(new Error('Not available'));
  mockBridge.deleteAll.mockRejectedValue(new Error('Not available'));
  mockBridge.markCurrentActivity.mockRejectedValue(new Error('Not available'));
});

describe('spotlight-lab screen (Android)', () => {
  it('renders IOSOnlyBanner, ExplainerCard, PersistenceNoteCard only (FR-011)', () => {
    const Screen = require('@/modules/spotlight-lab/screen.android').default;
    render(<Screen />);
    expect(screen.getAllByText(/Spotlight.*iOS 9/i).length).toBeGreaterThan(0);
    expect(screen.getByText('About Spotlight Indexing')).toBeTruthy();
    expect(screen.getByText('Persistence Note')).toBeTruthy();
  });

  it('IndexableItemsList, BulkActionsCard, SearchTestCard, UserActivityCard are absent', () => {
    const Screen = require('@/modules/spotlight-lab/screen.android').default;
    render(<Screen />);
    expect(screen.queryByText('Bulk Actions')).toBeNull();
    expect(screen.queryByText('Search Test')).toBeNull();
    expect(screen.queryByText('User Activity')).toBeNull();
    expect(screen.queryByText(/index all/i)).toBeNull();
  });

  it('no call to bridge mutating methods (FR-091 / US4 AS3)', () => {
    const Screen = require('@/modules/spotlight-lab/screen.android').default;
    render(<Screen />);
    expect(mockBridge.index).not.toHaveBeenCalled();
    expect(mockBridge.delete).not.toHaveBeenCalled();
    expect(mockBridge.deleteAll).not.toHaveBeenCalled();
    expect(mockBridge.markCurrentActivity).not.toHaveBeenCalled();
  });

  it('render is exception-free even if bridge throws on every call (FR-091)', () => {
    mockBridge.isAvailable.mockImplementation(() => {
      throw new Error('Bridge not available');
    });
    const Screen = require('@/modules/spotlight-lab/screen.android').default;
    expect(() => render(<Screen />)).not.toThrow();
    expect(screen.getByText('About Spotlight Indexing')).toBeTruthy();
  });
});
