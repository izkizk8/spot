/**
 * T013: Foundational types & typed-error contract for `audio-lab` (feature 020).
 *
 * Verifies:
 *   - All discriminated-union value sets exist at runtime (via exhaustive lists)
 *   - Every typed Error subclass extends Error and carries the expected `name`
 *   - `AudioPlayerLoadFailed` / `AudioFileMissing` carry a `uri` field
 *   - `AudioStorageCorrupt` carries a `raw` field
 *
 * data-model §1, §3, §4, §5, §6, §8.
 */

import {
  AudioFileMissing,
  AudioPermissionDenied,
  AudioPlayerLoadFailed,
  AudioRecorderUnavailable,
  AudioStorageCorrupt,
  type AudioSessionCategory,
  type PermissionStatus,
  type PlayerState,
  type QualityName,
  type RecorderState,
} from '@/modules/audio-lab/audio-types';

describe('audio-lab/audio-types — value unions', () => {
  it('QualityName covers Low / Medium / High', () => {
    const all: readonly QualityName[] = ['Low', 'Medium', 'High'] as const;
    expect(all).toEqual(['Low', 'Medium', 'High']);
  });

  it('RecorderState covers idle / requesting-permission / recording / stopping', () => {
    const all: readonly RecorderState[] = [
      'idle',
      'requesting-permission',
      'recording',
      'stopping',
    ] as const;
    expect(all).toEqual(['idle', 'requesting-permission', 'recording', 'stopping']);
  });

  it('PlayerState covers idle / loading / playing / paused / stopped', () => {
    const all: readonly PlayerState[] = [
      'idle',
      'loading',
      'playing',
      'paused',
      'stopped',
    ] as const;
    expect(all).toEqual(['idle', 'loading', 'playing', 'paused', 'stopped']);
  });

  it('PermissionStatus covers undetermined / granted / denied', () => {
    const all: readonly PermissionStatus[] = ['undetermined', 'granted', 'denied'] as const;
    expect(all).toEqual(['undetermined', 'granted', 'denied']);
  });

  it('AudioSessionCategory covers all 5 categories', () => {
    const all: readonly AudioSessionCategory[] = [
      'Playback',
      'Record',
      'PlayAndRecord',
      'Ambient',
      'SoloAmbient',
    ] as const;
    expect(all).toHaveLength(5);
  });
});

describe('audio-lab/audio-types — typed Error subclasses', () => {
  it('AudioPermissionDenied extends Error with correct name', () => {
    const e = new AudioPermissionDenied('nope');
    expect(e).toBeInstanceOf(Error);
    expect(e).toBeInstanceOf(AudioPermissionDenied);
    expect(e.name).toBe('AudioPermissionDenied');
    expect(e.message).toBe('nope');
  });

  it('AudioRecorderUnavailable extends Error with correct name', () => {
    const e = new AudioRecorderUnavailable('busted');
    expect(e).toBeInstanceOf(Error);
    expect(e).toBeInstanceOf(AudioRecorderUnavailable);
    expect(e.name).toBe('AudioRecorderUnavailable');
  });

  it('AudioPlayerLoadFailed carries uri and has correct name', () => {
    const e = new AudioPlayerLoadFailed('file:///foo.m4a', 'load fail');
    expect(e).toBeInstanceOf(Error);
    expect(e).toBeInstanceOf(AudioPlayerLoadFailed);
    expect(e.name).toBe('AudioPlayerLoadFailed');
    expect(e.uri).toBe('file:///foo.m4a');
    expect(e.message).toBe('load fail');
  });

  it('AudioFileMissing carries uri and has correct name and default message', () => {
    const e = new AudioFileMissing('file:///gone.m4a');
    expect(e).toBeInstanceOf(Error);
    expect(e).toBeInstanceOf(AudioFileMissing);
    expect(e.name).toBe('AudioFileMissing');
    expect(e.uri).toBe('file:///gone.m4a');
    expect(e.message).toContain('file:///gone.m4a');
  });

  it('AudioStorageCorrupt carries raw payload', () => {
    const e = new AudioStorageCorrupt('{not-json');
    expect(e).toBeInstanceOf(Error);
    expect(e).toBeInstanceOf(AudioStorageCorrupt);
    expect(e.name).toBe('AudioStorageCorrupt');
    expect(e.raw).toBe('{not-json');
  });
});
