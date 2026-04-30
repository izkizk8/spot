/**
 * SetupInstructions Component Test
 * Feature: 064-core-image
 */
import { render, screen } from '@testing-library/react-native';
import { describe, expect, it } from '@jest/globals';
import React from 'react';

const SetupInstructions = require('@/modules/064-core-image/components/SetupInstructions').default;

describe('SetupInstructions', () => {
  it('renders the title', () => {
    render(<SetupInstructions />);
    expect(screen.getByText(/Setup Instructions/i)).toBeTruthy();
  });

  it('mentions CoreImage framework', () => {
    render(<SetupInstructions />);
    expect(screen.getByText(/CoreImage/)).toBeTruthy();
  });

  it('mentions CIFilter', () => {
    render(<SetupInstructions />);
    expect(screen.getAllByText(/CIFilter/).length).toBeGreaterThan(0);
  });

  it('renders at least 3 bullet points', () => {
    render(<SetupInstructions />);
    // Each step starts with a number
    expect(screen.getByText(/^1\./)).toBeTruthy();
    expect(screen.getByText(/^2\./)).toBeTruthy();
    expect(screen.getByText(/^3\./)).toBeTruthy();
  });
});
