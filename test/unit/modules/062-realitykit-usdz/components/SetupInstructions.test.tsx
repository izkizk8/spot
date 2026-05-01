/**
 * SetupInstructions Component Tests
 * Feature: 062-realitykit-usdz
 */
import { render, screen } from '@testing-library/react-native';
import { describe, expect, it } from '@jest/globals';
import React from 'react';

import SetupInstructions from '@/modules/062-realitykit-usdz/components/SetupInstructions';

describe('SetupInstructions', () => {
  it('renders heading', () => {
    render(<SetupInstructions />);
    expect(screen.getByText(/Setup Instructions/i)).toBeTruthy();
  });

  it('mentions iOS 13+', () => {
    render(<SetupInstructions />);
    expect(screen.getByText(/iOS 13\+/i)).toBeTruthy();
  });

  it('mentions USDZ', () => {
    render(<SetupInstructions />);
    expect(screen.getAllByText(/USDZ/i).length).toBeGreaterThan(0);
  });

  it('accepts a style prop without throwing', () => {
    expect(() => render(<SetupInstructions style={{ margin: 8 }} />)).not.toThrow();
  });
});
