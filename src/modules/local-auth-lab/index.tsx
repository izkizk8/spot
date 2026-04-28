/**
 * Local Authentication — module manifest (feature 022).
 *
 * Default-exports the ModuleManifest used by the spec 006 grid.
 */

import React from 'react';

import type { ModuleManifest } from '@/modules/types';

import LocalAuthScreen from './screen';

const manifest: ModuleManifest = {
  id: 'local-auth-lab',
  title: 'Local Auth',
  description:
    'Biometric authentication (Face ID / Touch ID / Optic ID / Fingerprint) via expo-local-authentication, with a Keychain-backed secure-note demo.',
  icon: { ios: 'faceid', fallback: '' },
  platforms: ['ios', 'android', 'web'],
  minIOS: '8.0',
  render: () => <LocalAuthScreen />,
};

export default manifest;
