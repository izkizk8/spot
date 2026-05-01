/**
 * AddFromUrlCard component tests.
 * Feature: 036-passkit-wallet
 *
 * RED phase: test fails until T024 lands.
 */

import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';

describe('AddFromUrlCard', () => {
  const mockOnAddFromURL = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls onAddFromURL with entered URL on submit', async () => {
    const { AddFromUrlCard } = require('@/modules/passkit-lab/components/AddFromUrlCard');

    const { getByPlaceholderText, getByText } = render(
      <AddFromUrlCard onAddFromURL={mockOnAddFromURL} lastError={null} lastResult={null} />,
    );

    const input = getByPlaceholderText(/enter url/i);
    fireEvent.changeText(input, 'https://example.com/pass.pkpass');
    fireEvent.press(getByText(/fetch and add/i));

    expect(mockOnAddFromURL).toHaveBeenCalledWith('https://example.com/pass.pkpass');
  });

  it('trims URL before dispatch', async () => {
    const { AddFromUrlCard } = require('@/modules/passkit-lab/components/AddFromUrlCard');

    const { getByPlaceholderText, getByText } = render(
      <AddFromUrlCard onAddFromURL={mockOnAddFromURL} lastError={null} lastResult={null} />,
    );

    const input = getByPlaceholderText(/enter url/i);
    fireEvent.changeText(input, '  https://example.com/pass.pkpass  ');
    fireEvent.press(getByText(/fetch and add/i));

    expect(mockOnAddFromURL).toHaveBeenCalledWith('https://example.com/pass.pkpass');
  });

  it('disables Fetch button when input is empty', async () => {
    const { AddFromUrlCard } = require('@/modules/passkit-lab/components/AddFromUrlCard');

    const { getByText } = render(
      <AddFromUrlCard onAddFromURL={mockOnAddFromURL} lastError={null} lastResult={null} />,
    );

    const button = getByText(/fetch and add/i);
    expect(button).toBeDisabled();
  });

  it('surfaces "Download failed" on network failure', async () => {
    const { AddFromUrlCard } = require('@/modules/passkit-lab/components/AddFromUrlCard');

    const { getByText } = render(
      <AddFromUrlCard
        onAddFromURL={mockOnAddFromURL}
        lastError={{ type: 'downloadFailed', message: 'Download failed' }}
        lastResult={null}
      />,
    );

    expect(getByText(/download failed/i)).toBeTruthy();
  });

  it('surfaces "Pass invalid or unsigned" on invalid-pass failure', async () => {
    const { AddFromUrlCard } = require('@/modules/passkit-lab/components/AddFromUrlCard');

    const { getByText } = render(
      <AddFromUrlCard
        onAddFromURL={mockOnAddFromURL}
        lastError={{ type: 'invalidPass', message: 'Pass invalid or unsigned' }}
        lastResult={null}
      />,
    );

    expect(getByText(/invalid or unsigned/i)).toBeTruthy();
  });

  it('surfaces "Cancelled" on user cancel', async () => {
    const { AddFromUrlCard } = require('@/modules/passkit-lab/components/AddFromUrlCard');

    const { getByText } = render(
      <AddFromUrlCard
        onAddFromURL={mockOnAddFromURL}
        lastError={{ type: 'cancelled', message: 'Cancelled' }}
        lastResult={null}
      />,
    );

    expect(getByText(/cancelled/i)).toBeTruthy();
  });
});
