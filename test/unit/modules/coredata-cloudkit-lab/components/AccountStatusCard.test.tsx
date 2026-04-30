/**
 * AccountStatusCard Test
 * Feature: 052-core-data-cloudkit
 */

import { render, screen } from '@testing-library/react-native';
import { describe, expect, it } from '@jest/globals';
import React from 'react';

import AccountStatusCard from '@/modules/coredata-cloudkit-lab/components/AccountStatusCard';

describe('AccountStatusCard', () => {
  it('renders title', () => {
    render(<AccountStatusCard status={null} />);
    expect(screen.getByText(/CloudKit Account Status/i)).toBeTruthy();
  });

  it('shows "unknown" when status is null', () => {
    render(<AccountStatusCard status={null} />);
    expect(screen.getByText('unknown')).toBeTruthy();
  });

  it('renders the supplied status value', () => {
    render(<AccountStatusCard status="available" />);
    expect(screen.getByText('available')).toBeTruthy();
    expect(screen.getByText(/iCloud is available/i)).toBeTruthy();
  });

  it('renders helpful copy for noAccount', () => {
    render(<AccountStatusCard status="noAccount" />);
    expect(screen.getByText(/sign in/i)).toBeTruthy();
  });
});
