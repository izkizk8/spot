/**
 * T015: Audio session category mapping (feature 020).
 *
 * Authoritative table: contracts/audio-session-mapping.md.
 */

import { Platform } from 'react-native';

import { applyCategory, mapCategoryToOptions } from '@/modules/audio-lab/audio-session';

jest.mock('expo-audio');

const expoAudio = jest.requireMock('expo-audio') as typeof import('../../../__mocks__/expo-audio');

describe('audio-session.mapCategoryToOptions — exact mapping', () => {
  it('Playback → { allowsRecording: false, playsInSilentMode: true }', () => {
    expect(mapCategoryToOptions('Playback')).toEqual({
      allowsRecording: false,
      playsInSilentMode: true,
    });
  });

  it('Record → { allowsRecording: true, playsInSilentMode: false }', () => {
    expect(mapCategoryToOptions('Record')).toEqual({
      allowsRecording: true,
      playsInSilentMode: false,
    });
  });

  it('PlayAndRecord → { allowsRecording: true, playsInSilentMode: true }', () => {
    expect(mapCategoryToOptions('PlayAndRecord')).toEqual({
      allowsRecording: true,
      playsInSilentMode: true,
    });
  });

  it('Ambient → mixWithOthers, no record, no silent-mode bypass', () => {
    expect(mapCategoryToOptions('Ambient')).toEqual({
      allowsRecording: false,
      playsInSilentMode: false,
      interruptionMode: 'mixWithOthers',
    });
  });

  it('SoloAmbient → duckOthers, no record, no silent-mode bypass', () => {
    expect(mapCategoryToOptions('SoloAmbient')).toEqual({
      allowsRecording: false,
      playsInSilentMode: false,
      interruptionMode: 'duckOthers',
    });
  });
});

describe('audio-session.mapCategoryToOptions — purity', () => {
  it('returns deep-equal output for the same input on repeated calls', () => {
    expect(mapCategoryToOptions('PlayAndRecord')).toEqual(mapCategoryToOptions('PlayAndRecord'));
  });

  it('omits interruptionMode (undefined, not null/empty) for non-Ambient categories', () => {
    expect(mapCategoryToOptions('Playback').interruptionMode).toBeUndefined();
    expect(mapCategoryToOptions('Record').interruptionMode).toBeUndefined();
    expect(mapCategoryToOptions('PlayAndRecord').interruptionMode).toBeUndefined();
  });
});

describe('audio-session.applyCategory — platform behavior', () => {
  beforeEach(() => {
    expoAudio.__reset();
  });

  it('on iOS, calls setAudioModeAsync with mapped options exactly once', async () => {
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'ios' });
    await applyCategory('PlayAndRecord');
    expect(expoAudio.setAudioModeAsync).toHaveBeenCalledTimes(1);
    expect(expoAudio.setAudioModeAsync).toHaveBeenCalledWith({
      allowsRecording: true,
      playsInSilentMode: true,
    });
  });

  it('on Android, calls setAudioModeAsync with mapped options exactly once', async () => {
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'android' });
    await applyCategory('Record');
    expect(expoAudio.setAudioModeAsync).toHaveBeenCalledTimes(1);
    expect(expoAudio.setAudioModeAsync).toHaveBeenCalledWith({
      allowsRecording: true,
      playsInSilentMode: false,
    });
  });

  it('on Web, resolves without invoking setAudioModeAsync (R-007 no-op)', async () => {
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'web' });
    await expect(applyCategory('Playback')).resolves.toBeUndefined();
    expect(expoAudio.setAudioModeAsync).not.toHaveBeenCalled();
  });
});
