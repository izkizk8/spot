/**
 * Widgets Lab — module manifest.
 *
 * Default-exports the ModuleManifest used by the spec 006 grid. Renders
 * the iOS variant on iOS, Android variant on Android, web variant on web.
 *
 * @see specs/014-home-widgets/data-model.md §ModuleManifest
 */

import React from 'react';

import type { ModuleManifest } from '@/modules/types';

import WidgetsLabScreen from './screen';

const manifest: ModuleManifest = {
  id: 'widgets-lab',
  title: 'Widgets Lab',
  description: 'Ship a real Home Screen widget on iOS 14+; preview-only on Android/Web.',
  icon: { ios: 'square.grid.2x2', fallback: '🟦' },
  platforms: ['ios', 'android', 'web'],
  minIOS: '14.0',
  render: () => <WidgetsLabScreen />,
};

export default manifest;
