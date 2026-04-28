/**
 * Test suite for Local Auth screen (iOS).
 */

import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';

import LocalAuthScreen from '@/modules/local-auth-lab/screen';

jest.mock('expo-local-authentication');
jest.mock('expo-secure-store');

const mockLocalAuth = jest.requireMock(
  'expo-local-authentication',
) as typeof import('../../../__mocks__/expo-local-authentication');
const mockSecureStore = jest.requireMock(
  'expo-secure-store',
) as typeof import('../../../__mocks__/expo-secure-store');

describe('LocalAuthScreen (iOS)', () => {
  beforeEach(() => {
    mockLocalAuth.__reset();
    mockSecureStore.__reset();
  });

  it('renders all six sections', async () => {
    const { getByTestId } = render(<LocalAuthScreen />);
    await act(async () => {
      await new Promise((r) => setTimeout(r, 10));
    });
    expect(getByTestId('localauth-capabilities')).toBeTruthy();
    expect(getByTestId('localauth-options')).toBeTruthy();
    expect(getByTestId('localauth-result')).toBeTruthy();
    expect(getByTestId('localauth-securenote')).toBeTruthy();
    expect(getByTestId('localauth-history')).toBeTruthy();
    expect(getByTestId('localauth-authenticate')).toBeTruthy();
  });

  it('drives an authenticate flow through the hook', async () => {
    const { getByTestId } = render(<LocalAuthScreen />);
    await act(async () => {
      await new Promise((r) => setTimeout(r, 10));
    });

    await act(async () => {
      fireEvent.press(getByTestId('localauth-authenticate'));
    });

    await waitFor(() => {
      expect(mockLocalAuth.authenticateAsync).toHaveBeenCalled();
    });
  });

  it('persists a saved note to SecureStore', async () => {
    const { getByTestId } = render(<LocalAuthScreen />);
    await act(async () => {
      await new Promise((r) => setTimeout(r, 10));
    });

    await act(async () => {
      fireEvent.changeText(getByTestId('localauth-securenote-input'), 'hello');
    });

    await act(async () => {
      fireEvent.press(getByTestId('localauth-securenote-save'));
    });

    await waitFor(() => {
      expect(mockSecureStore.setItemAsync).toHaveBeenCalledWith('spot.localauth.note', 'hello');
    });
  });
});
