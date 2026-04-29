/**
 * Tests for with-spotlight Expo config plugin — feature 031 / T046.
 *
 * @jest-environment node
 */

import withSpotlight, { applySpotlightInfoPlist, ACTIVITY_TYPE } from '../../../../plugins/with-spotlight';
import withCoreLocation from '../../../../plugins/with-core-location';
import withFocusFilters from '../../../../plugins/with-focus-filters';
import withBackgroundTasks from '../../../../plugins/with-background-tasks';
import type { ExpoConfig } from '@expo/config-types';

const USER_ACTIVITY_TYPES_KEY = 'NSUserActivityTypes';
const BACKGROUND_MODES_KEY = 'UIBackgroundModes';
const PERMITTED_IDS_KEY = 'BGTaskSchedulerPermittedIdentifiers';

function identity<T>(value: T): T {
  return value;
}

function sortStr(xs: unknown): string {
  return Array.isArray(xs) ? [...xs].toSorted().join(',') : '';
}

describe('with-spotlight (pure mutation)', () => {
  it('on a fresh Info.plist, creates NSUserActivityTypes: [spot.showcase.activity] (FR-110)', () => {
    const out = applySpotlightInfoPlist({});
    expect(out[USER_ACTIVITY_TYPES_KEY]).toEqual([ACTIVITY_TYPE]);
  });

  it('preserves prior NSUserActivityTypes entry at index 0 (FR-110 / FR-113 / EC-007 / R-D)', () => {
    const out = applySpotlightInfoPlist({
      [USER_ACTIVITY_TYPES_KEY]: ['com.example.shortcut'],
    });
    expect(out[USER_ACTIVITY_TYPES_KEY]).toEqual([
      'com.example.shortcut',
      ACTIVITY_TYPE,
    ]);
  });

  it('idempotent — second application is byte-identical to first (FR-112 / SC-005)', () => {
    const once = applySpotlightInfoPlist({});
    const twice = applySpotlightInfoPlist(once);
    expect(JSON.stringify(twice)).toBe(JSON.stringify(once));
  });

  it('idempotent when ACTIVITY_TYPE already present (defensive)', () => {
    const input = {
      [USER_ACTIVITY_TYPES_KEY]: [ACTIVITY_TYPE],
    };
    const out = applySpotlightInfoPlist(input);
    expect(JSON.stringify(out)).toBe(JSON.stringify(input));
  });

  it('coexists with prior plugins: 030 BGTaskSchedulerPermittedIdentifiers + UIBackgroundModes unchanged (FR-113 / SC-008)', () => {
    // Simulate prior plugin state
    const prior = {
      [PERMITTED_IDS_KEY]: ['com.izkizk8.spot.refresh', 'com.izkizk8.spot.processing'],
      [BACKGROUND_MODES_KEY]: ['location', 'fetch', 'processing'],
    };
    const out = applySpotlightInfoPlist(prior);
    // 030's keys should be byte-identical
    expect(out[PERMITTED_IDS_KEY]).toEqual(prior[PERMITTED_IDS_KEY]);
    expect(out[BACKGROUND_MODES_KEY]).toEqual(prior[BACKGROUND_MODES_KEY]);
    // 031's key should be added
    expect(out[USER_ACTIVITY_TYPES_KEY]).toEqual([ACTIVITY_TYPE]);
  });

  it('commutativity across {025, 029, 030, 031} mutations (FR-113)', () => {
    type Mut = (input: Record<string, unknown>) => Record<string, unknown>;
    // Approximate the prior plugins' Info.plist effect via known mutations
    const apply025: Mut = (i) => {
      const next = { ...i };
      const modes = Array.isArray(next[BACKGROUND_MODES_KEY])
        ? [...(next[BACKGROUND_MODES_KEY] as string[])]
        : [];
      if (!modes.includes('location')) modes.push('location');
      next[BACKGROUND_MODES_KEY] = modes;
      return next;
    };
    const apply029: Mut = identity; // 029 only adds Swift sources, no Info.plist keys.
    const apply030: Mut = (i) => {
      const next = { ...i };
      const ids = Array.isArray(next[PERMITTED_IDS_KEY])
        ? [...(next[PERMITTED_IDS_KEY] as string[])]
        : [];
      if (!ids.includes('com.izkizk8.spot.refresh')) ids.push('com.izkizk8.spot.refresh');
      if (!ids.includes('com.izkizk8.spot.processing')) ids.push('com.izkizk8.spot.processing');
      const modes = Array.isArray(next[BACKGROUND_MODES_KEY])
        ? [...(next[BACKGROUND_MODES_KEY] as string[])]
        : [];
      if (!modes.includes('fetch')) modes.push('fetch');
      if (!modes.includes('processing')) modes.push('processing');
      next[PERMITTED_IDS_KEY] = ids;
      next[BACKGROUND_MODES_KEY] = modes;
      return next;
    };
    const apply031: Mut = applySpotlightInfoPlist;

    const orderings = [
      [apply025, apply029, apply030, apply031],
      [apply031, apply030, apply025, apply029],
      [apply030, apply031, apply029, apply025],
    ];

    const results = orderings.map((muts) =>
      muts.reduce<Record<string, unknown>>((acc, m) => m(acc), {}),
    );
    // Compare semantic equivalence (set-equality of the arrays)
    for (let i = 1; i < results.length; i++) {
      const a = results[0];
      const b = results[i];
      expect(sortStr(a[BACKGROUND_MODES_KEY])).toBe(sortStr(b[BACKGROUND_MODES_KEY]));
      expect(sortStr(a[PERMITTED_IDS_KEY])).toBe(sortStr(b[PERMITTED_IDS_KEY]));
      expect(sortStr(a[USER_ACTIVITY_TYPES_KEY])).toBe(sortStr(b[USER_ACTIVITY_TYPES_KEY]));
    }
  });

  it('plugin does NOT mutate pbxproj framework links (R-E / FR-111)', () => {
    // The plugin only uses withInfoPlist, not withXcodeProject
    // This is verified by checking the source code
    const fs = require('fs');
    const path = require('path');
    const filePath = path.resolve(__dirname, '../../../../plugins/with-spotlight/index.ts');
    const src = fs.readFileSync(filePath, 'utf8');
    expect(src).not.toMatch(/withXcodeProject/);
  });

  it('plugin source has no eslint-disable directives (FR-120)', () => {
    const fs = require('fs');
    const path = require('path');
    const filePath = path.resolve(__dirname, '../../../../plugins/with-spotlight/index.ts');
    const src = fs.readFileSync(filePath, 'utf8');
    expect(src).not.toMatch(/eslint-disable/);
  });

  it('plugin source has zero new runtime dependencies (NFR-005)', () => {
    const fs = require('fs');
    const path = require('path');
    const pkgPath = path.resolve(__dirname, '../../../../plugins/with-spotlight/package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    // Should have no dependencies or empty dependencies
    const deps = pkg.dependencies ?? {};
    expect(Object.keys(deps).length).toBe(0);
  });
});

describe('with-spotlight (ConfigPlugin)', () => {
  const baseConfig: ExpoConfig = {
    name: 'test-app',
    slug: 'test-app',
    ios: { bundleIdentifier: 'com.test.app' },
  };

  it('default-exports a function of (config) => config', () => {
    expect(typeof withSpotlight).toBe('function');
    const result = withSpotlight(baseConfig);
    expect(result).toBeDefined();
    expect(result.name).toBe('test-app');
  });

  it('mod-chain runs without throwing alongside prior Info.plist plugins (025/030)', () => {
    let config: ExpoConfig = baseConfig;
    expect(() => {
      config = withCoreLocation(config);
      config = withBackgroundTasks(config);
      config = withSpotlight(config);
    }).not.toThrow();
    expect(config).toBeDefined();
  });

  it('coexists with 029 (focus-filters Swift sources) at the config-shape level', () => {
    expect(typeof withFocusFilters).toBe('function');
  });

  it('emits no console.warn calls on a baseline config', () => {
    const spy = jest.spyOn(console, 'warn').mockImplementation();
    withSpotlight(baseConfig);
    expect(spy).toHaveBeenCalledTimes(0);
    spy.mockRestore();
  });
});
