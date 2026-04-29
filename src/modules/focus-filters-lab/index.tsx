/**
 * Focus Filters Lab — module manifest.
 *
 * Default-exports the ModuleManifest used by the module registry grid.
 * Renders the iOS 16+ variant on iOS, Android fallback on Android,
 * web fallback on web.
 *
 * @see specs/029-focus-filters/data-model.md §ModuleManifest
 * @see specs/029-focus-filters/contracts/manifest.contract.ts
 */

import React from 'react';

import type { ModuleManifest } from '@/modules/types';

import FocusFiltersLabScreen from './screen';

const manifest: ModuleManifest = {
  id: 'focus-filters-lab',
  title: 'Focus Filters',
  description:
    'iOS 16+ Focus Filter intents: bind a showcase mode to any Focus, see live persisted state.',
  icon: { ios: 'moon.stars', fallback: '🌙' },
  platforms: ['ios', 'android', 'web'],
  minIOS: '16.0',
  render: () => <FocusFiltersLabScreen />,
};

export default manifest;
