/**
 * ARKit Lab Module - Manifest
 * Feature: 034-arkit-basics
 *
 * Registry entry for the ARKit Basics showcase module.
 */

import type { ModuleManifest } from '@/modules/types';

export const manifest: ModuleManifest = {
  id: 'arkit-basics',
  label: 'ARKit Basics',
  platforms: ['ios', 'android', 'web'],
  minIOS: '11.0',
};

export { default } from './screen';
