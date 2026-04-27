/**
 * @file index.tsx
 * @description Sensors Playground module manifest.
 */
import React from 'react';

import type { ModuleManifest } from '@/modules/types';

import SensorsPlaygroundScreen from './screen';

const manifest: ModuleManifest = {
  id: 'sensors-playground',
  title: 'Sensors Playground',
  description: 'Live accelerometer, gyroscope, magnetometer, and motion data',
  icon: { ios: 'gauge.with.dots.needle.bottom.50percent', fallback: '📡' },
  platforms: ['ios', 'android', 'web'],
  // No minIOS — expo-sensors supports iOS 13+; per-card runtime gating handles availability.
  render: () => <SensorsPlaygroundScreen />,
};

export default manifest;
