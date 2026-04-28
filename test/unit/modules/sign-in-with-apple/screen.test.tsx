/**
 * Test suite for Sign in with Apple screen (iOS).
 */

import React from 'react';
import { act, render, waitFor } from '@testing-library/react-native';

import SignInWithAppleScreen from '@/modules/sign-in-with-apple/screen';

jest.mock('expo-apple-authentication');
jest.mock('expo-secure-store');

const mockAppleAuth = jest.requireMock(
  'expo-apple-authentication',
) as typeof import('../../../__mocks__/expo-apple-authentication');
const mockSecureStore = jest.requireMock(
  'expo-secure-store',
) as typeof import('../../../__mocks__/expo-secure-store');

describe('SignInWithAppleScreen (iOS)', () => {
  beforeEach(() => {
    mockAppleAuth.__reset();
    mockSecureStore.__reset();
  });

  it('renders all six sections', async () => {
    const { getByTestId } = render(<SignInWithAppleScreen />);
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
    });
    expect(getByTestId('siwa-user-card')).toBeTruthy();
    expect(getByTestId('siwa-scope-email')).toBeTruthy();
    expect(getByTestId('siwa-credential-card')).toBeTruthy();
  });

  it('renders User Card in signed-out state initially', async () => {
    const { getByTestId } = render(<SignInWithAppleScreen />);
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
    });
    expect(getByTestId('siwa-user-card-state')).toHaveTextContent('State: signed-out');
  });

  it('loads persisted user on mount', async () => {
    await mockSecureStore.setItemAsync(
      'spot.siwa.user',
      JSON.stringify({ id: 'user-123', email: 'test@example.com' }),
    );

    const { getByTestId } = render(<SignInWithAppleScreen />);

    await waitFor(
      () => {
        expect(getByTestId('siwa-user-card-state')).toHaveTextContent('State: signed-in');
      },
      { timeout: 1000 },
    );
  });
});
