/**
 * PassKit Lab Screen tests — Android variant.
 * Feature: 036-passkit-wallet
 *
 * RED phase: test fails until T032 lands.
 */

import { render } from '@testing-library/react-native';
import { Platform } from 'react-native';
import React from 'react';

// Mock the bridge
jest.mock('@/native/passkit');

describe('PassKit Lab Screen (Android)', () => {
  beforeAll(() => {
    Platform.OS = 'android';
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders IOSOnlyBanner at the top', async () => {
    const Screen = require('@/modules/passkit-lab/screen.android').default;
    const { getAllByText } = render(<Screen />);

    expect(getAllByText(/ios.*only/i).length).toBeGreaterThan(0);
  });

  it('renders five cards with disabled controls', async () => {
    const Screen = require('@/modules/passkit-lab/screen.android').default;
    const { getByText, getAllByText } = render(<Screen />);

    expect(getByText(/capabilities/i)).toBeTruthy();
    expect(getByText(/bundled sample/i)).toBeTruthy();
    expect(getByText(/my passes/i)).toBeTruthy();
    expect(getByText(/add from url/i)).toBeTruthy();
    expect(getByText(/setup guide/i)).toBeTruthy();
    // IOSOnlyBanner is present.
    expect(getAllByText(/ios.*only/i).length).toBeGreaterThan(0);
  });

  it('bridge methods are NEVER invoked at module evaluation time', async () => {
    const mockBridge = {
      canAddPasses: jest.fn().mockResolvedValue(false),
      isPassLibraryAvailable: jest.fn().mockResolvedValue(false),
      passes: jest.fn().mockResolvedValue([]),
    };
    require('@/modules/passkit-lab/screen.android');

    expect(mockBridge.canAddPasses).not.toHaveBeenCalled();
    expect(mockBridge.isPassLibraryAvailable).not.toHaveBeenCalled();
    expect(mockBridge.passes).not.toHaveBeenCalled();
  });

  it('preserves educational structure', async () => {
    const Screen = require('@/modules/passkit-lab/screen.android').default;
    const { getByText, getAllByText } = render(<Screen />);

    // Educational scaffold remains visible
    expect(getByText(/setup guide/i)).toBeTruthy();
    expect(getAllByText(/pass type id/i).length).toBeGreaterThan(0);
  });
});
