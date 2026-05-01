/**
 * Core Data + CloudKit Lab Module Manifest
 * Feature: 052-core-data-cloudkit
 *
 * iOS 13+ educational module wrapping NSPersistentCloudKitContainer.
 * Demonstrates CloudKit account status, sync-state observation,
 * Note CRUD, conflict resolution (last-write-wins), schema migration
 * notes, and setup instructions.
 *
 * The Screen import is deferred inside `render()` so simply importing
 * the registry does not transitively load the native bridge — the
 * module is unavailable in the jsdom Jest environment.
 */

import type { ModuleManifest } from '../types';

const coredataCloudKitLab: ModuleManifest = {
  id: 'coredata-cloudkit-lab',
  title: 'Core Data + CloudKit',
  description:
    'Educational lab for NSPersistentCloudKitContainer (iOS 13+). Demonstrates CloudKit account status, sync state observation via NSPersistentStoreRemoteChange, CRUD on a single Note entity, last-write-wins conflict resolution, lightweight schema migration, and the CloudKit container / push entitlement setup required for sync.',
  icon: {
    ios: 'icloud.and.arrow.up',
    fallback: '☁️',
  },
  platforms: ['ios', 'android', 'web'],
  minIOS: '13.0',
  render: () => require('./screen').default,
};

export default coredataCloudKitLab;
