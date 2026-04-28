/**
 * Camera Vision — module manifest (feature 017).
 *
 * Default-exports the ModuleManifest used by the spec 006 grid. Renders
 * the iOS variant on iOS, Android variant on Android, web variant on web.
 */

import React from 'react';

import type { ModuleManifest } from '@/modules/types';

import CameraVisionScreen from './screen';

const manifest: ModuleManifest = {
  id: 'camera-vision',
  title: 'Camera Vision',
  description: 'Live camera preview with face/text/barcode detection via Apple Vision (iOS 13+).',
  icon: { ios: 'camera', fallback: '📷' },
  platforms: ['ios', 'android', 'web'],
  minIOS: '13.0',
  render: () => <CameraVisionScreen />,
};

export default manifest;
