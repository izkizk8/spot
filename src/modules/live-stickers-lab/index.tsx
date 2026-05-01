/**
 * Live Stickers Lab Module Manifest
 * Feature: 083-live-stickers
 *
 * iOS 17+ educational module showcasing Live Stickers (cut-out subjects)
 * via `VNGenerateForegroundInstanceMaskRequest`. Users can pick a photo,
 * lift detected foreground subjects as transparent-background PNGs, and
 * share them via the iOS share sheet.
 *
 * The Screen import is deferred inside `render()` so simply importing
 * the registry does not transitively load the native bridge — the
 * module is unavailable in the jsdom Jest environment.
 */

import type { ModuleManifest } from '../types';

const liveStickersLab: ModuleManifest = {
  id: 'live-stickers-lab',
  title: 'Live Stickers',
  description:
    'Cut-out sticker subjects via VNGenerateForegroundInstanceMaskRequest (iOS 17+). Pick a photo, lift detected foreground subjects as transparent-background PNGs, and share them via drag-and-drop or the iOS share sheet.',
  icon: {
    ios: 'scissors',
    fallback: '✂️',
  },
  platforms: ['ios', 'android', 'web'],
  minIOS: '17.0',
  render: () => require('./screen').default,
};

export default liveStickersLab;
