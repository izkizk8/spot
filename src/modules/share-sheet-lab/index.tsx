/**
 * Manifest for Share Sheet Lab module.
 * feature 033 / T039.
 */

import type { ModuleManifest } from '@/modules/registry';

import Screen from './screen';

export const manifest: ModuleManifest = {
  id: 'share-sheet',
  label: 'Share Sheet',
  platforms: ['ios', 'android', 'web'],
  minIOS: '8.0',
  Screen,
};

export default manifest;
