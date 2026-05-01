/**
 * T008: speech-types test for feature 018.
 *
 * Coverage:
 *   - AuthStatus union has 4 values: 'notDetermined' | 'denied' | 'restricted' | 'authorized'
 *   - RecognitionMode union has 2 values: 'server' | 'on-device'
 *   - SpeechErrorKind union completeness
 *   - Each typed Error subclass:
 *       - exposes a `readonly code` literal matching the class name
 *       - has `name` matching the class name
 *       - is instanceof Error AND its own subclass at runtime
 */

import {
  type AuthStatus,
  type RecognitionMode,
  type SpeechErrorKind,
  SpeechRecognitionNotSupported,
  SpeechAuthorizationError,
  SpeechAudioEngineError,
  SpeechNetworkError,
  SpeechInterrupted,
} from '@/modules/speech-recognition-lab/speech-types';

describe('speech-types', () => {
  describe('AuthStatus union', () => {
    it('accepts each of the four documented values', () => {
      const values: AuthStatus[] = ['notDetermined', 'denied', 'restricted', 'authorized'];
      // Compile-time + runtime sanity: each value is assignable to AuthStatus.
      expect(values).toHaveLength(4);
      expect(new Set(values).size).toBe(4);
      expect(values).toEqual(
        expect.arrayContaining(['notDetermined', 'denied', 'restricted', 'authorized']),
      );
    });
  });

  describe('RecognitionMode union', () => {
    it('accepts each of the two documented values', () => {
      const values: RecognitionMode[] = ['server', 'on-device'];
      expect(values).toHaveLength(2);
      expect(new Set(values).size).toBe(2);
      expect(values).toEqual(expect.arrayContaining(['server', 'on-device']));
    });
  });

  describe('SpeechErrorKind union', () => {
    it('covers authorization, audioEngine, network, interrupted, unavailable, unknown', () => {
      const values: SpeechErrorKind[] = [
        'authorization',
        'audioEngine',
        'network',
        'interrupted',
        'unavailable',
        'unknown',
      ];
      expect(values).toHaveLength(6);
      expect(new Set(values).size).toBe(6);
    });
  });

  describe.each([
    ['SpeechRecognitionNotSupported', SpeechRecognitionNotSupported],
    ['SpeechAuthorizationError', SpeechAuthorizationError],
    ['SpeechAudioEngineError', SpeechAudioEngineError],
    ['SpeechNetworkError', SpeechNetworkError],
    ['SpeechInterrupted', SpeechInterrupted],
  ] as const)('%s error class', (className, Ctor) => {
    it('is instanceof Error', () => {
      const err = new Ctor();
      expect(err).toBeInstanceOf(Error);
    });

    it('is instanceof its own constructor', () => {
      const err = new Ctor();
      expect(err).toBeInstanceOf(Ctor);
    });

    it('exposes a readonly `code` literal equal to the class name', () => {
      const err = new Ctor();
      expect(err.code).toBe(className);
    });

    it('has `name` equal to the class name', () => {
      const err = new Ctor();
      expect(err.name).toBe(className);
    });

    it('accepts a custom message', () => {
      const err = new Ctor('custom message');
      expect(err.message).toBe('custom message');
    });

    it('falls back to a default non-empty message when none provided', () => {
      const err = new Ctor();
      expect(typeof err.message).toBe('string');
      expect(err.message.length).toBeGreaterThan(0);
    });
  });

  describe('cross-class instanceof discrimination', () => {
    it('subclasses do not satisfy each other', () => {
      const auth = new SpeechAuthorizationError();
      expect(auth).not.toBeInstanceOf(SpeechRecognitionNotSupported);
      expect(auth).not.toBeInstanceOf(SpeechAudioEngineError);
      expect(auth).not.toBeInstanceOf(SpeechNetworkError);
      expect(auth).not.toBeInstanceOf(SpeechInterrupted);
    });

    it('code literals are distinct across all five subclasses', () => {
      const codes = [
        new SpeechRecognitionNotSupported().code,
        new SpeechAuthorizationError().code,
        new SpeechAudioEngineError().code,
        new SpeechNetworkError().code,
        new SpeechInterrupted().code,
      ];
      expect(new Set(codes).size).toBe(5);
    });
  });
});
