/**
 * HomeKit Lab Module Manifest
 * Feature: 044-homekit
 *
 * iOS-focused educational module for Apple HomeKit. Wraps a custom
 * thin Swift bridge (`HomeKitBridge.swift`) over `HMHomeManager`.
 * Demonstrates auth, listing homes / rooms / accessories /
 * characteristics, reading and writing characteristic values, and
 * observing live updates.
 *
 * The Screen import is deferred inside `render()` so simply importing
 * the registry does not transitively load the native bridge — the
 * module is unavailable in the jsdom Jest environment.
 */

import type { ModuleManifest } from '../types';

const homekitLab: ModuleManifest = {
  id: 'homekit-lab',
  title: 'HomeKit Lab',
  description:
    'Educational lab for Apple HomeKit. Lists homes, rooms, accessories and characteristics; toggles, reads and writes characteristic values; subscribes to live characteristic updates.',
  icon: {
    ios: 'house.fill',
    fallback: '🏠',
  },
  platforms: ['ios', 'android', 'web'],
  minIOS: '8.0',
  render: () => require('./screen').default,
};

export default homekitLab;
