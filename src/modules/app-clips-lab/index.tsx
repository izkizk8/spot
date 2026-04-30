/**
 * App Clips Lab Module Manifest
 * Feature: 042-app-clips
 *
 * Educational scaffold for Apple App Clips. App Clips require a
 * separate Xcode target with a strict <10MB size limit; that target
 * cannot be created from a config plugin today, so this module is a
 * code-complete *scaffold* — it explains the moving parts, simulates
 * invocations, and documents the manual Xcode steps the developer
 * still has to perform.
 *
 * The Screen import is deferred inside `render()` so simply importing
 * the registry does not transitively load platform-specific code that
 * breaks in the jsdom Jest environment.
 */

import type { ModuleManifest } from '../types';

const appClipsLab: ModuleManifest = {
  id: 'app-clips-lab',
  title: 'App Clips Lab',
  description:
    'Educational scaffold for Apple App Clips. Explains invocation surfaces (NFC, QR, Smart App Banner, Maps, Messages, Safari), simulates _XCAppClipURL payloads, and documents the Xcode-side setup required before a real App Clip target can ship.',
  icon: {
    ios: 'sparkles',
    fallback: '✨',
  },
  platforms: ['ios', 'android', 'web'],
  minIOS: '14.0',
  render: () => require('./screen').default,
};

export default appClipsLab;
