/**
 * RealityKit USDZ Lab Screen Test (iOS)
 * Feature: 062-realitykit-usdz
 */
import { render, screen } from '@testing-library/react-native';
import { describe, expect, it, jest } from '@jest/globals';
import React from 'react';
import { Platform } from 'react-native';

Platform.OS = 'ios';
Platform.Version = 16;

const baseStore = {
  capabilities: {
    arWorldTrackingSupported: true,
    lidarSupported: false,
    arQuickLookSupported: true,
    tier: 'full' as const,
  },
  selectedModel: 'toy_drummer' as const,
  loading: false,
  lastError: null,
  refreshCapabilities: jest.fn(),
  selectModel: jest.fn(),
  openPreview: jest.fn(),
};

const mockUseRealityKitUsdz = jest.fn(() => baseStore);

jest.mock('@/modules/062-realitykit-usdz/hooks/useRealityKitUsdz', () => ({
  useRealityKitUsdz: mockUseRealityKitUsdz,
}));

describe('RealityKitUsdzScreen (iOS)', () => {
  it('renders all sections', () => {
    const Screen = require('@/modules/062-realitykit-usdz/screen').default;
    render(<Screen />);
    expect(screen.getByText(/RealityKit AR Capability/i)).toBeTruthy();
    expect(screen.getByText(/Select Model/i)).toBeTruthy();
    expect(screen.getByText(/Open AR Quick Look/i)).toBeTruthy();
    expect(screen.getByText(/Setup Instructions/i)).toBeTruthy();
  });

  it('renders capability values when capabilities are present', () => {
    const Screen = require('@/modules/062-realitykit-usdz/screen').default;
    render(<Screen />);
    expect(screen.getByText(/AR World Tracking/i)).toBeTruthy();
    expect(screen.getAllByText(/AR Quick Look/i).length).toBeGreaterThan(0);
  });
});
