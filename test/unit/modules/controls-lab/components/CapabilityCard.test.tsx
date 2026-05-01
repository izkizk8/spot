/**
 * CapabilityCard Test
 * Feature: 087-controls
 */
import { render, screen } from '@testing-library/react-native';
import { describe, expect, it } from '@jest/globals';
import React from 'react';

import CapabilityCard from '@/modules/controls-lab/components/CapabilityCard';
import type { ControlsCapabilities } from '@/native/controls.types';

const caps: ControlsCapabilities = {
  controlWidget: true,
  valueProvider: true,
  osVersion: '18.0',
};

describe('CapabilityCard (controls-lab)', () => {
  it('renders Controls Capability title', () => {
    render(<CapabilityCard capabilities={caps} />);
    expect(screen.getAllByText(/Controls Capability/i).length).toBeGreaterThan(0);
  });

  it('shows loading state when capabilities is null', () => {
    render(<CapabilityCard capabilities={null} />);
    expect(screen.getByText(/not loaded/i)).toBeTruthy();
  });

  it('shows controlWidget status when available', () => {
    render(<CapabilityCard capabilities={caps} />);
    expect(screen.getByText(/ControlWidget/i)).toBeTruthy();
  });

  it('shows osVersion', () => {
    render(<CapabilityCard capabilities={caps} />);
    expect(screen.getByText(/18\.0/)).toBeTruthy();
  });
});
