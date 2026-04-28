/**
 * Quality preset constants for `audio-lab` (feature 020).
 *
 * data-model.md §2 + research.md R-005.
 */

import type { QualityName, QualityPreset } from './audio-types';

export const LOW: QualityPreset = {
  name: 'Low',
  sampleRate: 22050,
  bitrate: 64000,
  channels: 1,
  format: 'aac',
};

export const MEDIUM: QualityPreset = {
  name: 'Medium',
  sampleRate: 44100,
  bitrate: 128000,
  channels: 1,
  format: 'aac',
};

export const HIGH: QualityPreset = {
  name: 'High',
  sampleRate: 48000,
  bitrate: 192000,
  channels: 2,
  format: 'aac',
};

const PRESETS_BY_NAME: Readonly<Record<QualityName, QualityPreset>> = {
  Low: LOW,
  Medium: MEDIUM,
  High: HIGH,
};

export function getPreset(name: QualityName): QualityPreset {
  return PRESETS_BY_NAME[name];
}

/**
 * Web overrides — `MediaRecorderOptions` shape suitable for passing to
 * `new MediaRecorder(stream, …)` per R-005. Only `audioBitsPerSecond` is
 * honored across browsers; sampleRate/channels follow the source MediaStream.
 */
export const WEB_PRESETS: Readonly<Record<QualityName, { audioBitsPerSecond: number }>> = {
  Low: { audioBitsPerSecond: LOW.bitrate },
  Medium: { audioBitsPerSecond: MEDIUM.bitrate },
  High: { audioBitsPerSecond: HIGH.bitrate },
};
