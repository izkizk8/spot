/**
 * Live Text Lab Screen Test (iOS)
 * Feature: 080-live-text
 */

import { describe, expect, it, jest } from '@jest/globals';
import { render, screen } from '@testing-library/react-native';
import React from 'react';
import { Platform } from 'react-native';

Platform.OS = 'ios';
Platform.Version = 16;

const baseStore = {
  capabilities: {
    visionOCR: true,
    dataScanner: true,
    imageAnalysis: true,
    osVersion: '16.4',
  },
  lastResult: null,
  activeScanSession: null,
  loading: false,
  lastError: null,
  refreshCapabilities: jest.fn(),
  recognizeText: jest.fn(),
  startScanner: jest.fn(),
  stopScanner: jest.fn(),
};

const mockUseLiveText = jest.fn(() => baseStore);

jest.mock('@/modules/live-text-lab/hooks/useLiveText', () => ({
  useLiveText: mockUseLiveText,
}));

describe('LiveTextLabScreen (iOS)', () => {
  it('renders all sections', () => {
    const Screen = require('@/modules/live-text-lab/screen').default;
    render(<Screen />);
    expect(screen.getAllByText(/Live Text Capability/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Sample Image OCR/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/OCR Result/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Setup Guide/i).length).toBeGreaterThan(0);
  });
});
