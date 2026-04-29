/**
 * EventKit Lab manifest tests.
 * Feature: 037-eventkit
 *
 * @see specs/037-eventkit/contracts/module-manifest.md
 */

jest.mock('expo-calendar', () => ({}));

import manifest, {
  MANIFEST_ID,
  MANIFEST_TITLE,
  MANIFEST_PLATFORMS,
  MANIFEST_MIN_IOS,
} from '@/modules/eventkit-lab/index';

describe('EventKit Lab manifest', () => {
  it('M1: manifest object shape matches other modules', () => {
    expect(manifest).toHaveProperty('id');
    expect(manifest).toHaveProperty('title');
    expect(manifest).toHaveProperty('description');
    expect(manifest).toHaveProperty('icon');
    expect(manifest).toHaveProperty('platforms');
    expect(manifest).toHaveProperty('minIOS');
    expect(manifest).toHaveProperty('render');
  });

  it('M2: id is eventkit-lab', () => {
    expect(manifest.id).toBe('eventkit-lab');
    expect(MANIFEST_ID).toBe('eventkit-lab');
  });

  it('M3: title matches MANIFEST_TITLE export', () => {
    expect(manifest.title).toBe(MANIFEST_TITLE);
    expect(manifest.title).toBe('EventKit Lab');
  });

  it('M4: platforms deep-equals [ios, android, web]', () => {
    expect(manifest.platforms).toEqual(['ios', 'android', 'web']);
    expect([...MANIFEST_PLATFORMS]).toEqual(['ios', 'android', 'web']);
  });

  it('M5: minIOS is 4.0', () => {
    expect(manifest.minIOS).toBe('4.0');
    expect(MANIFEST_MIN_IOS).toBe('4.0');
  });

  it('M6: render is a function', () => {
    expect(typeof manifest.render).toBe('function');
  });

  it('M7: default export equals named manifest export', () => {
    const mod = require('@/modules/eventkit-lab/index');
    expect(mod.default).toBe(mod.manifest);
  });
});
