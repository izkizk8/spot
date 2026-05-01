/**
 * IOSOnlyBanner Test
 * Feature: 051-tap-to-pay
 */

import { render, screen } from '@testing-library/react-native';
import { describe, expect, it } from '@jest/globals';
import React from 'react';

import IOSOnlyBanner from '@/modules/tap-to-pay-lab/components/IOSOnlyBanner';

describe('IOSOnlyBanner', () => {
  it('renders banner', () => {
    render(<IOSOnlyBanner />);
    expect(screen.getByText(/iOS Only Feature/i)).toBeTruthy();
  });

  it('includes platform message', () => {
    render(<IOSOnlyBanner />);
    expect(screen.getByText(/not available on/i)).toBeTruthy();
  });
});
