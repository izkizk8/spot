/**
 * MigrationCard Test
 * Feature: 052-core-data-cloudkit
 */

import { render, screen } from '@testing-library/react-native';
import { describe, expect, it } from '@jest/globals';
import React from 'react';

import MigrationCard from '@/modules/coredata-cloudkit-lab/components/MigrationCard';

describe('MigrationCard', () => {
  it('renders the title', () => {
    render(<MigrationCard />);
    expect(screen.getByText(/Schema Migration/i)).toBeTruthy();
  });

  it('shows the default model version', () => {
    render(<MigrationCard />);
    expect(screen.getByText(/Model version: 1\.0\.0/i)).toBeTruthy();
  });

  it('respects the supplied model version', () => {
    render(<MigrationCard modelVersion="2.5.0" />);
    expect(screen.getByText(/Model version: 2\.5\.0/i)).toBeTruthy();
  });

  it('mentions lightweight migration', () => {
    render(<MigrationCard />);
    expect(screen.getByText(/lightweight migration/i)).toBeTruthy();
  });
});
