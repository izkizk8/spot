/**
 * CarPlay Lab Module Manifest
 * Feature: 045-carplay
 *
 * Educational scaffold for Apple CarPlay. The CarPlay entitlement is
 * Apple-restricted to six narrow categories (Audio, Communication,
 * Driving Task, EV, Parking, Quick Food). This module ships as a
 * code-complete *scaffold* — it explains the moving parts, previews
 * the five CarPlay templates as mock RN screens, and documents the
 * Info.plist / entitlement work the developer still has to perform.
 *
 * The Screen import is deferred inside `render()` so simply importing
 * the registry does not transitively load platform-specific code that
 * breaks in the jsdom Jest environment.
 */

import type { ModuleManifest } from '../types';

const carplayLab: ModuleManifest = {
  id: 'carplay-lab',
  title: 'CarPlay Lab',
  description:
    'Educational scaffold for Apple CarPlay. Composes mock previews of the five CarPlay templates (List / Grid / Information / Map / Now Playing), explains the Apple-issued entitlement restriction, and documents the UISceneManifest and entitlement steps required before a real CarPlay scene can ship.',
  icon: {
    ios: 'car.fill',
    fallback: '🚗',
  },
  platforms: ['ios', 'android', 'web'],
  minIOS: '12.0',
  render: () => require('./screen').default,
};

export default carplayLab;
