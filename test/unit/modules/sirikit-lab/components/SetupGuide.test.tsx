/**
 * SetupGuide Tests — Feature 071
 */

import { describe, expect, it } from '@jest/globals';
import { render, screen } from '@testing-library/react-native';
import React from 'react';

import SetupGuide from '@/modules/sirikit-lab/components/SetupGuide';

describe('SetupGuide', () => {
  it('renders the Setup heading', () => {
    render(<SetupGuide />);
    expect(screen.getByText(/Setup/i)).toBeTruthy();
  });

  it('mentions INExtension', () => {
    render(<SetupGuide />);
    expect(screen.getByText(/INExtension/i)).toBeTruthy();
  });
});
