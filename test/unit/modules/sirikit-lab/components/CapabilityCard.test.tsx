/**
 * CapabilityCard Tests — Feature 071
 */

import { describe, expect, it } from '@jest/globals';
import { render, screen } from '@testing-library/react-native';
import React from 'react';

import CapabilityCard from '@/modules/sirikit-lab/components/CapabilityCard';

describe('CapabilityCard', () => {
  it('shows available status when SiriKit is available', () => {
    const info = {
      available: true,
      extensionBundleId: 'com.spot.SiriKitExtension',
      supportedDomains: ['messaging', 'noteTaking'] as const,
      vocabularyCount: 3,
    };
    render(<CapabilityCard info={info} />);
    expect(screen.getByText(/SiriKit Capability/i)).toBeTruthy();
    expect(screen.getByText(/Available/i)).toBeTruthy();
  });

  it('shows unavailable when info is null', () => {
    render(<CapabilityCard info={null} />);
    expect(screen.getByText(/SiriKit Capability/i)).toBeTruthy();
  });
});
