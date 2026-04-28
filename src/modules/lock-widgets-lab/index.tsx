/**
 * Lock Screen Widgets Lab — module manifest.
 *
 * Default-exports the ModuleManifest used by the spec 006 grid. Renders
 * the iOS 16+ variant on iOS, Android fallback on Android, web fallback on web.
 *
 * @see specs/027-lock-screen-widgets/data-model.md §ModuleManifest
 * @see specs/027-lock-screen-widgets/contracts/manifest.contract.ts
 */

import React from 'react';

import type { ModuleManifest } from '@/modules/types';

import LockWidgetsLabScreen from './screen';

const manifest: ModuleManifest = {
  id: 'lock-widgets-lab',
  title: 'Lock Screen Widgets',
  description:
    'Ship Lock Screen accessory widgets on iOS 16+; interactive preview on Android/Web.',
  icon: { ios: 'lock.rectangle', fallback: '🔒' },
  platforms: ['ios', 'android', 'web'],
  minIOS: '16.0',
  render: () => <LockWidgetsLabScreen />,
};

export default manifest;
