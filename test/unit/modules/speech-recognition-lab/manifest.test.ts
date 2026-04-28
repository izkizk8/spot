/**
 * T011: Manifest test for speech-recognition-lab module.
 *
 * Coverage:
 *   - manifest id === 'speech-recognition-lab'
 *   - platforms includes 'ios', 'android', 'web'
 *   - minIOS === '10.0'
 *   - screen reference resolves (render is a function returning a React node)
 */

import SpeechRecognitionLabManifest from '@/modules/speech-recognition-lab';

describe('speech-recognition-lab manifest', () => {
  it('id matches kebab-case and equals "speech-recognition-lab"', () => {
    expect(SpeechRecognitionLabManifest.id).toMatch(/^[a-z][a-z0-9-]*$/);
    expect(SpeechRecognitionLabManifest.id).toBe('speech-recognition-lab');
  });

  it('platforms includes ios, android, and web', () => {
    expect(SpeechRecognitionLabManifest.platforms).toEqual(
      expect.arrayContaining(['ios', 'android', 'web']),
    );
  });

  it('minIOS === "10.0"', () => {
    expect(SpeechRecognitionLabManifest.minIOS).toBe('10.0');
  });

  it('title and description are non-empty', () => {
    expect(SpeechRecognitionLabManifest.title.length).toBeGreaterThan(0);
    expect(SpeechRecognitionLabManifest.description.length).toBeGreaterThan(0);
  });

  it('render is a function returning a React element', () => {
    expect(typeof SpeechRecognitionLabManifest.render).toBe('function');
    const el = SpeechRecognitionLabManifest.render();
    expect(el).toBeTruthy();
  });

  it('screen module resolves via require (FR-001/FR-003)', () => {
    // Use require() instead of dynamic import() because Jest's CommonJS
    // VM doesn't support dynamic import without --experimental-vm-modules.

    const screenModule = require('@/modules/speech-recognition-lab/screen');
    expect(screenModule).toBeTruthy();
    expect(screenModule.default ?? screenModule.SpeechRecognitionScreen).toBeTruthy();
  });
});
