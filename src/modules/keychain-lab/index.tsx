/**
 * Keychain Lab module manifest (feature 023).
 *
 * Exposes iOS Keychain Services with explicit ACL flags and access groups.
 */

import type { ModuleManifest } from '../types';

const keychainLabManifest: ModuleManifest = {
  id: 'keychain-lab',
  title: 'Keychain Lab',
  description:
    'Explore iOS Keychain Services with explicit accessibility classes, biometric authentication, and shared access groups.',
  icon: {
    ios: 'lock.shield',
    fallback: '',
  },
  platforms: ['ios', 'android', 'web'],
  minIOS: '8.0',
  render: () => require('./screen').default,
};

export default keychainLabManifest;
