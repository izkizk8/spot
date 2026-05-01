/**
 * @file T026 — AuthorizationCard test.
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
import { AuthorizationCard } from '@/modules/screentime-lab/components/AuthorizationCard';
import { EntitlementMissingError } from '@/native/screentime.types';

describe('AuthorizationCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders status pill reflecting authStatus', () => {
    const { getByLabelText, getByText } = render(
      <AuthorizationCard authStatus='approved' onAuthorized={jest.fn()} onError={jest.fn()} />,
    );
    expect(getByLabelText('Authorization status pill')).toBeTruthy();
    expect(getByText('Approved')).toBeTruthy();
  });

  it('on press, calls bridge.requestAuthorization and dispatches via onAuthorized', async () => {
    (bridge.requestAuthorization as jest.Mock).mockResolvedValue('approved');
    const onAuthorized = jest.fn();
    const { getByLabelText } = render(
      <AuthorizationCard
        authStatus='notDetermined'
        onAuthorized={onAuthorized}
        onError={jest.fn()}
      />,
    );
    await act(async () => {
      fireEvent.press(getByLabelText('Request Authorization'));
    });
    expect(bridge.requestAuthorization).toHaveBeenCalled();
    expect(onAuthorized).toHaveBeenCalledWith('approved');
  });

  it('on EntitlementMissingError rejection, surfaces "Entitlement required" status and stays enabled', async () => {
    (bridge.requestAuthorization as jest.Mock).mockRejectedValue(new EntitlementMissingError());
    const onError = jest.fn();
    const { getByLabelText, findByLabelText } = render(
      <AuthorizationCard authStatus='notDetermined' onAuthorized={jest.fn()} onError={onError} />,
    );
    await act(async () => {
      fireEvent.press(getByLabelText('Request Authorization'));
    });
    const status = await findByLabelText('Authorization status text');
    expect(status).toBeTruthy();
    expect(JSON.stringify(status.props)).toMatch(/Entitlement required/i);
    expect(onError).toHaveBeenCalled();
    // Button stays enabled (no disabled prop set)
    const btn = getByLabelText('Request Authorization');
    expect(btn.props.accessibilityState?.disabled).toBeFalsy();
  });

  it('disabled prop prevents press from invoking the bridge', async () => {
    const { getByLabelText } = render(
      <AuthorizationCard
        authStatus='notDetermined'
        onAuthorized={jest.fn()}
        onError={jest.fn()}
        disabled
      />,
    );
    await act(async () => {
      fireEvent.press(getByLabelText('Request Authorization'));
    });
    await waitFor(() => {
      expect(bridge.requestAuthorization).not.toHaveBeenCalled();
    });
  });
});
