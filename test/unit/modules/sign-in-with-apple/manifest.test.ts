/**
 * Test suite for sign-in-with-apple manifest (feature 021).
 */

import { MODULES } from '@/modules/registry';
import manifest from '@/modules/sign-in-with-apple';

describe('sign-in-with-apple manifest', () => {
  it('has the correct id', () => {
    expect(manifest.id).toBe('sign-in-with-apple');
  });

  it('is kebab-case', () => {
    expect(manifest.id).toMatch(/^[a-z][a-z0-9-]*$/);
  });

  it('appears in MODULES exactly once', () => {
    const occurrences = MODULES.filter((m) => m.id === 'sign-in-with-apple');
    expect(occurrences).toHaveLength(1);
  });

  it('has the expected platforms', () => {
    expect(manifest.platforms).toEqual(['ios', 'android', 'web']);
  });

  it('has minIOS 13.0', () => {
    expect(manifest.minIOS).toBe('13.0');
  });

  it('has a title', () => {
    expect(manifest.title).toBeTruthy();
    expect(typeof manifest.title).toBe('string');
  });

  it('has a description', () => {
    expect(manifest.description).toBeTruthy();
    expect(typeof manifest.description).toBe('string');
  });

  it('has an icon', () => {
    expect(manifest.icon).toBeTruthy();
    expect(manifest.icon.ios).toBe('apple.logo');
  });

  it('has a render function', () => {
    expect(typeof manifest.render).toBe('function');
  });
});
