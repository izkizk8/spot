/**
 * Tap to Pay Lab Screen Test (iOS)
 * Feature: 051-tap-to-pay
 */

import { render, screen } from '@testing-library/react-native';
import { describe, expect, it, jest } from '@jest/globals';
import React from 'react';
import { Platform } from 'react-native';

// Mock Platform as iOS
Platform.OS = 'ios';
Platform.Version = 16;

const mockUseTapToPay = jest.fn(() => ({
  supported: true,
  entitled: true,
  discovery: 'idle' as const,
  lastResult: null,
  lastError: null,
  checkSupport: jest.fn(),
  discover: jest.fn(),
  acceptPayment: jest.fn(),
}));

jest.mock('@/modules/tap-to-pay-lab/hooks/useTapToPay', () => ({
  useTapToPay: mockUseTapToPay,
}));

describe('TapToPayLabScreen (iOS)', () => {
  it('renders all sections', () => {
    const Screen = require('@/modules/tap-to-pay-lab/screen').default;
    render(<Screen />);
    expect(screen.getByText(/Entitlement Status/i)).toBeTruthy();
    expect(screen.getByText(/Capability Check/i)).toBeTruthy();
  });

  it('calls checkSupport on mount', () => {
    const mockCheckSupport = jest.fn();
    mockUseTapToPay.mockReturnValue({
      supported: true,
      entitled: true,
      discovery: 'idle',
      lastResult: null,
      lastError: null,
      checkSupport: mockCheckSupport,
      discover: jest.fn(),
      acceptPayment: jest.fn(),
    });

    const Screen = require('@/modules/tap-to-pay-lab/screen').default;
    render(<Screen />);
    expect(mockCheckSupport).toHaveBeenCalled();
  });
});
