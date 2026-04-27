import React from 'react';

import type { ModuleManifest } from '@/modules/types';

import { LiveActivityDemoScreen } from './screen';

/**
 * Live Activity Demo module manifest.
 *
 * iOS-only module demonstrating Lock Screen + Dynamic Island Live Activities.
 * Shows "iOS only" badge on Android/web, "Requires iOS 16.1+" on older iOS.
 *
 * @see specs/007-live-activities-dynamic-island/data-model.md E5
 */
const manifest: ModuleManifest = {
  id: 'live-activity-demo',
  title: 'Live Activity Demo',
  description: 'A counter that lives on your Lock Screen and Dynamic Island.',
  icon: { ios: 'bolt.badge.clock', fallback: '⚡' },
  platforms: ['ios'],
  minIOS: '16.1',
  render: () => <LiveActivityDemoScreen />,
};

export default manifest;
