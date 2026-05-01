/**
 * MyPassesList component tests.
 * Feature: 036-passkit-wallet
 *
 * RED phase: test fails until T022 lands.
 */

import { render } from '@testing-library/react-native';
import React from 'react';

import type { PassMetadata } from '@/native/passkit.types';

describe('MyPassesList', () => {
  const mockOnRefresh = jest.fn();
  const mockOnOpen = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders empty-state row when passes is empty', async () => {
    const { MyPassesList } = require('@/modules/passkit-lab/components/MyPassesList');

    const { getByText } = render(
      <MyPassesList passes={[]} onRefresh={mockOnRefresh} onOpen={mockOnOpen} canOpen={true} />,
    );

    expect(getByText(/no passes yet/i)).toBeTruthy();
  });

  it('renders N PassRow instances for N passes', async () => {
    const passes: PassMetadata[] = [
      {
        passTypeIdentifier: 'pass.example.test1',
        serialNumber: '12345',
        organizationName: 'Test Org 1',
        localizedDescription: 'Test Pass 1',
        passType: 'generic',
      },
      {
        passTypeIdentifier: 'pass.example.test2',
        serialNumber: '67890',
        organizationName: 'Test Org 2',
        localizedDescription: 'Test Pass 2',
        passType: 'coupon',
      },
    ];

    const { MyPassesList } = require('@/modules/passkit-lab/components/MyPassesList');

    const { getByText } = render(
      <MyPassesList passes={passes} onRefresh={mockOnRefresh} onOpen={mockOnOpen} canOpen={true} />,
    );

    expect(getByText('Test Pass 1')).toBeTruthy();
    expect(getByText('Test Pass 2')).toBeTruthy();
  });

  it('renders passes in input order', async () => {
    const passes: PassMetadata[] = Array.from({ length: 3 }, (_, i) => ({
      passTypeIdentifier: `pass.example.test${i}`,
      serialNumber: `${i}`,
      organizationName: `Org ${i}`,
      localizedDescription: `Pass ${i}`,
      passType: 'generic' as const,
    }));

    const { MyPassesList } = require('@/modules/passkit-lab/components/MyPassesList');

    const { getAllByText } = render(
      <MyPassesList passes={passes} onRefresh={mockOnRefresh} onOpen={mockOnOpen} canOpen={true} />,
    );

    const descriptions = getAllByText(/Pass \d/);
    expect(descriptions[0]).toHaveProperty('children', ['Pass 0']);
    expect(descriptions[1]).toHaveProperty('children', ['Pass 1']);
    expect(descriptions[2]).toHaveProperty('children', ['Pass 2']);
  });

  it('renders without crash with 20 rows', async () => {
    const passes: PassMetadata[] = Array.from({ length: 20 }, (_, i) => ({
      passTypeIdentifier: `pass.example.test${i}`,
      serialNumber: `${i}`,
      organizationName: `Org ${i}`,
      localizedDescription: `Pass ${i}`,
      passType: 'generic' as const,
    }));

    const { MyPassesList } = require('@/modules/passkit-lab/components/MyPassesList');

    expect(() =>
      render(
        <MyPassesList
          passes={passes}
          onRefresh={mockOnRefresh}
          onOpen={mockOnOpen}
          canOpen={true}
        />,
      ),
    ).not.toThrow();
  });
});
