/**
 * Speech Recognition Lab — module manifest (feature 018).
 *
 * Default-exports the ModuleManifest used by the spec 006 grid. The
 * detail screen is split per platform via `screen.tsx` / `screen.android.tsx`
 * / `screen.web.tsx` (Metro picks the right variant automatically).
 */

import React from 'react';

import type { ModuleManifest } from '@/modules/types';

import SpeechRecognitionLabScreen from './screen';

const manifest: ModuleManifest = {
  id: 'speech-recognition-lab',
  title: 'Speech Recognition',
  description: 'Live streaming speech-to-text via Apple SFSpeechRecognizer (iOS 10+).',
  icon: { ios: 'mic', fallback: '🎙️' },
  platforms: ['ios', 'android', 'web'],
  minIOS: '10.0',
  render: () => <SpeechRecognitionLabScreen />,
};

export default manifest;
