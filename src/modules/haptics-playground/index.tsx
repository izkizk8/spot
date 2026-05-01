import React from 'react';

import type { ModuleManifest } from '@/modules/types';

import { HapticsPlaygroundScreen } from './screen';

const manifest: ModuleManifest = {
  id: 'haptics-playground',
  title: 'Haptics Playground',
  description: 'Explore notification, impact, and selection haptics with a live pattern composer.',
  icon: { ios: 'hand.tap', fallback: '📳' },
  platforms: ['ios', 'android', 'web'],
  render: () => <HapticsPlaygroundScreen />,
};

export default manifest;
