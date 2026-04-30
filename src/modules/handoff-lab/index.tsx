/**
 * Handoff & Continuity Lab Module Manifest
 * Feature: 040-handoff-continuity
 *
 * The Screen import is deferred inside `render()` so that simply importing
 * the registry does not transitively load platform-specific code that breaks
 * in the jsdom Jest environment.
 */

import type { ModuleManifest } from '../types';

const handoffLab: ModuleManifest = {
  id: 'handoff-lab',
  title: 'Handoff & Continuity Lab',
  description:
    'NSUserActivity: the unifying primitive behind Handoff (cross-device continuation), state restoration, Spotlight indexing reuse, and Siri prediction. Compose activities, make them current, observe incoming continuations from another device, and read the setup instructions for two-device testing.',
  icon: {
    ios: 'arrow.triangle.2.circlepath',
    fallback: '🔄',
  },
  platforms: ['ios', 'android', 'web'],
  minIOS: '8.0',
  render: () => require('./screen').default,
};

export default handoffLab;
