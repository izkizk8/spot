/**
 * Test suite for useSiwaSession hook (feature 021).
 *
 * Covers:
 *   - Mount with empty store → signed-out
 *   - Mount with stored user → signed-in + auto-refresh credential state
 *   - Sign-in success persists + state flip
 *   - Cancel is silent
 *   - Error sets state='error'
 *   - Refresh updates credentialState
 *   - Sign-out clears Keychain
 */

import React from 'react';
import { Text } from 'react-native';
import { act, render } from '@testing-library/react-native';

import { useSiwaSession } from '@/modules/sign-in-with-apple/hooks/useSiwaSession';
import type { StoredUser } from '@/modules/sign-in-with-apple/siwa-store';

jest.mock('expo-apple-authentication');
jest.mock('expo-secure-store');

const mockAppleAuth = jest.requireMock(
  'expo-apple-authentication',
) as typeof import('../../../../__mocks__/expo-apple-authentication');
const mockSecureStore = jest.requireMock(
  'expo-secure-store',
) as typeof import('../../../../__mocks__/expo-secure-store');

interface ProbeRef {
  state: ReturnType<typeof useSiwaSession>;
}

function Probe({ onState }: { onState: (s: ReturnType<typeof useSiwaSession>) => void }) {
  const state = useSiwaSession();
  onState(state);
  return <Text>{`S=${state.state}`}</Text>;
}

function makeRef(): ProbeRef {
  return { state: undefined as unknown as ProbeRef['state'] };
}

function captureProbe(ref: ProbeRef) {
  return (s: ProbeRef['state']) => {
    ref.state = s;
  };
}

async function flush() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
  });
}

