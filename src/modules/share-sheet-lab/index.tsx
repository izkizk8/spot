/**
 * Manifest for Share Sheet Lab module.
 * feature 033 / T039.
 */

import type { ModuleManifest } from '../types';

import Screen from './screen';

export const manifest: ModuleManifest = {
  id: 'share-sheet',
  title: 'Share Sheet',
  description: 'UIActivityViewController wrapper with custom activities',
  icon: {
    ios: 'square.and.arrow.up',
    fallback: '↗',
  },
  platforms: ['ios', 'android', 'web'],
  minIOS: '8.0',
  render: () => <Screen />,
};

export default manifest;
