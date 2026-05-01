/**
 * Core Location Lab — module manifest (feature 025).
 *
 * Default-exports the ModuleManifest used by the spec 006 module grid.
 * The render function lazy-loads the platform-resolved screen.
 */

import React from 'react';

import type { ModuleManifest } from '@/modules/types';

import CoreLocationLabScreen from './screen';

const manifest: ModuleManifest = {
  id: 'core-location-lab',
  title: 'Core Location',
  description:
    'Explore iOS location services: permissions, live updates, region monitoring (geofencing), heading/compass, and significant location changes.',
  icon: { ios: 'location.fill', fallback: '📍' },
  platforms: ['ios', 'android', 'web'],
  minIOS: '8.0',
  render: () => <CoreLocationLabScreen />,
};

export default manifest;
