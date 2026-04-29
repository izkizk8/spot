/**
 * CapabilitiesCard component tests.
 * Feature: 036-passkit-wallet
 *
 * RED phase: test fails until T020 lands.
 */

import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';

import type { Capabilities } from '@/native/passkit.types';

describe('CapabilitiesCard', () => {
  const mockOnRefresh = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders two status pills for capabilities', async () => {
    const capabilities: Capabilities = {
      isPassLibraryAvailable: true,
      canAddPasses: true,
    };

    const { CapabilitiesCard } = require('@/modules/passkit-lab/components/CapabilitiesCard');

    const { getByText } = render(
      <CapabilitiesCard capabilities={capabilities} onRefresh={mockOnRefresh} />,
    );

    expect(getByText(/available/i)).toBeTruthy();
    expect(getByText(/can add/i)).toBeTruthy();
  });

  it('shows "Unavailable" when capabilities are false', async () => {
    const capabilities: Capabilities = {
      isPassLibraryAvailable: false,
      canAddPasses: false,
    };

    const { CapabilitiesCard } = require('@/modules/passkit-lab/components/CapabilitiesCard');

    const { getByText } = render(
      <CapabilitiesCard capabilities={capabilities} onRefresh={mockOnRefresh} />,
    );

    expect(getByText(/unavailable/i)).toBeTruthy();
    expect(getByText(/cannot add/i)).toBeTruthy();
  });

  it('calls onRefresh when Refresh button tapped', async () => {
    const capabilities: Capabilities = {
      isPassLibraryAvailable: true,
      canAddPasses: true,
    };

    const { CapabilitiesCard } = require('@/modules/passkit-lab/components/CapabilitiesCard');

    const { getByText } = render(
      <CapabilitiesCard capabilities={capabilities} onRefresh={mockOnRefresh} />,
    );

    fireEvent.press(getByText(/refresh/i));
    expect(mockOnRefresh).toHaveBeenCalledTimes(1);
  });

  it('renders without crash when capabilities are both false', async () => {
    const capabilities: Capabilities = {
      isPassLibraryAvailable: false,
      canAddPasses: false,
    };

    const { CapabilitiesCard } = require('@/modules/passkit-lab/components/CapabilitiesCard');

    expect(() =>
      render(<CapabilitiesCard capabilities={capabilities} onRefresh={mockOnRefresh} />),
    ).not.toThrow();
  });
});
