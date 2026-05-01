/**
 * iCloud Drive Lab Module Manifest
 * Feature: 070-icloud-drive
 *
 * iOS 16+ educational module demonstrating NSFileCoordinator and
 * NSMetadataQuery for iCloud Drive file read/write. Ships as an
 * entitlement-restricted scaffold; the EntitlementBanner explains
 * the paid Apple Developer account requirement.
 *
 * The Screen import is deferred inside `render()` so simply importing
 * the registry does not transitively load the native bridge — the
 * module is unavailable in the jsdom Jest environment.
 */

import type { ModuleManifest } from '../types';

const iCloudDriveLab: ModuleManifest = {
  id: 'icloud-drive-lab',
  title: 'iCloud Drive',
  description:
    'Educational lab for iCloud Drive file read/write (iOS 16+). Demonstrates NSFileCoordinator and NSMetadataQuery for ubiquity container operations. Requires a paid Apple Developer account and explicit entitlement enablement.',
  icon: {
    ios: 'icloud',
    fallback: '☁️',
  },
  platforms: ['ios', 'android', 'web'],
  minIOS: '16.0',
  render: () => require('./screen').default,
};

export default iCloudDriveLab;
