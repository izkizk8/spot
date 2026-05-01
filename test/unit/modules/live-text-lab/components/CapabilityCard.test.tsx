/**
 * CapabilityCard Component Test
 * Feature: 080-live-text
 */

import { render, screen } from '@testing-library/react-native';
import { describe, expect, it } from '@jest/globals';
import React from 'react';

import CapabilityCard from '@/modules/live-text-lab/components/CapabilityCard';
import type { LiveTextCapabilities } from '@/native/live-text.types';

const fullCaps: LiveTextCapabilities = {
  visionOCR: true,
  dataScanner: true,
  imageAnalysis: true,
  osVersion: '16.4',
};

describe('CapabilityCard', () => {
  it('renders "not loaded" when capabilities is null', () => {
    render(<CapabilityCard capabilities={null} />);
    expect(screen.getByText(/not loaded yet/i)).toBeTruthy();
  });

  it('renders all capability rows when capabilities provided', () => {
    render(<CapabilityCard capabilities={fullCaps} />);
    expect(screen.getAllByText(/Live Text Capability/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Vision OCR/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/DataScanner/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Image Analysis/i).length).toBeGreaterThan(0);
  });

  it('shows iOS version string', () => {
    render(<CapabilityCard capabilities={fullCaps} />);
    expect(screen.getAllByText(/16.4/i).length).toBeGreaterThan(0);
  });

  it('shows unavailable indicator when dataScanner is false', () => {
    const caps: LiveTextCapabilities = { ...fullCaps, dataScanner: false };
    render(<CapabilityCard capabilities={caps} />);
    expect(screen.getAllByText(/DataScanner \(iOS 16\+\): ❌/i).length).toBeGreaterThan(0);
  });
});
