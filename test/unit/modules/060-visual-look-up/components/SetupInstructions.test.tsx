/**
 * SetupInstructions Test
 * Feature: 060-visual-look-up
 */

import { render, screen } from '@testing-library/react-native';
import { describe, expect, it } from '@jest/globals';
import React from 'react';

import SetupInstructions from '@/modules/visual-look-up-lab/components/SetupInstructions';

describe('SetupInstructions', () => {
  it('renders the title', () => {
    render(<SetupInstructions />);
    expect(screen.getByText(/Setup Instructions/i)).toBeTruthy();
  });

  it('mentions iOS 15', () => {
    render(<SetupInstructions />);
    expect(screen.getByText(/iOS 15/)).toBeTruthy();
  });

  it('mentions NSPhotoLibraryUsageDescription', () => {
    render(<SetupInstructions />);
    expect(screen.getByText(/NSPhotoLibraryUsageDescription/)).toBeTruthy();
  });

  it('mentions ImageAnalysisInteraction', () => {
    render(<SetupInstructions />);
    expect(screen.getByText(/ImageAnalysisInteraction/)).toBeTruthy();
  });
});
