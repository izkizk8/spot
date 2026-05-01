/**
 * SetupNotes Test
 * Feature: 051-tap-to-pay
 */

import { render, screen } from '@testing-library/react-native';
import { describe, expect, it } from '@jest/globals';
import React from 'react';

import SetupNotes from '@/modules/tap-to-pay-lab/components/SetupNotes';

describe('SetupNotes', () => {
  it('renders bullet list', () => {
    render(<SetupNotes />);
    expect(screen.getByText(/Enroll in Apple Tap to Pay program/i)).toBeTruthy();
    expect(screen.getByText(/Integrate a PSP SDK/i)).toBeTruthy();
  });

  it('includes link to Apple program', () => {
    render(<SetupNotes />);
    expect(screen.getByText(/Apply here/i)).toBeTruthy();
  });
});
