/**
 * SetupInstructions Test
 * Feature: 053-swiftdata
 */

import { render, screen } from '@testing-library/react-native';
import { describe, expect, it } from '@jest/globals';
import React from 'react';

import SetupInstructions from '@/modules/swiftdata-lab/components/SetupInstructions';

describe('SetupInstructions', () => {
  it('renders the title', () => {
    render(<SetupInstructions />);
    expect(screen.getByText(/Setup Instructions/i)).toBeTruthy();
  });

  it('mentions the @Model macro', () => {
    render(<SetupInstructions />);
    expect(screen.getByText(/@Model/)).toBeTruthy();
  });

  it('mentions ModelContainer', () => {
    render(<SetupInstructions />);
    expect(screen.getAllByText(/ModelContainer/).length).toBeGreaterThan(0);
  });

  it('mentions @Query and FetchDescriptor', () => {
    render(<SetupInstructions />);
    expect(screen.getByText(/@Query/)).toBeTruthy();
    expect(screen.getByText(/FetchDescriptor/)).toBeTruthy();
  });

  it('mentions optional CloudKit sync', () => {
    render(<SetupInstructions />);
    expect(screen.getByText(/CloudKit/)).toBeTruthy();
  });
});
