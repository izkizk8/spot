/**
 * StandBy Mode Lab — module manifest.
 *
 * Default-exports the ModuleManifest used by the spec 006 grid. Renders
 * the iOS 17+ variant on iOS, Android fallback on Android, web fallback on web.
 *
 * @see specs/028-standby-mode/data-model.md §ModuleManifest
 * @see specs/028-standby-mode/contracts/manifest.contract.ts
 */

import React from 'react';

import type { ModuleManifest } from '@/modules/types';

import StandByLabScreen from './screen';

const manifest: ModuleManifest = {
  id: 'standby-lab',
  title: 'StandBy Mode',
  description:
    'Ship a WidgetKit StandBy widget on iOS 17+; preview rendering modes on Android and Web.',
  icon: { ios: 'powersleep', fallback: '🛏️' },
  platforms: ['ios', 'android', 'web'],
  minIOS: '17.0',
  render: () => <StandByLabScreen />,
};

export default manifest;
