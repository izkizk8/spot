/**
 * App Intents Lab — module manifest.
 *
 * Default-exports the ModuleManifest used by the spec 006 grid.
 *
 * @see specs/013-app-intents/contracts/module-manifest.md
 */

import React from 'react';

import type { ModuleManifest } from '@/modules/types';
import AppIntentsLabScreen from './screen';

const manifest: ModuleManifest = {
  id: 'app-intents-lab',
  title: 'App Intents Lab',
  description: 'Demo of Apple App Intents on iOS 16+; JS-only mood logger fallback.',
  icon: {
    ios: 'square.and.arrow.up.on.square',
    fallback: '🎙️',
  },
  platforms: ['ios', 'android', 'web'],
  minIOS: '16.0',
  render: () => <AppIntentsLabScreen />,
};

export default manifest;
