/**
 * Audio Lab — module manifest (feature 020).
 *
 * Default-exports the ModuleManifest used by the spec 006 grid. The detail
 * screen will be split per platform (`screen.tsx` / `screen.android.tsx` /
 * `screen.web.tsx`) in later phases; the current `screen.tsx` is a Phase 2
 * placeholder.
 */

import React from 'react';

import type { ModuleManifest } from '@/modules/types';

import AudioLabScreen from './screen';

const manifest: ModuleManifest = {
  id: 'audio-lab',
  title: 'Audio Lab',
  description:
    'expo-audio recorder + player playground: capture, play back, share, and tune iOS audio session categories and quality presets.',
  icon: { ios: 'waveform', fallback: '🎙️' },
  platforms: ['ios', 'android', 'web'],
  minIOS: '11.0',
  render: () => <AudioLabScreen />,
};

export default manifest;
