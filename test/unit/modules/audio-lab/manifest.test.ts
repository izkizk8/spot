/**
 * T017: Manifest + registry test for `audio-lab` module (feature 020).
 *
 * FR-001 / FR-002 / A-06.
 */

import audioLabManifest from '@/modules/audio-lab';
import { MODULES } from '@/modules/registry';

describe('audio-lab manifest', () => {
  it('id matches kebab-case and equals "audio-lab"', () => {
    expect(audioLabManifest.id).toMatch(/^[a-z][a-z0-9-]*$/);
    expect(audioLabManifest.id).toBe('audio-lab');
  });

  it('title === "Audio Lab"', () => {
    expect(audioLabManifest.title).toBe('Audio Lab');
  });

  it('platforms is exactly ["ios", "android", "web"]', () => {
    expect(audioLabManifest.platforms).toEqual(['ios', 'android', 'web']);
  });

  it('minIOS === "11.0"', () => {
    expect(audioLabManifest.minIOS).toBe('11.0');
  });

  it('description is non-empty', () => {
    expect(audioLabManifest.description.length).toBeGreaterThan(0);
  });

  it('render is a function returning a React element', () => {
    expect(typeof audioLabManifest.render).toBe('function');
    const el = audioLabManifest.render();
    expect(el).toBeTruthy();
  });
});

describe('registry includes audio-lab exactly once', () => {
  it('contains the audio-lab manifest once', () => {
    const matches = MODULES.filter((m) => m.id === 'audio-lab');
    expect(matches).toHaveLength(1);
    expect(matches[0]).toBe(audioLabManifest);
  });
});
