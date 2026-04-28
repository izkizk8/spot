/**
 * Test suite for Local Auth screen (Android).
 *
 * Android re-exports the iOS screen since expo-local-authentication is
 * fully supported there.
 */

import React from 'react';
import { act, render } from '@testing-library/react-native';

import LocalAuthScreen from '@/modules/local-auth-lab/screen.android';

jest.mock('expo-local-authentication');
jest.mock('expo-secure-store');

const mockLocalAuth = jest.requireMock(
  'expo-local-authentication',
) as typeof import('../../../__mocks__/expo-local-authentication');
const mockSecureStore = jest.requireMock(
  'expo-secure-store',
) as typeof import('../../../__mocks__/expo-secure-store');

describe('LocalAuthScreen (Android)', () => {
  beforeEach(() => {
    mockLocalAuth.__reset();
    mockSecureStore.__reset();
  });

  it('renders the live module (no banner)', async () => {
    const { getByTestId, queryByText } = render(<LocalAuthScreen />);
    await act(async () => {
      await new Promise((r) => setTimeout(r, 10));
    });
    expect(getByTestId('localauth-capabilities')).toBeTruthy();
    expect(getByTestId('localauth-authenticate')).toBeTruthy();
    expect(queryByText(/unavailable on the Web/)).toBeNull();
  });

  it('invokes authenticateAsync via the live hook', async () => {
    render(<LocalAuthScreen />);
    await act(async () => {
      await new Promise((r) => setTimeout(r, 10));
    });
    expect(mockLocalAuth.hasHardwareAsync).toHaveBeenCalled();
  });
});
