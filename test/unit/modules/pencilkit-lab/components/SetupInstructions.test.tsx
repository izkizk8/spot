/**
 * SetupInstructions Test
 * Feature: 082-pencilkit
 */

import { render, screen } from '@testing-library/react-native';
import { describe, expect, it } from '@jest/globals';
import React from 'react';

import SetupInstructions from '@/modules/pencilkit-lab/components/SetupInstructions';

describe('SetupInstructions', () => {
  it('renders the title', () => {
    render(<SetupInstructions />);
    expect(screen.getByText(/Setup Instructions/i)).toBeTruthy();
  });

  it('mentions PKCanvasView', () => {
    render(<SetupInstructions />);
    expect(screen.getAllByText(/PKCanvasView/).length).toBeGreaterThan(0);
  });

  it('mentions PKToolPicker', () => {
    render(<SetupInstructions />);
    expect(screen.getByText(/PKToolPicker/)).toBeTruthy();
  });

  it('mentions PKDrawing data round trip', () => {
    render(<SetupInstructions />);
    expect(screen.getByText(/PKDrawing/)).toBeTruthy();
  });

  it('mentions drawingPolicy and pencilOnly', () => {
    render(<SetupInstructions />);
    expect(screen.getByText(/drawingPolicy/)).toBeTruthy();
    expect(screen.getByText(/pencilOnly/)).toBeTruthy();
  });
});
