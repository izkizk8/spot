/**
 * ARKit Lab Module - Manifest
 * Feature: 034-arkit-basics
 *
 * Registry entry for the ARKit Basics showcase module.
 */

import type { ModuleManifest } from '@/modules/types';
import Screen from './screen';

export const manifest: ModuleManifest = {
  id: 'arkit-basics',
  title: 'ARKit Basics',
  description: 'World-tracking, plane detection, tap-to-place anchors, and session introspection',
  icon: {
    ios: 'cube.box.fill',
    fallback: '◼',
  },
  platforms: ['ios', 'android', 'web'],
  minIOS: '11.0',
  render: () => <Screen />,
};

export default manifest;
