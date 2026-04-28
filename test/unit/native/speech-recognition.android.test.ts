/**
 * T009 (Android): JS bridge stub test for feature 018.
 *
 * Resolves to `src/native/speech-recognition.android.ts` per Metro's platform
 * extension resolution.
 *
 * Coverage:
 *   - isAvailable(locale) returns false synchronously
 *   - availableLocales() returns []
 *   - requestAuthorization / getAuthorizationStatus / start / stop reject with
 *     SpeechRecognitionNotSupported
 *   - `events` exposes the EventEmitter shape but never emits (addListener exists)
 */

const androidBridge = require('@/native/speech-recognition.android').default;
const {
  SpeechRecognitionNotSupported,
} = require('@/native/speech-recognition.types');

describe('speech-recognition bridge (Android stub)', () => {
  it('isAvailable() returns false', () => {
    expect(androidBridge.isAvailable('en-US')).toBe(false);
  });

  it('isAvailable() is synchronous', () => {
    const result = androidBridge.isAvailable('en-US');
    expect(typeof result).toBe('boolean');
    expect(result).not.toBeInstanceOf(Promise);
  });

  it('availableLocales() returns []', () => {
    expect(androidBridge.availableLocales()).toEqual([]);
  });

  it('requestAuthorization() rejects with SpeechRecognitionNotSupported', async () => {
    await expect(androidBridge.requestAuthorization()).rejects.toBeInstanceOf(
      SpeechRecognitionNotSupported,
    );
  });

  it('getAuthorizationStatus() rejects with SpeechRecognitionNotSupported', async () => {
    await expect(androidBridge.getAuthorizationStatus()).rejects.toBeInstanceOf(
      SpeechRecognitionNotSupported,
    );
  });

  it('start() rejects with SpeechRecognitionNotSupported', async () => {
    await expect(
      androidBridge.start({ locale: 'en-US', onDevice: false }),
    ).rejects.toBeInstanceOf(SpeechRecognitionNotSupported);
  });

  it('stop() rejects with SpeechRecognitionNotSupported', async () => {
    await expect(androidBridge.stop()).rejects.toBeInstanceOf(SpeechRecognitionNotSupported);
  });

  describe('events', () => {
    it('exposes addListener / removeAllListeners', () => {
      expect(typeof androidBridge.events.addListener).toBe('function');
      expect(typeof androidBridge.events.removeAllListeners).toBe('function');
    });

    it('addListener never causes a callback to fire (stub never emits)', () => {
      const callback = jest.fn();
      const sub = androidBridge.events.addListener('partial', callback);
      // Some valid Subscription must be returned.
      expect(sub).toBeDefined();
      expect(typeof sub.remove).toBe('function');
      sub.remove();
      expect(callback).not.toHaveBeenCalled();
    });
  });
});
