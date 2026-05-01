/**
 * CapabilityCard Component Test
 * Feature: 064-core-image
 */
import { render, screen } from '@testing-library/react-native';
import { describe, expect, it } from '@jest/globals';
import React from 'react';

const CapabilityCard = require('@/modules/064-core-image/components/CapabilityCard').default;

const fakeCaps = {
  available: true,
  filterCount: 212,
  supportedFilters: ['sepia', 'blur', 'vignette', 'color-invert', 'noir', 'sharpen'],
};

describe('CapabilityCard', () => {
  it('renders the title', () => {
    render(<CapabilityCard capabilities={null} />);
    expect(screen.getByText(/Core Image Capability/i)).toBeTruthy();
  });

  it('shows placeholder when capabilities is null', () => {
    render(<CapabilityCard capabilities={null} />);
    expect(screen.getByText(/not loaded/i)).toBeTruthy();
  });

  it('shows "Available" when capabilities.available is true', () => {
    render(<CapabilityCard capabilities={fakeCaps} />);
    expect(screen.getByText(/Available/)).toBeTruthy();
    expect(screen.getByText(/212/)).toBeTruthy();
  });

  it('shows unavailable message when capabilities.available is false', () => {
    render(<CapabilityCard capabilities={{ ...fakeCaps, available: false }} />);
    expect(screen.getByText(/unavailable/i)).toBeTruthy();
  });
});
