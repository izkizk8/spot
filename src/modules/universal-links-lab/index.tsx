/**
 * Universal Links Lab Module Manifest
 * Feature: 041-universal-links
 *
 * Demonstrates iOS Universal Links via apple-app-site-association
 * (AASA), `applinks:` associated domains, and `expo-linking` /
 * `expo-router` integration. Tapping a real https URL hosted on a
 * domain bound to the app opens the app and routes to the matching
 * screen.
 *
 * The Screen import is deferred inside `render()` so simply importing
 * the registry does not transitively load platform-specific code that
 * breaks in the jsdom Jest environment.
 */

import type { ModuleManifest } from '../types';

const universalLinksLab: ModuleManifest = {
  id: 'universal-links-lab',
  title: 'Universal Links Lab',
  description:
    'Tapping a real https URL opens the app to a target screen via Apple Universal Links. Configure associatedDomains, host an apple-app-site-association file, and observe incoming UL events via expo-linking.',
  icon: {
    ios: 'link',
    fallback: '🔗',
  },
  platforms: ['ios', 'android', 'web'],
  minIOS: '9.0',
  render: () => require('./screen').default,
};

export default universalLinksLab;
