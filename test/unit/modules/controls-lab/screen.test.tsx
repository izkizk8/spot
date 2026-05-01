/**
 * Controls Lab Screen Test (iOS)
 * Feature: 087-controls
 */
import { describe, expect, it, jest } from '@jest/globals';
import { render, screen } from '@testing-library/react-native';
import React from 'react';
import { Platform } from 'react-native';

Platform.OS = 'ios';
Platform.Version = 18;

const baseStore = {
  capabilities: {
    controlWidget: true,
    valueProvider: true,
    osVersion: '18.0',
  },
  controls: [
    {
      id: 'com.example.flashlight',
      kind: 'button' as const,
      title: 'Flashlight',
      systemImageName: 'flashlight.on.fill',
      isOn: null,
    },
  ],
  lastActionResult: null,
  loading: false,
  lastError: null,
  refreshCapabilities: jest.fn(),
  refreshControls: jest.fn(),
  triggerControl: jest.fn(),
};

const mockUseControls = jest.fn(() => baseStore);

jest.mock('@/modules/controls-lab/hooks/useControls', () => ({
  useControls: mockUseControls,
}));

describe('ControlsLabScreen (iOS)', () => {
  it('renders all sections', () => {
    const Screen = require('@/modules/controls-lab/screen').default;
    render(<Screen />);
    expect(screen.getAllByText(/Controls Capability/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Setup Guide/i).length).toBeGreaterThan(0);
  });

  it('renders control items from store', () => {
    const Screen = require('@/modules/controls-lab/screen').default;
    render(<Screen />);
    expect(screen.getAllByText(/Flashlight/i).length).toBeGreaterThan(0);
  });
});
