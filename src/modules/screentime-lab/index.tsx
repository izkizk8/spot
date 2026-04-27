/**
 * Screen Time Lab — module manifest.
 *
 * Default-exports the ModuleManifest used by the spec 006 grid. Renders
 * the iOS variant on iOS, Android variant on Android, web variant on web.
 *
 * @see specs/015-screentime-api/tasks.md T038
 */

import React from 'react';

import type { ModuleManifest } from '@/modules/types';

import ScreenTimeLabScreen from './screen';

const manifest: ModuleManifest = {
  id: 'screentime-lab',
  title: 'Screen Time Lab',
  description:
    'Apple FamilyControls / ManagedSettings / DeviceActivity demo (iOS 16+, entitlement required).',
  icon: { ios: 'hourglass', fallback: '⌛' },
  platforms: ['ios', 'android', 'web'],
  minIOS: '16.0',
  render: () => <ScreenTimeLabScreen />,
};

export default manifest;
