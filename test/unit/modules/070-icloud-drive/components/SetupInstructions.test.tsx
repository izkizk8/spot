/**
 * SetupInstructions Test
 * Feature: 070-icloud-drive
 */

import { render, screen } from '@testing-library/react-native';
import { describe, expect, it } from '@jest/globals';
import React from 'react';

import SetupInstructions from '@/modules/icloud-drive-lab/components/SetupInstructions';

describe('SetupInstructions', () => {
  it('renders the title', () => {
    render(<SetupInstructions />);
    expect(screen.getByText(/Setup Instructions/i)).toBeTruthy();
  });

  it('mentions NSFileCoordinator', () => {
    render(<SetupInstructions />);
    expect(screen.getByText(/NSFileCoordinator/)).toBeTruthy();
  });

  it('mentions NSMetadataQuery', () => {
    render(<SetupInstructions />);
    expect(screen.getByText(/NSMetadataQuery/)).toBeTruthy();
  });

  it('mentions Apple Developer Program', () => {
    render(<SetupInstructions />);
    expect(screen.getByText(/Apple Developer Program/i)).toBeTruthy();
  });
});
