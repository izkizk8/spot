/**
 * Test for PermissionsCard component (feature 026).
 */
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Linking } from 'react-native';
import { PermissionsCard } from '../../components/PermissionsCard';
import type { PermissionsState } from '../../types';

jest.spyOn(Linking, 'openSettings').mockResolvedValue();

describe('PermissionsCard', () => {
  const basePermissions: PermissionsState = {
    status: 'notDetermined',
    alerts: false,
    sounds: false,
    badges: false,
    criticalAlerts: false,
    timeSensitive: null,
  };

  it.each(['notDetermined', 'provisional', 'authorized', 'denied', 'ephemeral'] as const)(
    'renders status pill for %s',
    (status) => {
      const { getAllByText } = render(
        <PermissionsCard permissions={{ ...basePermissions, status }} onRequest={jest.fn()} />,
      );
      // Status appears - may appear multiple times (e.g., "provisional" in status + button)
      const statusElements = getAllByText(new RegExp(status, 'i'));
      expect(statusElements.length).toBeGreaterThan(0);
    },
  );

  it('shows alerts indicator when alerts enabled', () => {
    const { getByText } = render(
      <PermissionsCard permissions={{ ...basePermissions, alerts: true }} onRequest={jest.fn()} />,
    );
    expect(getByText(/alert/i)).toBeTruthy();
  });

  it('shows n/a for timeSensitive when null', () => {
    const { getByText } = render(
      <PermissionsCard
        permissions={{ ...basePermissions, timeSensitive: null }}
        onRequest={jest.fn()}
      />,
    );
    expect(getByText(/n\/a/i)).toBeTruthy();
  });

  it('calls onRequest when Request button pressed', () => {
    const onRequest = jest.fn();
    const { getByText } = render(
      <PermissionsCard permissions={basePermissions} onRequest={onRequest} />,
    );

    fireEvent.press(getByText(/^Request Permission$/i));
    expect(onRequest).toHaveBeenCalledWith();
  });

  it('calls onRequest with provisional when provisional button pressed', () => {
    const onRequest = jest.fn();
    const { getByText } = render(
      <PermissionsCard permissions={basePermissions} onRequest={onRequest} />,
    );

    fireEvent.press(getByText(/provisional/i));
    expect(onRequest).toHaveBeenCalledWith({ provisional: true });
  });

  it('opens settings when link pressed', () => {
    const { getByText } = render(
      <PermissionsCard permissions={basePermissions} onRequest={jest.fn()} />,
    );

    fireEvent.press(getByText(/settings/i));
    expect(Linking.openSettings).toHaveBeenCalled();
  });
});
