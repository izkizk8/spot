/**
 * Speech Synthesis Lab — module manifest (feature 019).
 *
 * Default-exports the ModuleManifest used by the spec 006 grid. The detail
 * screen is split per platform via `screen.tsx` / `screen.android.tsx` /
 * `screen.web.tsx` (Metro picks the right variant automatically).
 */

import React from 'react';

import type { ModuleManifest } from '@/modules/types';

import SpeechSynthesisLabScreen from './screen';

const manifest: ModuleManifest = {
  id: 'speech-synthesis-lab',
  title: 'Speech Synthesis',
  description:
    'AVSpeechSynthesizer wrapper with voices, rate/pitch/volume controls, and word-boundary highlighting.',
  icon: { ios: 'speaker.wave.2', fallback: '🔊' },
  platforms: ['ios', 'android', 'web'],
  minIOS: '7.0',
  render: () => <SpeechSynthesisLabScreen />,
};

export default manifest;
