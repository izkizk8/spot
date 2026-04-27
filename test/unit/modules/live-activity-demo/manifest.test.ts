/**
 * Tests for the Live Activity Demo module manifest.
 *
 * Covers:
 * - Manifest id format validation
 * - Platform declaration
 * - minIOS requirement
 * - Icon configuration
 * - Registry inclusion
 *
 * @see specs/007-live-activities-dynamic-island/tasks.md T022
 */

import manifest from '@/modules/live-activity-demo';
import { MODULES } from '@/modules/registry';

describe('live-activity-demo manifest', () => {
  it('has valid id format (kebab-case, starts with letter)', () => {
    expect(manifest.id).toMatch(/^[a-z][a-z0-9-]*$/);
    expect(manifest.id).toBe('live-activity-demo');
  });

  it('has platforms set to iOS only', () => {
    expect(manifest.platforms).toEqual(['ios']);
  });

  it('has minIOS set to 16.1', () => {
    expect(manifest.minIOS).toBe('16.1');
    expect(manifest.minIOS).toMatch(/^\d+(\.\d+){0,2}$/);
  });

  it('has valid icon configuration', () => {
    expect(manifest.icon).toBeDefined();
    expect(typeof manifest.icon.ios).toBe('string');
    expect(manifest.icon.ios.length).toBeGreaterThan(0);
    expect(typeof manifest.icon.fallback).toBe('string');
    expect(manifest.icon.fallback.length).toBeGreaterThan(0);
  });

  it('has a title', () => {
    expect(typeof manifest.title).toBe('string');
    expect(manifest.title.length).toBeGreaterThan(0);
  });

  it('has a description', () => {
    expect(typeof manifest.description).toBe('string');
    expect(manifest.description.length).toBeGreaterThan(0);
  });

  it('has a render function', () => {
    expect(typeof manifest.render).toBe('function');
  });

  describe('registry inclusion', () => {
    it('is included in MODULES exactly once', () => {
      const matches = MODULES.filter((m) => m.id === 'live-activity-demo');
      expect(matches.length).toBe(1);
    });

    it('registry entry matches the exported manifest', () => {
      const registryEntry = MODULES.find((m) => m.id === 'live-activity-demo');
      expect(registryEntry).toBe(manifest);
    });
  });
});
