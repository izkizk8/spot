/**
 * PassRow component tests.
 * Feature: 036-passkit-wallet
 *
 * RED phase: test fails until T023 lands.
 */

import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';

import type { PassMetadata } from '@/native/passkit.types';

describe('PassRow', () => {
  const mockOnOpen = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const samplePass: PassMetadata = {
    passTypeIdentifier: 'pass.example.test',
    serialNumber: '12345',
    organizationName: 'Test Org',
    localizedDescription: 'Test Pass',
    passType: 'generic',
  };

  it('renders all four metadata fields', async () => {
    const { PassRow } = require('@/modules/passkit-lab/components/PassRow');

    const { getByText } = render(<PassRow pass={samplePass} onOpen={mockOnOpen} canOpen={true} />);

    expect(getByText('12345')).toBeTruthy();
    expect(getByText('Test Org')).toBeTruthy();
    expect(getByText('Test Pass')).toBeTruthy();
    expect(getByText('Generic')).toBeTruthy(); // from getPassCategoryLabel
  });

  it('passType resolves to category label', async () => {
    const couponPass: PassMetadata = {
      ...samplePass,
      passType: 'coupon',
    };

    const { PassRow } = require('@/modules/passkit-lab/components/PassRow');

    const { getByText } = render(<PassRow pass={couponPass} onOpen={mockOnOpen} canOpen={true} />);

    expect(getByText('Coupon')).toBeTruthy();
  });

  it('calls onOpen with passTypeIdentifier and serialNumber when canOpen=true', async () => {
    const { PassRow } = require('@/modules/passkit-lab/components/PassRow');

    const { getByText } = render(<PassRow pass={samplePass} onOpen={mockOnOpen} canOpen={true} />);

    fireEvent.press(getByText(/open in wallet/i));
    expect(mockOnOpen).toHaveBeenCalledWith('pass.example.test', '12345');
  });

  it('button is hidden or disabled when canOpen=false', async () => {
    const { PassRow } = require('@/modules/passkit-lab/components/PassRow');

    const { queryByText } = render(
      <PassRow pass={samplePass} onOpen={mockOnOpen} canOpen={false} />,
    );

    const button = queryByText(/open in wallet/i);
    // Implementation hides the button when canOpen=false
    expect(button).toBeNull();
  });
});
