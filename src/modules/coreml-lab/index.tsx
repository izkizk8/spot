/**
 * CoreML Lab — module manifest (feature 016).
 *
 * Default-exports the ModuleManifest used by the spec 006 grid. Renders
 * the iOS variant on iOS, Android variant on Android, web variant on web.
 */

import React from 'react';

import type { ModuleManifest } from '@/modules/types';

import CoreMLLabScreen from './screen';

const manifest: ModuleManifest = {
  id: 'coreml-lab',
  title: 'CoreML Lab',
  description: 'On-device image classification with Apple CoreML / Vision (iOS 13+).',
  icon: { ios: 'brain', fallback: '🧠' },
  platforms: ['ios', 'android', 'web'],
  minIOS: '13.0',
  render: () => <CoreMLLabScreen />,
};

export default manifest;
