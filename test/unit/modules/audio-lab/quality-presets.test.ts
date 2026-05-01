/**
 * T014: Quality preset constants for `audio-lab` (feature 020).
 *
 * data-model §2 + R-005.
 */

import { getPreset, HIGH, LOW, MEDIUM, WEB_PRESETS } from '@/modules/audio-lab/quality-presets';

describe('quality-presets — exact values per data-model §2', () => {
  it('LOW has the canonical low-tier values', () => {
    expect(LOW).toEqual({
      name: 'Low',
      sampleRate: 22050,
      bitrate: 64000,
      channels: 1,
      format: 'aac',
    });
  });

  it('MEDIUM has the canonical medium-tier values', () => {
    expect(MEDIUM).toEqual({
      name: 'Medium',
      sampleRate: 44100,
      bitrate: 128000,
      channels: 1,
      format: 'aac',
    });
  });

  it('HIGH has the canonical high-tier values', () => {
    expect(HIGH).toEqual({
      name: 'High',
      sampleRate: 48000,
      bitrate: 192000,
      channels: 2,
      format: 'aac',
    });
  });
});

describe('quality-presets — adjacent-tier ordering (SC-005)', () => {
  it('bitrate ascends LOW < MEDIUM < HIGH', () => {
    expect(LOW.bitrate).toBeLessThan(MEDIUM.bitrate);
    expect(MEDIUM.bitrate).toBeLessThan(HIGH.bitrate);
  });

  it('HIGH bitrate is at least 2x LOW (for SC-005 file-size delta)', () => {
    expect(HIGH.bitrate / LOW.bitrate).toBeGreaterThanOrEqual(2);
  });
});

describe('quality-presets — getPreset()', () => {
  it('returns LOW for "Low"', () => {
    expect(getPreset('Low')).toBe(LOW);
  });
  it('returns MEDIUM for "Medium"', () => {
    expect(getPreset('Medium')).toBe(MEDIUM);
  });
  it('returns HIGH for "High"', () => {
    expect(getPreset('High')).toBe(HIGH);
  });
});

describe('quality-presets — Web overrides (R-005)', () => {
  it('exposes Web shapes mapping each tier to MediaRecorderOptions.audioBitsPerSecond', () => {
    expect(WEB_PRESETS.Low).toEqual({ audioBitsPerSecond: 64000 });
    expect(WEB_PRESETS.Medium).toEqual({ audioBitsPerSecond: 128000 });
    expect(WEB_PRESETS.High).toEqual({ audioBitsPerSecond: 192000 });
  });
});
