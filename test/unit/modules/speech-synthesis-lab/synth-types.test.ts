/**
 * T008: synth-types tests for feature 019.
 */

import {
  type PersonalVoiceAuthorizationStatus,
  type PitchPreset,
  type RatePreset,
  type SynthesisErrorKind,
  type TransportState,
  type VoiceQuality,
  type VolumePreset,
  SpeechSynthesisError,
  SpeechSynthesisInterrupted,
  SpeechSynthesisNotSupported,
  SpeechSynthesisPauseUnsupported,
} from '@/modules/speech-synthesis-lab/synth-types';

describe('synth-types', () => {
  it('VoiceQuality has three values', () => {
    const values: VoiceQuality[] = ['Default', 'Enhanced', 'Premium'];
    expect(new Set(values).size).toBe(3);
  });

  it('TransportState has three values', () => {
    const values: TransportState[] = ['idle', 'speaking', 'paused'];
    expect(new Set(values).size).toBe(3);
  });

  it('PersonalVoiceAuthorizationStatus has four values', () => {
    const values: PersonalVoiceAuthorizationStatus[] = [
      'notDetermined',
      'authorized',
      'denied',
      'unsupported',
    ];
    expect(new Set(values).size).toBe(4);
  });

  it('Rate/Pitch/Volume presets cover Slow/Normal/Fast and Low/Normal/High', () => {
    const rate: RatePreset[] = ['Slow', 'Normal', 'Fast'];
    const pitch: PitchPreset[] = ['Low', 'Normal', 'High'];
    const volume: VolumePreset[] = ['Low', 'Normal', 'High'];
    expect(new Set(rate).size).toBe(3);
    expect(new Set(pitch).size).toBe(3);
    expect(new Set(volume).size).toBe(3);
  });

  it('SynthesisErrorKind union covers four kinds', () => {
    const kinds: SynthesisErrorKind[] = [
      'NotSupported',
      'PauseUnsupported',
      'Interrupted',
      'Unknown',
    ];
    expect(new Set(kinds).size).toBe(4);
  });

  describe.each([
    ['SpeechSynthesisNotSupported', SpeechSynthesisNotSupported, 'NotSupported' as const],
    ['SpeechSynthesisPauseUnsupported', SpeechSynthesisPauseUnsupported, 'PauseUnsupported' as const],
    ['SpeechSynthesisInterrupted', SpeechSynthesisInterrupted, 'Interrupted' as const],
  ] as const)('%s', (className, Ctor, expectedKind) => {
    it('is instanceof Error and SpeechSynthesisError', () => {
      const err = new Ctor();
      expect(err).toBeInstanceOf(Error);
      expect(err).toBeInstanceOf(SpeechSynthesisError);
      expect(err).toBeInstanceOf(Ctor);
    });

    it('exposes a `kind` literal matching the constructor', () => {
      const err = new Ctor();
      expect(err.kind).toBe(expectedKind);
    });

    it('has `name` matching the class name', () => {
      const err = new Ctor();
      expect(err.name).toBe(className);
    });

    it('accepts a custom message', () => {
      const err = new Ctor('boom');
      expect(err.message).toBe('boom');
    });
  });
});
