/**
 * PassKit Lab Screen tests — Web variant.
 * Feature: 036-passkit-wallet
 *
 * RED phase: test fails until T033 lands.
 */

import { render } from '@testing-library/react-native';
import { Platform } from 'react-native';
import React from 'react';

// Mock the bridge
jest.mock('@/native/passkit');

describe('PassKit Lab Screen (Web)', () => {
  beforeAll(() => {
    Platform.OS = 'web';
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders IOSOnlyBanner', async () => {
    const Screen = require('@/modules/passkit-lab/screen.web').default;
    const { getAllByText } = render(<Screen />);

    expect(getAllByText(/ios.*only/i).length).toBeGreaterThan(0);
  });

  it('renders five cards with disabled controls', async () => {
    const Screen = require('@/modules/passkit-lab/screen.web').default;
    const { getByText } = render(<Screen />);

    expect(getByText(/capabilities/i)).toBeTruthy();
    expect(getByText(/bundled sample/i)).toBeTruthy();
    expect(getByText(/my passes/i)).toBeTruthy();
    expect(getByText(/add from url/i)).toBeTruthy();
    expect(getByText(/setup guide/i)).toBeTruthy();
  });

  it('SC-007: does NOT eagerly import iOS bridge', () => {
    expect(() => {
      require('@/modules/passkit-lab/screen.web');
    }).not.toThrow();
  });

  it('preserves educational structure', async () => {
    const Screen = require('@/modules/passkit-lab/screen.web').default;
    const { getByText, getAllByText } = render(<Screen />);

    // Educational scaffold remains visible
    expect(getByText(/setup guide/i)).toBeTruthy();
    expect(getAllByText(/pass type id/i).length).toBeGreaterThan(0);
  });
});
