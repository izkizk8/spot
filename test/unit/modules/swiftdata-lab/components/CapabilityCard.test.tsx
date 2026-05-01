/**
 * CapabilityCard Test
 * Feature: 053-swiftdata
 */

import { render, screen } from '@testing-library/react-native';
import { describe, expect, it } from '@jest/globals';
import React from 'react';

import CapabilityCard from '@/modules/swiftdata-lab/components/CapabilityCard';

describe('CapabilityCard', () => {
  it('shows the title', () => {
    render(<CapabilityCard schema={null} />);
    expect(screen.getByText(/SwiftData Capability/i)).toBeTruthy();
  });

  it('shows the unloaded state when schema is null', () => {
    render(<CapabilityCard schema={null} />);
    expect(screen.getByText(/not loaded/i)).toBeTruthy();
  });

  it('renders container and model names when available', () => {
    render(
      <CapabilityCard
        schema={{
          available: true,
          containerName: 'SwiftDataLab.store',
          modelNames: ['TaskItem'],
        }}
      />,
    );
    expect(screen.getByText(/Available/)).toBeTruthy();
    expect(screen.getByText(/SwiftDataLab\.store/)).toBeTruthy();
    expect(screen.getByText(/TaskItem/)).toBeTruthy();
  });

  it('renders the unavailable copy when not available', () => {
    render(
      <CapabilityCard
        schema={{
          available: false,
          containerName: '',
          modelNames: [],
        }}
      />,
    );
    expect(screen.getByText(/iOS 17/i)).toBeTruthy();
  });
});
