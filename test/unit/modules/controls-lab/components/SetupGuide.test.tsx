/**
 * SetupGuide Test
 * Feature: 087-controls
 */
import { render, screen } from '@testing-library/react-native';
import { describe, expect, it } from '@jest/globals';
import React from 'react';

import SetupGuide from '@/modules/controls-lab/components/SetupGuide';

describe('SetupGuide (controls-lab)', () => {
  it('renders Setup Guide title', () => {
    render(<SetupGuide />);
    expect(screen.getAllByText(/Setup Guide/i).length).toBeGreaterThan(0);
  });

  it('mentions ControlWidget', () => {
    render(<SetupGuide />);
    expect(screen.getByText(/ControlWidget/i)).toBeTruthy();
  });

  it('mentions AppIntent', () => {
    render(<SetupGuide />);
    expect(screen.getByText(/AppIntent/i)).toBeTruthy();
  });

  it('mentions iOS 18', () => {
    render(<SetupGuide />);
    expect(screen.getAllByText(/iOS 18/i).length).toBeGreaterThan(0);
  });
});
