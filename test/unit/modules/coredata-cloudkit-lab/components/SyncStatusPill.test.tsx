/**
 * SyncStatusPill Test
 * Feature: 052-core-data-cloudkit
 */

import { render, screen } from '@testing-library/react-native';
import { describe, expect, it } from '@jest/globals';
import React from 'react';

import SyncStatusPill from '@/modules/coredata-cloudkit-lab/components/SyncStatusPill';

describe('SyncStatusPill', () => {
  it('renders the synced label', () => {
    render(<SyncStatusPill state="synced" />);
    expect(screen.getByText('Synced')).toBeTruthy();
  });

  it('renders the syncing label with ellipsis', () => {
    render(<SyncStatusPill state="syncing" />);
    expect(screen.getByText(/Syncing/i)).toBeTruthy();
  });

  it('renders the offline label', () => {
    render(<SyncStatusPill state="offline" />);
    expect(screen.getByText('Offline')).toBeTruthy();
  });

  it('renders the error label', () => {
    render(<SyncStatusPill state="error" />);
    expect(screen.getByText('Error')).toBeTruthy();
  });
});
