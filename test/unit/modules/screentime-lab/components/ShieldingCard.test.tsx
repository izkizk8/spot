/**
 * @file T028 — ShieldingCard test.
 */

import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';

jest.mock('@/native/screentime', () => ({
  __esModule: true,
  default: {
    isAvailable: jest.fn(() => false),
    entitlementsAvailable: jest.fn(async () => false),
    requestAuthorization: jest.fn(),
    getAuthorizationStatus: jest.fn(),
    pickActivity: jest.fn(),
    applyShielding: jest.fn(),
    clearShielding: jest.fn(),
    startMonitoring: jest.fn(),
    stopMonitoring: jest.fn(),
  },
}));

import bridge from '@/native/screentime';
import { ShieldingCard } from '@/modules/screentime-lab/components/ShieldingCard';
import { EntitlementMissingError } from '@/native/screentime.types';

const SUMMARY = {
  applicationCount: 1,
  categoryCount: 0,
  webDomainCount: 0,
  rawSelectionToken: 'tok',
};

describe('ShieldingCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('both buttons disabled when selectionSummary is null', () => {
    const { getByLabelText } = render(
      <ShieldingCard
        selectionSummary={null}
        shieldingActive={false}
        onApplied={jest.fn()}
        onCleared={jest.fn()}
        onError={jest.fn()}
      />,
    );
    expect(getByLabelText('Apply Shielding').props.accessibilityState?.disabled).toBe(true);
    expect(getByLabelText('Clear Shielding').props.accessibilityState?.disabled).toBe(true);
  });

  it('both buttons enabled when a selection exists', () => {
    const { getByLabelText } = render(
      <ShieldingCard
        selectionSummary={SUMMARY}
        shieldingActive={false}
        onApplied={jest.fn()}
        onCleared={jest.fn()}
        onError={jest.fn()}
      />,
    );
    expect(getByLabelText('Apply Shielding').props.accessibilityState?.disabled).toBeFalsy();
    expect(getByLabelText('Clear Shielding').props.accessibilityState?.disabled).toBeFalsy();
  });

  it('on Apply success, dispatches onApplied and updates pill via prop', async () => {
    (bridge.applyShielding as jest.Mock).mockResolvedValue(undefined);
    const onApplied = jest.fn();
    const { getByLabelText } = render(
      <ShieldingCard
        selectionSummary={SUMMARY}
        shieldingActive={false}
        onApplied={onApplied}
        onCleared={jest.fn()}
        onError={jest.fn()}
      />,
    );
    await act(async () => {
      fireEvent.press(getByLabelText('Apply Shielding'));
    });
    expect(bridge.applyShielding).toHaveBeenCalledWith('tok');
    expect(onApplied).toHaveBeenCalled();
  });

  it('on Apply rejection, surfaces status + onError, no onApplied', async () => {
    (bridge.applyShielding as jest.Mock).mockRejectedValue(new EntitlementMissingError());
    const onApplied = jest.fn();
    const onError = jest.fn();
    const { getByLabelText, findByLabelText } = render(
      <ShieldingCard
        selectionSummary={SUMMARY}
        shieldingActive={false}
        onApplied={onApplied}
        onCleared={jest.fn()}
        onError={onError}
      />,
    );
    await act(async () => {
      fireEvent.press(getByLabelText('Apply Shielding'));
    });
    const status = await findByLabelText('Shielding status text');
    expect(JSON.stringify(status.props)).toMatch(/Entitlement required/i);
    expect(onApplied).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalled();
  });

  it('on Clear success, dispatches onCleared', async () => {
    (bridge.clearShielding as jest.Mock).mockResolvedValue(undefined);
    const onCleared = jest.fn();
    const { getByLabelText } = render(
      <ShieldingCard
        selectionSummary={SUMMARY}
        shieldingActive={true}
        onApplied={jest.fn()}
        onCleared={onCleared}
        onError={jest.fn()}
      />,
    );
    await act(async () => {
      fireEvent.press(getByLabelText('Clear Shielding'));
    });
    expect(bridge.clearShielding).toHaveBeenCalled();
    expect(onCleared).toHaveBeenCalled();
  });

  it('renders Active/Inactive pill correctly', () => {
    const { getByText, rerender } = render(
      <ShieldingCard
        selectionSummary={SUMMARY}
        shieldingActive={false}
        onApplied={jest.fn()}
        onCleared={jest.fn()}
        onError={jest.fn()}
      />,
    );
    expect(getByText('Inactive')).toBeTruthy();
    rerender(
      <ShieldingCard
        selectionSummary={SUMMARY}
        shieldingActive={true}
        onApplied={jest.fn()}
        onCleared={jest.fn()}
        onError={jest.fn()}
      />,
    );
    expect(getByText('Active')).toBeTruthy();
  });

  it('disabled prop forces buttons disabled even with a selection', async () => {
    const { getByLabelText } = render(
      <ShieldingCard
        selectionSummary={SUMMARY}
        shieldingActive={false}
        onApplied={jest.fn()}
        onCleared={jest.fn()}
        onError={jest.fn()}
        disabled
      />,
    );
    expect(getByLabelText('Apply Shielding').props.accessibilityState?.disabled).toBe(true);
    await act(async () => {
      fireEvent.press(getByLabelText('Apply Shielding'));
    });
    await waitFor(() => {
      expect(bridge.applyShielding).not.toHaveBeenCalled();
    });
  });
});
