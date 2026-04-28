/**
 * Jest mock for `expo-apple-authentication` (feature 021).
 *
 * Exposes configurable `signInAsync`, `getCredentialStateAsync`,
 * `isAvailableAsync`, enums, and a React component for
 * `AppleAuthenticationButton` that tests can inspect and interact with.
 *
 * Usage in tests:
 *
 *   import * as AppleAuth from 'expo-apple-authentication';
 *   const mock = require('expo-apple-authentication') as typeof import('../../test/__mocks__/expo-apple-authentication');
 *   mock.__reset();
 *   mock.__setSignInResult({ user: '...', email: '...', ... });
 *   mock.__setCredentialState(1); // AUTHORIZED
 */

import React from 'react';
import { Pressable, Text } from 'react-native';

// Numeric enums matching the real SDK
export const AppleAuthenticationScope = {
  EMAIL: 0,
  FULL_NAME: 1,
} as const;

export const AppleAuthenticationCredentialState = {
  REVOKED: 0,
  AUTHORIZED: 1,
  NOT_FOUND: 2,
  TRANSFERRED: 3,
} as const;

export const AppleAuthenticationButtonType = {
  SIGN_IN: 0,
  CONTINUE: 1,
  SIGN_UP: 2,
} as const;

export const AppleAuthenticationButtonStyle = {
  WHITE: 0,
  WHITE_OUTLINE: 1,
  BLACK: 2,
} as const;

interface AppleAuthenticationCredential {
  user: string;
  email?: string;
  fullName?: { givenName?: string; familyName?: string; middleName?: string; nickname?: string };
  identityToken?: string;
  authorizationCode?: string;
  realUserStatus: number;
  state?: string | null;
}

let signInResult: AppleAuthenticationCredential | Error = {
  user: 'mock-user-id',
  email: 'a@b.c',
  fullName: { givenName: 'A', familyName: 'B' },
  identityToken: 't',
  authorizationCode: 'c',
  realUserStatus: 1,
  state: null,
};

let credentialState: number = AppleAuthenticationCredentialState.AUTHORIZED;
let isAvailableResult = true;

export const signInAsync = jest.fn(async (_options?: { requestedScopes?: number[] }) => {
  if (signInResult instanceof Error) {
    throw signInResult;
  }
  return signInResult;
});

export const getCredentialStateAsync = jest.fn(async (_userId: string) => {
  return credentialState;
});

export const isAvailableAsync = jest.fn(async () => {
  return isAvailableResult;
});

interface ButtonProps {
  buttonType?: number;
  buttonStyle?: number;
  cornerRadius?: number;
  onPress?: () => void;
  disabled?: boolean;
  testID?: string;
}

export function AppleAuthenticationButton(props: ButtonProps) {
  return React.createElement(
    Pressable,
    {
      onPress: props.onPress,
      disabled: props.disabled,
      testID: props.testID ?? 'siwa-button',
    } as never,
    React.createElement(Text, {}, 'Sign in with Apple'),
  );
}

// Test helpers
export function __reset() {
  signInResult = {
    user: 'mock-user-id',
    email: 'a@b.c',
    fullName: { givenName: 'A', familyName: 'B' },
    identityToken: 't',
    authorizationCode: 'c',
    realUserStatus: 1,
    state: null,
  };
  credentialState = AppleAuthenticationCredentialState.AUTHORIZED;
  isAvailableResult = true;
  signInAsync.mockClear();
  getCredentialStateAsync.mockClear();
  isAvailableAsync.mockClear();
}

export function __setSignInResult(result: AppleAuthenticationCredential | Error) {
  signInResult = result;
}

export function __setCredentialState(state: number) {
  credentialState = state;
}

export function __setIsAvailable(available: boolean) {
  isAvailableResult = available;
}
