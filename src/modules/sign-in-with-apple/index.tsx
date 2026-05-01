/**
 * Sign in with Apple — module manifest (feature 021).
 *
 * Default-exports the ModuleManifest used by the spec 006 grid.
 */

import React from 'react';

import type { ModuleManifest } from '@/modules/types';

import SignInWithAppleScreen from './screen';

const manifest: ModuleManifest = {
  id: 'sign-in-with-apple',
  title: 'Sign in with Apple',
  description:
    'AuthenticationServices sign-in flow via expo-apple-authentication, with Keychain persistence and credential-state tracking.',
  icon: { ios: 'apple.logo', fallback: '' },
  platforms: ['ios', 'android', 'web'],
  minIOS: '13.0',
  render: () => <SignInWithAppleScreen />,
};

export default manifest;
