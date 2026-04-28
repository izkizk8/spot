/**
 * Test suite for Sign in with Apple screen (Web).
 */

import React from 'react';
import { render } from '@testing-library/react-native';

import SignInWithAppleScreen from '@/modules/sign-in-with-apple/screen.web';

jest.mock('expo-apple-authentication');

const mockAppleAuth = jest.requireMock(
  'expo-apple-authentication',
) as typeof import('../../../__mocks__/expo-apple-authentication');

describe('SignInWithAppleScreen (Web)', () => {
  beforeEach(() => {
    mockAppleAuth.__reset();
  });

  it('renders IOSOnlyBanner', () => {
    const { getByText } = render(<SignInWithAppleScreen />);
    expect(getByText(/iOS 13\+/)).toBeTruthy();
  });

  it('renders disabled UI', () => {
    const { getByTestId } = render(<SignInWithAppleScreen />);
    expect(getByTestId('siwa-button-fallback')).toBeTruthy();
  });

  it('never calls signInAsync', () => {
    render(<SignInWithAppleScreen />);
    expect(mockAppleAuth.signInAsync).not.toHaveBeenCalled();
  });
});
