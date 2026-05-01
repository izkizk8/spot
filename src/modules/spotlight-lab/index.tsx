/**
 * Spotlight Lab — module manifest.
 * feature 031 / T038.
 *
 * @see specs/031-spotlight-indexing/contracts/manifest.contract.ts
 */

import React from 'react';

import type { ModuleManifest } from '@/modules/types';

import SpotlightLabScreen from './screen';

const manifest: ModuleManifest = {
  id: 'spotlight-lab',
  title: 'Spotlight Indexing',
  description:
    'iOS 9+ CoreSpotlight showcase: index items to system Spotlight search, test queries, manage NSUserActivity.',
  icon: { ios: 'magnifyingglass.circle.fill', fallback: '🔍' },
  platforms: ['ios', 'android', 'web'],
  minIOS: '9.0',
  render: () => <SpotlightLabScreen />,
};

export default manifest;
