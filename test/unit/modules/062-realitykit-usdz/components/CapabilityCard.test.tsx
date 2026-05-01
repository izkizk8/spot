/**
 * CapabilityCard Component Tests
 * Feature: 062-realitykit-usdz
 */
import { render, screen } from '@testing-library/react-native';
import { describe, expect, it } from '@jest/globals';
import React from 'react';

import CapabilityCard from '@/modules/062-realitykit-usdz/components/CapabilityCard';
import type { RKCapabilities } from '@/native/realitykit-usdz.types';

const fakeCaps: RKCapabilities = {
  arWorldTrackingSupported: true,
  lidarSupported: false,
  arQuickLookSupported: true,
  tier: 'full',
};

describe('CapabilityCard', () => {
  it('renders heading', () => {
    render(<CapabilityCard capabilities={null} />);
    expect(screen.getByText(/RealityKit AR Capability/i)).toBeTruthy();
  });

  it('shows loading text when capabilities is null', () => {
    render(<CapabilityCard capabilities={null} />);
    expect(screen.getByText(/Loading capabilities/i)).toBeTruthy();
  });

  it('renders capability rows when capabilities are provided', () => {
    render(<CapabilityCard capabilities={fakeCaps} />);
    expect(screen.getByText(/AR World Tracking/i)).toBeTruthy();
    expect(screen.getByText(/LiDAR/i)).toBeTruthy();
    expect(screen.getByText(/AR Quick Look/i)).toBeTruthy();
    expect(screen.getByText(/Tier/i)).toBeTruthy();
  });

  it('shows checkmark for supported capabilities', () => {
    render(<CapabilityCard capabilities={fakeCaps} />);
    // arWorldTrackingSupported=true → ✓; lidarSupported=false → ✗
    expect(screen.getAllByText(/✓/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/✗/).length).toBeGreaterThan(0);
  });
});
