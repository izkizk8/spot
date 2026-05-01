/**
 * PhotoKit Lab Module Manifest
 * Feature: 057-photokit
 *
 * iOS 14+ educational module wrapping PHPickerViewController.
 * Demonstrates photo-library authorization, picker configuration,
 * and photo-asset metadata. Includes authorization-status display,
 * a multi-asset picker UI, a photo grid, and setup instructions.
 *
 * The Screen import is deferred inside `render()` so simply importing
 * the registry does not transitively load the native bridge — the
 * module is unavailable in the jsdom Jest environment.
 */

import type { ModuleManifest } from '../types';

const photokitLab: ModuleManifest = {
  id: 'photokit-lab',
  title: 'PhotoKit',
  description:
    'Educational lab for PHPickerViewController (iOS 14+). Demonstrates photo-library authorization status, the modern permission-less PHPickerViewController API, PickerConfig (selectionLimit, mediaTypes), and PhotoAsset metadata (URI, filename, dimensions, creation date). Includes authorization controls, a photo grid, and setup notes.',
  icon: {
    ios: 'photo.on.rectangle.angled',
    fallback: '🖼️',
  },
  platforms: ['ios', 'android', 'web'],
  minIOS: '14.0',
  render: () => require('./screen').default,
};

export default photokitLab;
