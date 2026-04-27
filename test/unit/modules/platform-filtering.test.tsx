import { describe, expect, it, jest } from '@jest/globals';
import React from 'react';

import type { ModuleManifest, ModulePlatform } from '@/modules/types';

/**
 * Pure helpers under test — these mirror the logic embedded in
 * src/app/modules/index.tsx and src/app/modules/[id].tsx so we can unit-test
 * the unsupported-platform branch without rendering the routes themselves.
 */

function isAvailable(
  manifest: ModuleManifest,
  currentPlatform: ModulePlatform,
  currentIOSVersion?: string,
): boolean {
  if (!manifest.platforms.includes(currentPlatform)) return false;
  if (currentPlatform === 'ios' && manifest.minIOS != null && currentIOSVersion != null) {
    return cmpSemver(currentIOSVersion, manifest.minIOS) >= 0;
  }
  return true;
}

function cmpSemver(a: string, b: string): number {
  const pa = a.split('.').map((n) => Number.parseInt(n, 10) || 0);
  const pb = b.split('.').map((n) => Number.parseInt(n, 10) || 0);
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i++) {
    const av = pa[i] ?? 0;
    const bv = pb[i] ?? 0;
    if (av !== bv) return av - bv;
  }
  return 0;
}

const renderSpy = jest.fn(() => React.createElement('View'));

const iosOnlyManifest: ModuleManifest = {
  id: 'ios-only',
  title: 'iOS Only',
  description: 'desc',
  icon: { ios: 'sparkles', fallback: '✦' },
  platforms: ['ios'],
  render: renderSpy,
};

const iosWithMinManifest: ModuleManifest = {
  id: 'needs-ios-17',
  title: 'Needs iOS 17',
  description: 'desc',
  icon: { ios: 'sparkles', fallback: '✦' },
  platforms: ['ios'],
  minIOS: '17.0',
  render: renderSpy,
};

describe('platform filtering (FR-010, FR-006)', () => {
  it('iOS-only module is unavailable on Android (unsupported badge path)', () => {
    expect(isAvailable(iosOnlyManifest, 'android')).toBe(false);
  });

  it('iOS-only module is unavailable on web', () => {
    expect(isAvailable(iosOnlyManifest, 'web')).toBe(false);
  });

  it('iOS-only module is available on iOS', () => {
    expect(isAvailable(iosOnlyManifest, 'ios')).toBe(true);
  });

  it('does not invoke render() for an unavailable module (tap does not throw)', () => {
    renderSpy.mockClear();
    if (isAvailable(iosOnlyManifest, 'android')) {
      iosOnlyManifest.render();
    }
    expect(renderSpy).not.toHaveBeenCalled();
  });

  // T037 — minIOS gating
  it('treats a module with minIOS 17.0 as unavailable on iOS 16.0 (FR-006)', () => {
    expect(isAvailable(iosWithMinManifest, 'ios', '16.0')).toBe(false);
  });

  it('treats a module with minIOS 17.0 as available on iOS 17.0 and above', () => {
    expect(isAvailable(iosWithMinManifest, 'ios', '17.0')).toBe(true);
    expect(isAvailable(iosWithMinManifest, 'ios', '18.1')).toBe(true);
  });
});
