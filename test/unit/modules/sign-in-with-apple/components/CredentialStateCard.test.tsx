/**
 * Test suite for CredentialStateCard component.
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

import CredentialStateCard from '@/modules/sign-in-with-apple/components/CredentialStateCard';

describe('CredentialStateCard', () => {
  it('renders with testID', () => {
    const onRefresh = jest.fn();
    const { getByTestId } = render(
      <CredentialStateCard state={null} hasUser={false} onRefresh={onRefresh} />,
    );
    expect(getByTestId('siwa-credential-card')).toBeTruthy();
  });

  it('renders authorized state', () => {
    const onRefresh = jest.fn();
    const { getByText } = render(
      <CredentialStateCard state="authorized" hasUser onRefresh={onRefresh} />,
    );
    expect(getByText('Authorized ✓')).toBeTruthy();
  });

  it('renders revoked state', () => {
    const onRefresh = jest.fn();
    const { getByText } = render(
      <CredentialStateCard state="revoked" hasUser onRefresh={onRefresh} />,
    );
    expect(getByText('Revoked ⚠️')).toBeTruthy();
  });

  it('disables refresh when no user', () => {
    const onRefresh = jest.fn();
    const { getByTestId, getByText } = render(
      <CredentialStateCard state={null} hasUser={false} onRefresh={onRefresh} />,
    );
    expect(getByText('Sign in to check credential state')).toBeTruthy();
    fireEvent.press(getByTestId('siwa-credential-refresh'));
    expect(onRefresh).not.toHaveBeenCalled();
  });

  it('calls onRefresh when user exists', () => {
    const onRefresh = jest.fn();
    const { getByTestId } = render(
      <CredentialStateCard state="authorized" hasUser onRefresh={onRefresh} />,
    );
    fireEvent.press(getByTestId('siwa-credential-refresh'));
    expect(onRefresh).toHaveBeenCalled();
  });
});
