/**
 * Quick Actions Lab Module Manifest
 * Feature: 039-quick-actions
 *
 * The Screen import is deferred inside `render()` so that simply importing
 * the registry does not transitively load `expo-router`, which performs
 * environment work at module-load time that breaks in the jsdom Jest
 * environment.
 */

import type { ModuleManifest } from '../types';

const quickActionsLab: ModuleManifest = {
  id: 'quick-actions-lab',
  title: 'Quick Actions Lab',
  description:
    'iOS Home Screen Quick Actions: long-press the app icon to launch into specific features. Manage static and dynamic shortcuts, observe invocations, and route via expo-router.',
  icon: {
    ios: 'bolt.fill',
    fallback: '⚡',
  },
  platforms: ['ios', 'android', 'web'],
  minIOS: '9.0',
  render: () => require('./screen').default,
};

export default quickActionsLab;
