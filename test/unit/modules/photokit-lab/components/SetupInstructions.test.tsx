/**
 * SetupInstructions Test
 * Feature: 057-photokit
 */

import { render, screen } from '@testing-library/react-native';
import { describe, expect, it } from '@jest/globals';
import React from 'react';

import SetupInstructions from '@/modules/photokit-lab/components/SetupInstructions';

describe('SetupInstructions', () => {
  it('renders the title', () => {
    render(<SetupInstructions />);
    expect(screen.getByText(/Setup Instructions/i)).toBeTruthy();
  });

  it('mentions NSPhotoLibraryUsageDescription', () => {
    render(<SetupInstructions />);
    expect(screen.getByText(/NSPhotoLibraryUsageDescription/)).toBeTruthy();
  });

  it('mentions PHPickerViewController', () => {
    render(<SetupInstructions />);
    expect(screen.getAllByText(/PHPickerViewController/).length).toBeGreaterThan(0);
  });

  it('mentions limited access', () => {
    render(<SetupInstructions />);
    expect(screen.getByText(/\.limited/)).toBeTruthy();
  });
});
