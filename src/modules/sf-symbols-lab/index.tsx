/**
 * @file index.tsx
 * @description SF Symbols Lab module manifest (T017)
 * Per contracts/test-plan.md Story 3.
 */

import React from 'react';

import type { ModuleManifest } from '@/modules/types';

import { SfSymbolsLabScreen } from './screen';

const manifest: ModuleManifest = {
  id: 'sf-symbols-lab',
  title: 'SF Symbols Lab',
  description: 'Explore iOS 17+ SF Symbols with animated effects, speed controls, and tinting.',
  icon: { ios: 'sparkles', fallback: '✨' },
  platforms: ['ios', 'android', 'web'],
  minIOS: '17.0',
  render: () => <SfSymbolsLabScreen />,
};

export default manifest;
