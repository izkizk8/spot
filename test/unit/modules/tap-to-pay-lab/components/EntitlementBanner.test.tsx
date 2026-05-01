/**
 * EntitlementBanner Test
 * Feature: 051-tap-to-pay
 */

import { render, screen } from '@testing-library/react-native';
import { describe, expect, it } from '@jest/globals';
import React from 'react';

import EntitlementBanner from '@/modules/tap-to-pay-lab/components/EntitlementBanner';

describe('EntitlementBanner', () => {
  it('renders granted status', () => {
    render(<EntitlementBanner status='granted' />);
    expect(screen.getByText(/granted/i)).toBeTruthy();
  });

  it('renders missing status', () => {
    render(<EntitlementBanner status='missing' />);
    expect(screen.getByText(/missing/i)).toBeTruthy();
  });

  it('renders link button', () => {
    render(<EntitlementBanner status='unknown' />);
    expect(screen.getByText(/Apply for Tap to Pay Program/i)).toBeTruthy();
  });
});
