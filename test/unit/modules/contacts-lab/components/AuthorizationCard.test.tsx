/**
 * AuthorizationCard component tests.
 * Feature: 038-contacts
 */

import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';
import { Linking } from 'react-native';

// Mock Linking.openSettings
const mockOpenSettings = jest.fn().mockResolvedValue(undefined);
(Linking as any).openSettings = mockOpenSettings;

import { AuthorizationCard } from '@/modules/contacts-lab/components/AuthorizationCard';

describe('AuthorizationCard', () => {
  beforeEach(() => {
    mockOpenSettings.mockClear();
  });

  it('renders notDetermined status with request button', () => {
    const onRequestAccess = jest.fn();
    const { getByTestId, getByText } = render(
      <AuthorizationCard
        status="notDetermined"
        onRequestAccess={onRequestAccess}
        inFlight={false}
      />,
    );

    expect(getByTestId('contacts-auth-card')).toBeTruthy();
    expect(getByText('Access to contacts not requested yet')).toBeTruthy();
    expect(getByText('Request access to continue.')).toBeTruthy();
    expect(getByTestId('contacts-request-button')).toBeTruthy();
  });

  it('renders authorized status without action buttons', () => {
    const onRequestAccess = jest.fn();
    const { getByText, queryByTestId } = render(
      <AuthorizationCard status="authorized" onRequestAccess={onRequestAccess} inFlight={false} />,
    );

    expect(getByText('Full access to contacts granted')).toBeTruthy();
    expect(getByText('You can read and write all contacts.')).toBeTruthy();
    expect(queryByTestId('contacts-request-button')).toBeNull();
    expect(queryByTestId('contacts-settings-link')).toBeNull();
  });

  it('renders limited status', () => {
    const onRequestAccess = jest.fn();
    const { getByText } = render(
      <AuthorizationCard status="limited" onRequestAccess={onRequestAccess} inFlight={false} />,
    );

    expect(getByText('Limited access to contacts granted')).toBeTruthy();
    expect(getByText('You can only access selected contacts (iOS 18+).')).toBeTruthy();
  });

  it('renders denied status with settings link', () => {
    const onRequestAccess = jest.fn();
    const { getByText, getByTestId } = render(
      <AuthorizationCard status="denied" onRequestAccess={onRequestAccess} inFlight={false} />,
    );

    expect(getByText('Access to contacts denied')).toBeTruthy();
    expect(getByText('Open Settings to grant access.')).toBeTruthy();
    expect(getByTestId('contacts-settings-link')).toBeTruthy();
  });

  it('calls onRequestAccess when request button pressed', () => {
    const onRequestAccess = jest.fn();
    const { getByTestId } = render(
      <AuthorizationCard
        status="notDetermined"
        onRequestAccess={onRequestAccess}
        inFlight={false}
      />,
    );

    fireEvent.press(getByTestId('contacts-request-button'));
    expect(onRequestAccess).toHaveBeenCalledTimes(1);
  });

  it('disables request button when inFlight', () => {
    const onRequestAccess = jest.fn();
    const { getByTestId, getByText } = render(
      <AuthorizationCard
        status="notDetermined"
        onRequestAccess={onRequestAccess}
        inFlight={true}
      />,
    );

    const button = getByTestId('contacts-request-button');
    expect(button.props.accessibilityState?.disabled).toBe(true);
    expect(getByText('Requesting...')).toBeTruthy();
  });

  it('opens settings when settings link pressed', () => {
    const onRequestAccess = jest.fn();
    const { getByTestId } = render(
      <AuthorizationCard status="denied" onRequestAccess={onRequestAccess} inFlight={false} />,
    );

    fireEvent.press(getByTestId('contacts-settings-link'));
    expect(mockOpenSettings).toHaveBeenCalledTimes(1);
  });
});
