/**
 * CoreImage Lab Screen Test (iOS)
 * Feature: 064-core-image
 */
import { render, screen } from '@testing-library/react-native';
import { describe, expect, it, jest } from '@jest/globals';
import React from 'react';
import { Platform } from 'react-native';

Platform.OS = 'ios';
Platform.Version = 16;

const baseStore = {
  capabilities: {
    available: true,
    filterCount: 212,
    supportedFilters: ['sepia', 'blur', 'vignette', 'color-invert', 'noir', 'sharpen'],
  },
  selectedFilterId: 'sepia' as const,
  params: { intensity: 0.8 },
  result: null,
  loading: false,
  lastError: null,
  refreshCapabilities: jest.fn(),
  selectFilter: jest.fn(),
  setParam: jest.fn(),
  applyFilter: jest.fn(),
};

const mockUseCoreImageFilters = jest.fn(() => baseStore);

jest.mock('@/modules/064-core-image/hooks/useCoreImageFilters', () => ({
  useCoreImageFilters: mockUseCoreImageFilters,
}));

describe('CoreImageLabScreen (iOS)', () => {
  it('renders all sections', () => {
    const Screen = require('@/modules/064-core-image/screen').default;
    render(<Screen />);
    expect(screen.getByText(/Core Image Capability/i)).toBeTruthy();
    expect(screen.getByText(/^Filter$/)).toBeTruthy();
    expect(screen.getAllByText(/Sepia Tone/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Apply Filter/i)).toBeTruthy();
    expect(screen.getByText(/Filter Result/i)).toBeTruthy();
    expect(screen.getByText(/Setup Instructions/i)).toBeTruthy();
  });
});
