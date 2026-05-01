/**
 * Test suite for UserCard component.
 */

import React from 'react';
import { render } from '@testing-library/react-native';

import UserCard from '@/modules/sign-in-with-apple/components/UserCard';

describe('UserCard', () => {
  it('renders signed-out state', () => {
    const { getByTestId, getByText } = render(
      <UserCard state='signed-out' user={null} error={null} />,
    );
    expect(getByTestId('siwa-user-card')).toBeTruthy();
    expect(getByTestId('siwa-user-card-state')).toHaveTextContent('State: signed-out');
    expect(getByText('Not signed in')).toBeTruthy();
  });

  it('renders signed-in state with user', () => {
    const user = {
      id: 'user-123',
      email: 'test@example.com',
      givenName: 'Test',
      familyName: 'User',
    };
    const { getByText } = render(<UserCard state='signed-in' user={user} error={null} />);
    expect(getByText('User ID: user-123')).toBeTruthy();
    expect(getByText('Email: test@example.com')).toBeTruthy();
    expect(getByText('Name: Test User')).toBeTruthy();
  });

  it('renders loading state', () => {
    const { getByText } = render(<UserCard state='loading' user={null} error={null} />);
    expect(getByText('Signing in...')).toBeTruthy();
  });

  it('renders error state', () => {
    const { getByText } = render(<UserCard state='error' user={null} error='Sign-in failed' />);
    expect(getByText('Error: Sign-in failed')).toBeTruthy();
  });
});
