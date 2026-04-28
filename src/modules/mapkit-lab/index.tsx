/**
 * MapKit Lab — module manifest (feature 024).
 *
 * Default-exports the ModuleManifest used by the spec 006 module grid.
 * The render function lazy-loads the platform-resolved screen so native
 * dependencies (react-native-maps, expo-location) stay outside the
 * module-load critical path on platforms that don't need them.
 */

import React from 'react';

import type { ModuleManifest } from '@/modules/types';

import MapKitLabScreen from './screen';

const manifest: ModuleManifest = {
  id: 'mapkit-lab',
  title: 'MapKit Lab',
  description:
    'Browse Apple Maps + custom annotations, draw polylines, search MKLocalSearch, and present Look Around.',
  icon: { ios: 'map.fill', fallback: '🗺️' },
  platforms: ['ios', 'android', 'web'],
  minIOS: '9.0',
  render: () => <MapKitLabScreen />,
};

export default manifest;
