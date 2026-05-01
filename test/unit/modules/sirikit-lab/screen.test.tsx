/**
 * SiriKit Lab Screen Test (iOS)
 * Feature: 071-sirikit
 */

import { describe, expect, it, jest } from '@jest/globals';
import { render, screen } from '@testing-library/react-native';
import React from 'react';
import { Platform } from 'react-native';

Platform.OS = 'ios';
Platform.Version = 16;

const baseStore = {
  info: {
    available: true,
    extensionBundleId: 'com.spot.SiriKitExtension',
    supportedDomains: ['messaging', 'noteTaking'] as const,
    vocabularyCount: 3,
  },
  intents: [],
  vocabulary: [],
  loading: false,
  lastError: null,
  refresh: jest.fn(),
  simulateIntent: jest.fn(),
  handleIntent: jest.fn(),
};

const mockUseSiriKit = jest.fn(() => baseStore);

jest.mock('@/modules/sirikit-lab/hooks/useSiriKit', () => ({
  useSiriKit: mockUseSiriKit,
}));

describe('SiriKitLabScreen (iOS)', () => {
  it('renders all sections', () => {
    const Screen = require('@/modules/sirikit-lab/screen').default;
    render(<Screen />);
    expect(screen.getByText(/SiriKit Capability/i)).toBeTruthy();
    expect(screen.getByText(/Intent Simulator/i)).toBeTruthy();
    expect(screen.getAllByText(/Vocabulary/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Setup/i)).toBeTruthy();
  });
});
