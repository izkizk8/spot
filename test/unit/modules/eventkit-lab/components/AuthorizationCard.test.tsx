/**
 * AuthorizationCard component tests.
 * Feature: 037-eventkit
 *
 * RED phase: tests reference the component via require() so the suite
 * compiles even before the component lands.
 */

import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';
import { Linking } from 'react-native';

describe('AuthorizationCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe.each(['calendar', 'reminder'] as const)('entityType=%s', (entityType) => {
    it('shows Request Access button only when status is notDetermined', () => {
      const { AuthorizationCard } = require('@/modules/eventkit-lab/components/AuthorizationCard');
      const onRequestAccess = jest.fn();

      const { getByTestId, queryByTestId } = render(
        <AuthorizationCard
          entityType={entityType}
          status='notDetermined'
          onRequestAccess={onRequestAccess}
          inFlight={false}
        />,
      );

      const requestBtn = getByTestId(`eventkit-auth-${entityType}-request`);
      expect(requestBtn).toBeTruthy();
      expect(queryByTestId(`eventkit-auth-${entityType}-settings`)).toBeNull();

      fireEvent.press(requestBtn);
      expect(onRequestAccess).toHaveBeenCalledTimes(1);
    });

    it('shows Open Settings button when status=denied and invokes Linking.openSettings', () => {
      const openSettingsSpy = jest
        .spyOn(Linking, 'openSettings')
        .mockResolvedValue(undefined as never);
      const { AuthorizationCard } = require('@/modules/eventkit-lab/components/AuthorizationCard');

      const { getByTestId, queryByTestId } = render(
        <AuthorizationCard
          entityType={entityType}
          status='denied'
          onRequestAccess={jest.fn()}
          inFlight={false}
        />,
      );

      const settingsBtn = getByTestId(`eventkit-auth-${entityType}-settings`);
      expect(settingsBtn).toBeTruthy();
      expect(queryByTestId(`eventkit-auth-${entityType}-request`)).toBeNull();

      fireEvent.press(settingsBtn);
      expect(openSettingsSpy).toHaveBeenCalledTimes(1);
    });

    it('shows Open Settings button when status=restricted', () => {
      const openSettingsSpy = jest
        .spyOn(Linking, 'openSettings')
        .mockResolvedValue(undefined as never);
      const { AuthorizationCard } = require('@/modules/eventkit-lab/components/AuthorizationCard');

      const { getByTestId, queryByTestId } = render(
        <AuthorizationCard
          entityType={entityType}
          status='restricted'
          onRequestAccess={jest.fn()}
          inFlight={false}
        />,
      );

      const settingsBtn = getByTestId(`eventkit-auth-${entityType}-settings`);
      fireEvent.press(settingsBtn);
      expect(openSettingsSpy).toHaveBeenCalledTimes(1);
      expect(queryByTestId(`eventkit-auth-${entityType}-request`)).toBeNull();
    });

    it('shows no action buttons when status=authorized', () => {
      const { AuthorizationCard } = require('@/modules/eventkit-lab/components/AuthorizationCard');

      const { queryByTestId } = render(
        <AuthorizationCard
          entityType={entityType}
          status='authorized'
          onRequestAccess={jest.fn()}
          inFlight={false}
        />,
      );

      expect(queryByTestId(`eventkit-auth-${entityType}-request`)).toBeNull();
      expect(queryByTestId(`eventkit-auth-${entityType}-settings`)).toBeNull();
    });
  });

  it('calendar: renders writeOnly status without buttons', () => {
    const { AuthorizationCard } = require('@/modules/eventkit-lab/components/AuthorizationCard');

    const { queryByTestId, getByTestId } = render(
      <AuthorizationCard
        entityType='calendar'
        status='writeOnly'
        onRequestAccess={jest.fn()}
        inFlight={false}
      />,
    );

    expect(getByTestId('eventkit-auth-calendar-status')).toBeTruthy();
    expect(queryByTestId('eventkit-auth-calendar-request')).toBeNull();
    expect(queryByTestId('eventkit-auth-calendar-settings')).toBeNull();
  });

  it('reminder: renders fullAccess status without buttons', () => {
    const { AuthorizationCard } = require('@/modules/eventkit-lab/components/AuthorizationCard');

    const { queryByTestId, getByTestId } = render(
      <AuthorizationCard
        entityType='reminder'
        status='fullAccess'
        onRequestAccess={jest.fn()}
        inFlight={false}
      />,
    );

    expect(getByTestId('eventkit-auth-reminder-status')).toBeTruthy();
    expect(queryByTestId('eventkit-auth-reminder-request')).toBeNull();
    expect(queryByTestId('eventkit-auth-reminder-settings')).toBeNull();
  });

  it('disables Request Access button when inFlight=true', () => {
    const { AuthorizationCard } = require('@/modules/eventkit-lab/components/AuthorizationCard');
    const onRequestAccess = jest.fn();

    const { getByTestId } = render(
      <AuthorizationCard
        entityType='calendar'
        status='notDetermined'
        onRequestAccess={onRequestAccess}
        inFlight={true}
      />,
    );

    const btn = getByTestId('eventkit-auth-calendar-request');
    expect(btn.props.accessibilityState?.disabled ?? btn.props.disabled).toBe(true);
  });
});
