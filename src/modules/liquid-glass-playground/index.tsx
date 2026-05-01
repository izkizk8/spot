import React from 'react';

import type { ModuleManifest } from '@/modules/types';

import { PlaygroundScreen } from './screen';

const manifest: ModuleManifest = {
  id: 'liquid-glass-playground',
  title: 'Liquid Glass Playground',
  description: 'Interactive blur, tint, and shape controls on three glass surfaces.',
  icon: { ios: 'sparkles', fallback: '✦' },
  platforms: ['ios', 'android', 'web'],
  render: () => <PlaygroundScreen />,
};

export default manifest;
