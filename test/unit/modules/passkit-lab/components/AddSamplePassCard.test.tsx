/**
 * AddSamplePassCard component tests.
 * Feature: 036-passkit-wallet
 *
 * RED phase: test fails until T021 lands.
 */

import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';

describe('AddSamplePassCard', () => {
  const mockOnAddFromBytes = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('without bundled sample: shows "Pass signing required" status', async () => {
    const { AddSamplePassCard } = require('@/modules/passkit-lab/components/AddSamplePassCard');

    const { getByText } = render(
      <AddSamplePassCard
        bundledSample={null}
        onAddFromBytes={mockOnAddFromBytes}
        lastError={null}
        lastResult={null}
      />,
    );

    expect(getByText(/pass signing required/i)).toBeTruthy();
    expect(getByText(/quickstart/i)).toBeTruthy();
  });

  it('without bundled sample: does NOT call onAddFromBytes', async () => {
    const { AddSamplePassCard } = require('@/modules/passkit-lab/components/AddSamplePassCard');

    const { getByText } = render(
      <AddSamplePassCard
        bundledSample={null}
        onAddFromBytes={mockOnAddFromBytes}
        lastError={null}
        lastResult={null}
      />,
    );

    fireEvent.press(getByText(/try with bundled/i));
    expect(mockOnAddFromBytes).not.toHaveBeenCalled();
  });

  it('with bundled sample: calls onAddFromBytes', async () => {
    const { AddSamplePassCard } = require('@/modules/passkit-lab/components/AddSamplePassCard');

    const { getByText } = render(
      <AddSamplePassCard
        bundledSample="base64sampledata"
        onAddFromBytes={mockOnAddFromBytes}
        lastError={null}
        lastResult={null}
      />,
    );

    fireEvent.press(getByText(/try with bundled/i));
    expect(mockOnAddFromBytes).toHaveBeenCalledWith('base64sampledata');
  });

  it('surfaces "Cancelled" status on cancel rejection', async () => {
    const { AddSamplePassCard } = require('@/modules/passkit-lab/components/AddSamplePassCard');

    const { getByText } = render(
      <AddSamplePassCard
        bundledSample="base64"
        onAddFromBytes={mockOnAddFromBytes}
        lastError={{ type: 'cancelled', message: 'Cancelled' }}
        lastResult={null}
      />,
    );

    expect(getByText(/cancelled/i)).toBeTruthy();
  });

  it('surfaces "Pass added" on success', async () => {
    const { AddSamplePassCard } = require('@/modules/passkit-lab/components/AddSamplePassCard');

    const { getByText } = render(
      <AddSamplePassCard
        bundledSample="base64"
        onAddFromBytes={mockOnAddFromBytes}
        lastError={null}
        lastResult={{ added: true }}
      />,
    );

    expect(getByText(/pass added/i)).toBeTruthy();
  });

  it('renders without crash when bundledSample is null', async () => {
    const { AddSamplePassCard } = require('@/modules/passkit-lab/components/AddSamplePassCard');

    expect(() =>
      render(
        <AddSamplePassCard
          bundledSample={null}
          onAddFromBytes={mockOnAddFromBytes}
          lastError={null}
          lastResult={null}
        />,
      ),
    ).not.toThrow();
  });
});
