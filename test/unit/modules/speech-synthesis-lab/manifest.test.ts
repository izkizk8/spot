/**
 * T011: Manifest test for speech-synthesis-lab module.
 */

import SpeechSynthesisLabManifest from '@/modules/speech-synthesis-lab';

describe('speech-synthesis-lab manifest', () => {
  it('id matches kebab-case and equals "speech-synthesis-lab"', () => {
    expect(SpeechSynthesisLabManifest.id).toMatch(/^[a-z][a-z0-9-]*$/);
    expect(SpeechSynthesisLabManifest.id).toBe('speech-synthesis-lab');
  });

  it('title is "Speech Synthesis"', () => {
    expect(SpeechSynthesisLabManifest.title).toBe('Speech Synthesis');
  });

  it('platforms includes ios, android, and web', () => {
    expect(SpeechSynthesisLabManifest.platforms).toEqual(
      expect.arrayContaining(['ios', 'android', 'web']),
    );
  });

  it('minIOS === "7.0"', () => {
    expect(SpeechSynthesisLabManifest.minIOS).toBe('7.0');
  });

  it('render is a function returning a React element', () => {
    expect(typeof SpeechSynthesisLabManifest.render).toBe('function');
    const el = SpeechSynthesisLabManifest.render();
    expect(el).toBeTruthy();
  });

  it('screen module resolves via require (FR-001/FR-003)', () => {
    const screenModule = require('@/modules/speech-synthesis-lab/screen');
    expect(screenModule).toBeTruthy();
    expect(screenModule.default).toBeTruthy();
  });
});
