/**
 * CapabilityCard Test
 * Feature: 051-tap-to-pay
 */

import { render, screen } from '@testing-library/react-native';
import { describe, expect, it } from '@jest/globals';
import React from 'react';

import CapabilityCard from '@/modules/tap-to-pay-lab/components/CapabilityCard';

describe('CapabilityCard', () => {
  it('renders supported pills correctly', () => {
    render(<CapabilityCard supported={true} iosVersionOk={true} entitled={true} />);
    expect(screen.getByText(/Device Supported/i)).toBeTruthy();
    expect(screen.getByText(/iOS 16.0\+/i)).toBeTruthy();
  });

  it('renders unsupported pills correctly', () => {
    render(<CapabilityCard supported={false} iosVersionOk={false} entitled={false} />);
    expect(screen.getByText(/Device Supported/i)).toBeTruthy();
    expect(screen.getByText(/Entitlement Granted/i)).toBeTruthy();
  });
});