describe('useSiwaSession', () => {
  let warnSpy: jest.SpyInstance;

  beforeEach(() => {
    mockAppleAuth.__reset();
    mockSecureStore.__reset();
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  describe('mount', () => {
    it('starts in signed-out state when no stored user', async () => {
      const ref = makeRef();
      render(<Probe onState={captureProbe(ref)} />);
      await flush();
      expect(ref.state.state).toBe('signed-out');
      expect(ref.state.user).toBeNull();
      expect(ref.state.error).toBeNull();
      expect(ref.state.credentialState).toBeNull();
    });

    it('starts in signed-in state when stored user exists', async () => {
      const user: StoredUser = { id: 'user-123', email: 'test@example.com' };
      await mockSecureStore.setItemAsync('spot.siwa.user', JSON.stringify(user));

      const ref = makeRef();
      render(<Probe onState={captureProbe(ref)} />);
      await flush();

      expect(ref.state.state).toBe('signed-in');
      expect(ref.state.user).toEqual(expect.objectContaining({ id: 'user-123' }));
    });

    it('auto-refreshes credential state when stored user exists', async () => {
      const user: StoredUser = { id: 'user-456' };
      await mockSecureStore.setItemAsync('spot.siwa.user', JSON.stringify(user));
      mockAppleAuth.__setCredentialState(
        mockAppleAuth.AppleAuthenticationCredentialState.AUTHORIZED,
      );

      const ref = makeRef();
      render(<Probe onState={captureProbe(ref)} />);
      await flush();

      expect(mockAppleAuth.getCredentialStateAsync).toHaveBeenCalledWith('user-456');
      expect(ref.state.credentialState).toBe('authorized');
    });
  });

  describe('signIn', () => {
    it('transitions loading → signed-in on success', async () => {
      mockAppleAuth.__setSignInResult({
        user: 'new-user',
        email: 'new@example.com',
        fullName: { givenName: 'New', familyName: 'User' },
        identityToken: 'tok',
        authorizationCode: 'code',
        realUserStatus: 1,
        state: null,
      });

      const ref = makeRef();
      render(<Probe onState={captureProbe(ref)} />);
      await flush();

      act(() => {
        ref.state.signIn({ email: true, fullName: true });
      });

      // Should be loading briefly
      expect(ref.state.state).toBe('loading');

      await flush();

      expect(ref.state.state).toBe('signed-in');
      expect(ref.state.user).toEqual(
        expect.objectContaining({
          id: 'new-user',
          email: 'new@example.com',
          givenName: 'New',
          familyName: 'User',
        }),
      );

      // Should persist to SecureStore
      const stored = await mockSecureStore.getItemAsync('spot.siwa.user');
      expect(stored).toBeTruthy();
      expect(JSON.parse(stored!)).toEqual(
        expect.objectContaining({
          id: 'new-user',
          email: 'new@example.com',
        }),
      );
    });

    it('is silent on cancellation', async () => {
      const cancelError = new Error('User canceled');
      (cancelError as { code?: string }).code = 'ERR_REQUEST_CANCELED';
      mockAppleAuth.__setSignInResult(cancelError);

      const ref = makeRef();
      render(<Probe onState={captureProbe(ref)} />);
      await flush();

      act(() => {
        ref.state.signIn({ email: true, fullName: false });
      });

      await flush();

      expect(ref.state.state).toBe('signed-out');
      expect(ref.state.error).toBeNull();
      expect(warnSpy).not.toHaveBeenCalled();
    });

    it('sets error state on non-cancel failure', async () => {
      mockAppleAuth.__setSignInResult(new Error('Sign-in failed'));

      const ref = makeRef();
      render(<Probe onState={captureProbe(ref)} />);
      await flush();

      act(() => {
        ref.state.signIn({ email: false, fullName: false });
      });

      await flush();

      expect(ref.state.state).toBe('error');
      expect(ref.state.error).toContain('Sign-in failed');
    });

    it('requests the correct scopes', async () => {
      const ref = makeRef();
      render(<Probe onState={captureProbe(ref)} />);
      await flush();

      act(() => {
        ref.state.signIn({ email: true, fullName: false });
      });

      await flush();

      expect(mockAppleAuth.signInAsync).toHaveBeenCalledWith({
        requestedScopes: [mockAppleAuth.AppleAuthenticationScope.EMAIL],
      });
    });
  });

  describe('signOut', () => {
    it('clears store and resets state', async () => {
      const user: StoredUser = { id: 'user-789' };
      await mockSecureStore.setItemAsync('spot.siwa.user', JSON.stringify(user));

      const ref = makeRef();
      render(<Probe onState={captureProbe(ref)} />);
      await flush();

      expect(ref.state.state).toBe('signed-in');

      act(() => {
        ref.state.signOut();
      });

      await flush();

      expect(ref.state.state).toBe('signed-out');
      expect(ref.state.user).toBeNull();
      expect(ref.state.credentialState).toBeNull();

      const stored = await mockSecureStore.getItemAsync('spot.siwa.user');
      expect(stored).toBeNull();
    });

    it('tolerates SecureStore failure', async () => {
      const user: StoredUser = { id: 'user-999' };
      await mockSecureStore.setItemAsync('spot.siwa.user', JSON.stringify(user));

      const ref = makeRef();
      render(<Probe onState={captureProbe(ref)} />);
      await flush();

      mockSecureStore.__setShouldThrow('delete');

      act(() => {
        ref.state.signOut();
      });

      await flush();

      expect(ref.state.state).toBe('signed-out');
      expect(warnSpy).toHaveBeenCalled();
    });
  });

  describe('refreshCredentialState', () => {
    it('updates credentialState when user exists', async () => {
      const user: StoredUser = { id: 'user-abc' };
      await mockSecureStore.setItemAsync('spot.siwa.user', JSON.stringify(user));
      mockAppleAuth.__setCredentialState(mockAppleAuth.AppleAuthenticationCredentialState.REVOKED);

      const ref = makeRef();
      render(<Probe onState={captureProbe(ref)} />);
      await flush();

      // Initial load already called refresh once
      expect(ref.state.credentialState).toBe('revoked');

      // Manual refresh
      mockAppleAuth.__setCredentialState(
        mockAppleAuth.AppleAuthenticationCredentialState.NOT_FOUND,
      );

      act(() => {
        ref.state.refreshCredentialState();
      });

      await flush();

      expect(ref.state.credentialState).toBe('notFound');
    });

    it('is no-op when no user', async () => {
      const ref = makeRef();
      render(<Probe onState={captureProbe(ref)} />);
      await flush();

      act(() => {
        ref.state.refreshCredentialState();
      });

      await flush();

      expect(mockAppleAuth.getCredentialStateAsync).not.toHaveBeenCalled();
    });
  });
});
