/**
 * useSiwaSession — React hook owning the Sign in with Apple lifecycle.
 *
 * Responsibilities:
 *   - Mount: load stored user from Keychain; auto-refresh credential state if user exists
 *   - signIn: call signInAsync, handle cancel/error/success, persist result
 *   - signOut: clear Keychain (tolerant), reset state
 *   - refreshCredentialState: query getCredentialStateAsync, update user record
 *   - State machine: signed-out | loading | signed-in | error
 *   - Unmount: guard against post-unmount setState via mountedRef
 */

import React from 'react';

import * as AppleAuthentication from 'expo-apple-authentication';

import { getStoredUser, setStoredUser, clearStoredUser, type StoredUser } from '../siwa-store';

export type SiwaState = 'signed-out' | 'signed-in' | 'loading' | 'error';
export type CredentialState = 'authorized' | 'revoked' | 'notFound' | 'transferred';

export interface UseSiwaSessionOptions {
  storeOverride?: {
    get: () => Promise<StoredUser | null>;
    set: (u: StoredUser) => Promise<void>;
    clear: () => Promise<void>;
  };
  bridgeOverride?: {
    signIn: (options: {
      requestedScopes: number[];
    }) => Promise<AppleAuthentication.AppleAuthenticationCredential>;
    getCredentialState: (userId: string) => Promise<number>;
  };
}

export interface UseSiwaSession {
  state: SiwaState;
  user: StoredUser | null;
  error: string | null;
  credentialState: CredentialState | null;
  signIn: (scopes: { email: boolean; fullName: boolean }) => Promise<void>;
  signOut: () => Promise<void>;
  refreshCredentialState: () => Promise<void>;
}

function credentialStateFromNumber(n: number): CredentialState {
  switch (n) {
    case AppleAuthentication.AppleAuthenticationCredentialState.AUTHORIZED:
      return 'authorized';
    case AppleAuthentication.AppleAuthenticationCredentialState.REVOKED:
      return 'revoked';
    case AppleAuthentication.AppleAuthenticationCredentialState.NOT_FOUND:
      return 'notFound';
    case AppleAuthentication.AppleAuthenticationCredentialState.TRANSFERRED:
      return 'transferred';
    default:
      return 'notFound';
  }
}

/** Lazily resolves the default bridge. */
function defaultBridge() {
  return {
    signIn: AppleAuthentication.signInAsync,
    getCredentialState: AppleAuthentication.getCredentialStateAsync,
  };
}

function defaultStore() {
  return {
    get: getStoredUser,
    set: setStoredUser,
    clear: clearStoredUser,
  };
}

export function useSiwaSession(options: UseSiwaSessionOptions = {}): UseSiwaSession {
  const bridgeRef = React.useRef(options.bridgeOverride ?? defaultBridge());
  const storeRef = React.useRef(options.storeOverride ?? defaultStore());

  const [state, setState] = React.useState<SiwaState>('signed-out');
  const [user, setUser] = React.useState<StoredUser | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [credentialState, setCredentialState] = React.useState<CredentialState | null>(null);

  const mountedRef = React.useRef(true);

  const safeSetState = React.useCallback((next: SiwaState) => {
    if (mountedRef.current) setState(next);
  }, []);

  const safeSetUser = React.useCallback((next: StoredUser | null) => {
    if (mountedRef.current) setUser(next);
  }, []);

  const safeSetError = React.useCallback((next: string | null) => {
    if (mountedRef.current) setError(next);
  }, []);

  const safeSetCredentialState = React.useCallback((next: CredentialState | null) => {
    if (mountedRef.current) setCredentialState(next);
  }, []);

  const refreshCredentialState = React.useCallback(async () => {
    const currentUser = await storeRef.current.get();
    if (!currentUser) return;

    try {
      const credStateNum = await bridgeRef.current.getCredentialState(currentUser.id);
      const credState = credentialStateFromNumber(credStateNum);
      safeSetCredentialState(credState);

      // Persist credential state back into the user record
      const updatedUser = { ...currentUser, credentialState: credState };
      await storeRef.current.set(updatedUser);
      safeSetUser(updatedUser);
    } catch (err) {
      console.warn('[sign-in-with-apple] Failed to refresh credential state', err);
    }
  }, [safeSetCredentialState, safeSetUser]);

  const signIn = React.useCallback(
    async (scopes: { email: boolean; fullName: boolean }) => {
      safeSetState('loading');
      safeSetError(null);

      const requestedScopes: number[] = [];
      if (scopes.email) {
        requestedScopes.push(AppleAuthentication.AppleAuthenticationScope.EMAIL);
      }
      if (scopes.fullName) {
        requestedScopes.push(AppleAuthentication.AppleAuthenticationScope.FULL_NAME);
      }

      try {
        const credential = await bridgeRef.current.signIn({ requestedScopes });

        const newUser: StoredUser = {
          id: credential.user,
          email: credential.email ?? undefined,
          givenName: credential.fullName?.givenName ?? undefined,
          familyName: credential.fullName?.familyName ?? undefined,
        };

        await storeRef.current.set(newUser);
        safeSetUser(newUser);
        safeSetState('signed-in');

        // Auto-refresh credential state after sign-in
        await refreshCredentialState();
      } catch (err: unknown) {
        const e = err as { code?: string; message?: string };
        if (e.code === 'ERR_REQUEST_CANCELED') {
          // Cancellation is silent
          safeSetState('signed-out');
          return;
        }
        safeSetError(e.message ?? 'Sign-in failed');
        safeSetState('error');
      }
    },
    [safeSetState, safeSetError, safeSetUser, refreshCredentialState],
  );

  const signOut = React.useCallback(async () => {
    await storeRef.current.clear();
    safeSetState('signed-out');
    safeSetUser(null);
    safeSetError(null);
    safeSetCredentialState(null);
  }, [safeSetState, safeSetUser, safeSetError, safeSetCredentialState]);

  // Mount effect: load stored user and auto-refresh credential state
  React.useEffect(() => {
    let cancelled = false;

    (async () => {
      const storedUser = await storeRef.current.get();
      if (cancelled) return;

      if (storedUser) {
        safeSetUser(storedUser);
        safeSetState('signed-in');

        // Auto-refresh credential state
        try {
          const credStateNum = await bridgeRef.current.getCredentialState(storedUser.id);
          if (cancelled) return;
          const credState = credentialStateFromNumber(credStateNum);
          safeSetCredentialState(credState);

          // Persist credential state back into the user record
          const updatedUser = { ...storedUser, credentialState: credState };
          await storeRef.current.set(updatedUser);
          safeSetUser(updatedUser);
        } catch (err) {
          console.warn('[sign-in-with-apple] Failed to refresh credential state on mount', err);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [safeSetUser, safeSetState, safeSetCredentialState]);

  // Unmount effect: clear mounted flag
  React.useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return {
    state,
    user,
    error,
    credentialState,
    signIn,
    signOut,
    refreshCredentialState,
  };
}
