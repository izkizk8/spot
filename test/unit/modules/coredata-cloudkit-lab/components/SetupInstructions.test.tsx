/**
 * SetupInstructions Test
 * Feature: 052-core-data-cloudkit
 */

import { render, screen } from '@testing-library/react-native';
import { describe, expect, it } from '@jest/globals';
import React from 'react';

import SetupInstructions from '@/modules/coredata-cloudkit-lab/components/SetupInstructions';

describe('SetupInstructions', () => {
  it('renders the title', () => {
    render(<SetupInstructions />);
    expect(screen.getByText(/Setup Instructions/i)).toBeTruthy();
  });

  it('mentions iCloud container configuration', () => {
    render(<SetupInstructions />);
    expect(screen.getByText(/iCloud container/i)).toBeTruthy();
  });

  it('mentions NSPersistentCloudKitContainer', () => {
    render(<SetupInstructions />);
    expect(screen.getByText(/NSPersistentCloudKitContainer/i)).toBeTruthy();
  });

  it('mentions NSPersistentStoreRemoteChange', () => {
    render(<SetupInstructions />);
    expect(screen.getByText(/NSPersistentStoreRemoteChange/i)).toBeTruthy();
  });
});
