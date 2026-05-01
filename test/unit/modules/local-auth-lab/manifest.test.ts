/**
 * Test suite for local-auth-lab manifest (feature 022).
 */

import { MODULES } from '@/modules/registry';
import manifest from '@/modules/local-auth-lab';

describe('local-auth-lab manifest', () => {
  it('has the correct id', () => {
    expect(manifest.id).toBe('local-auth-lab');
  });

  it('is kebab-case', () => {
    expect(manifest.id).toMatch(/^[a-z][a-z0-9-]*$/);
  });

  it('appears in MODULES exactly once', () => {
    const occurrences = MODULES.filter((m) => m.id === 'local-auth-lab');
    expect(occurrences).toHaveLength(1);
  });

  it('has the expected platforms', () => {
    expect(manifest.platforms).toEqual(['ios', 'android', 'web']);
  });

  it('has minIOS 8.0', () => {
    expect(manifest.minIOS).toBe('8.0');
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
    expect(manifest.icon.ios).toBe('faceid');
  });

  it('has a render function', () => {
    expect(typeof manifest.render).toBe('function');
  });
});
