/**
 * Audio session category mapping (feature 020).
 *
 * Authoritative table: contracts/audio-session-mapping.md.
 *
 * `mapCategoryToOptions` is pure and platform-agnostic — same return value on
 * every platform. The screen-level `Platform.OS === 'web'` branch is the
 * single owner of the apply-vs-tooltip decision.
 *
 * `applyCategory` is a thin wrapper that calls `setAudioModeAsync` on
 * iOS/Android and short-circuits to a resolved Promise on Web (R-007:
 * `expo-audio`'s web backend is a no-op anyway, so we skip the call to
 * keep the surface clean and avoid loading the web shim unnecessarily).
 */

import { Platform } from 'react-native';

import type { AudioModeOptions, AudioSessionCategory } from './audio-types';

export function mapCategoryToOptions(cat: AudioSessionCategory): AudioModeOptions {
  switch (cat) {
    case 'Playback':
      return { allowsRecording: false, playsInSilentMode: true };
    case 'Record':
      return { allowsRecording: true, playsInSilentMode: false };
    case 'PlayAndRecord':
      return { allowsRecording: true, playsInSilentMode: true };
    case 'Ambient':
      return {
        allowsRecording: false,
        playsInSilentMode: false,
        interruptionMode: 'mixWithOthers',
      };
    case 'SoloAmbient':
      return {
        allowsRecording: false,
        playsInSilentMode: false,
        interruptionMode: 'duckOthers',
      };
  }
}

export async function applyCategory(cat: AudioSessionCategory): Promise<void> {
  if (Platform.OS === 'web') {
    // R-007: expo-audio's web backend is a no-op for setAudioModeAsync.
    // We skip the call entirely so test surfaces remain clean.
    return;
  }
  const { setAudioModeAsync } = require('expo-audio') as typeof import('expo-audio');
  await setAudioModeAsync(mapCategoryToOptions(cat));
}
