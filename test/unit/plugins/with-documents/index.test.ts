/**
 * Tests for with-documents Expo config plugin — feature 032 / T047.
 *
 * @jest-environment node
 */

import withDocuments, {
  applyDocumentsInfoPlist,
  KEY_OPEN_IN_PLACE,
  KEY_FILE_SHARING,
} from '../../../../plugins/with-documents';
import withSpotlight from '../../../../plugins/with-spotlight';
import withBackgroundTasks from '../../../../plugins/with-background-tasks';
import withFocusFilters from '../../../../plugins/with-focus-filters';
import withCoreLocation from '../../../../plugins/with-core-location';
import type { ExpoConfig } from '@expo/config-types';

const USER_ACTIVITY_TYPES_KEY = 'NSUserActivityTypes';
const BACKGROUND_MODES_KEY = 'UIBackgroundModes';
const PERMITTED_IDS_KEY = 'BGTaskSchedulerPermittedIdentifiers';

describe('with-documents (pure mutation)', () => {
  it('P2 create-if-absent: virgin plist → both managed keys === true', () => {
    const out = applyDocumentsInfoPlist({});
    expect(out[KEY_OPEN_IN_PLACE]).toBe(true);
    expect(out[KEY_FILE_SHARING]).toBe(true);
  });

  it('P4 overwrite-if-different: pre-set false → overwritten to true; other keys byte-identical', () => {
    const input: Record<string, unknown> = {
      [KEY_OPEN_IN_PLACE]: false,
      [KEY_FILE_SHARING]: false,
      OtherKey: 'unchanged',
      AnArray: ['a', 'b'],
    };
    const out = applyDocumentsInfoPlist(input);
    expect(out[KEY_OPEN_IN_PLACE]).toBe(true);
    expect(out[KEY_FILE_SHARING]).toBe(true);
    // Other keys must be byte-identical
    const stripped = (obj: Record<string, unknown>) => {
      const rest: Record<string, unknown> = { ...obj };
      delete rest[KEY_OPEN_IN_PLACE];
      delete rest[KEY_FILE_SHARING];
      return rest;
    };
    expect(stripped(out)).toEqual(stripped(input));
  });

  it('P3 no-op-if-already-true: pre-set both true → output toEqual input', () => {
    const input = {
      [KEY_OPEN_IN_PLACE]: true,
      [KEY_FILE_SHARING]: true,
      Existing: 'value',
    };
    const out = applyDocumentsInfoPlist(input);
    expect(out).toEqual(input);
  });

  it('P5 idempotent: running twice yields toEqual-identical plist', () => {
    const once = applyDocumentsInfoPlist({ Existing: 'x' });
    const twice = applyDocumentsInfoPlist(once);
    expect(twice).toEqual(once);
  });

  it('P6 coexistence: running after all 31 prior plugin mutations preserves their keys', () => {
    // Reference fixture simulating the cumulative effect of prior plugins
    const priorPlist: Record<string, unknown> = {
      [USER_ACTIVITY_TYPES_KEY]: ['com.example.shortcut', 'spot.showcase.activity'],
      [BACKGROUND_MODES_KEY]: ['location', 'fetch', 'processing'],
      [PERMITTED_IDS_KEY]: ['com.izkizk8.spot.refresh', 'com.izkizk8.spot.processing'],
      NSCameraUsageDescription: 'Camera reason',
      NSPhotoLibraryUsageDescription: 'Photo reason',
      NSLocationWhenInUseUsageDescription: 'Location reason',
      NSMicrophoneUsageDescription: 'Mic reason',
      NSFaceIDUsageDescription: 'Face ID reason',
      NSSpeechRecognitionUsageDescription: 'Speech reason',
    };

    const observed = applyDocumentsInfoPlist(priorPlist);

    // (a) both managed keys present and true
    expect(observed[KEY_OPEN_IN_PLACE]).toBe(true);
    expect(observed[KEY_FILE_SHARING]).toBe(true);

    // (b) removing the two managed keys yields toEqual identity to the prior plist
    const stripManaged = (p: Record<string, unknown>) => {
      const rest: Record<string, unknown> = { ...p };
      delete rest[KEY_OPEN_IN_PLACE];
      delete rest[KEY_FILE_SHARING];
      return rest;
    };
    expect(stripManaged(observed)).toEqual(stripManaged(priorPlist));
  });

  it('P7 commutativity: ≥3 sampled orderings produce toEqual-identical final plist', () => {
    type Mut = (input: Record<string, unknown>) => Record<string, unknown>;
    const apply031: Mut = (i) => {
      const next = { ...i };
      const types = Array.isArray(next[USER_ACTIVITY_TYPES_KEY])
        ? [...(next[USER_ACTIVITY_TYPES_KEY] as string[])]
        : [];
      if (!types.includes('spot.showcase.activity')) types.push('spot.showcase.activity');
      next[USER_ACTIVITY_TYPES_KEY] = types;
      return next;
    };
    const apply030: Mut = (i) => {
      const next = { ...i };
      const ids = Array.isArray(next[PERMITTED_IDS_KEY])
        ? [...(next[PERMITTED_IDS_KEY] as string[])]
        : [];
      if (!ids.includes('com.izkizk8.spot.refresh')) ids.push('com.izkizk8.spot.refresh');
      const modes = Array.isArray(next[BACKGROUND_MODES_KEY])
        ? [...(next[BACKGROUND_MODES_KEY] as string[])]
        : [];
      if (!modes.includes('fetch')) modes.push('fetch');
      next[PERMITTED_IDS_KEY] = ids;
      next[BACKGROUND_MODES_KEY] = modes;
      return next;
    };
    const apply032: Mut = applyDocumentsInfoPlist;

    const orderings = [
      [apply030, apply031, apply032],
      [apply032, apply030, apply031],
      [apply031, apply032, apply030],
    ];

    const results = orderings.map((muts) =>
      muts.reduce<Record<string, unknown>>((acc, m) => m(acc), {}),
    );

    for (let i = 1; i < results.length; i++) {
      expect(results[i]).toEqual(results[0]);
    }
  });

  it('P8 no pbxproj mutation: source does not call withXcodeProject', () => {
    const fs = require('fs');
    const path = require('path');
    const src = fs.readFileSync(
      path.resolve(__dirname, '../../../../plugins/with-documents/index.ts'),
      'utf8',
    );
    expect(src).not.toMatch(/withXcodeProject/);
  });

  it('P9 no entitlement mutation: source does not call withEntitlementsPlist', () => {
    const fs = require('fs');
    const path = require('path');
    const src = fs.readFileSync(
      path.resolve(__dirname, '../../../../plugins/with-documents/index.ts'),
      'utf8',
    );
    expect(src).not.toMatch(/withEntitlementsPlist/);
  });

  it('P1 scope: plugin source does not reference any out-of-scope keys', () => {
    const fs = require('fs');
    const path = require('path');
    const src = fs.readFileSync(
      path.resolve(__dirname, '../../../../plugins/with-documents/index.ts'),
      'utf8',
    );
    // None of these key names should appear in the plugin source
    expect(src).not.toMatch(/NSUserActivityTypes/);
    expect(src).not.toMatch(/BGTaskSchedulerPermittedIdentifiers/);
    expect(src).not.toMatch(/UIBackgroundModes/);
    expect(src).not.toMatch(/NS\w+UsageDescription/);
  });

  it('source has no eslint-disable directives in plugin file (FR-020)', () => {
    const fs = require('fs');
    const path = require('path');
    const src = fs.readFileSync(
      path.resolve(__dirname, '../../../../plugins/with-documents/index.ts'),
      'utf8',
    );
    expect(src).not.toMatch(/eslint-disable/);
  });

  it('package.json has no runtime dependencies (NFR-005)', () => {
    const fs = require('fs');
    const path = require('path');
    const pkg = JSON.parse(
      fs.readFileSync(
        path.resolve(__dirname, '../../../../plugins/with-documents/package.json'),
        'utf8',
      ),
    );
    const deps = pkg.dependencies ?? {};
    expect(Object.keys(deps).length).toBe(0);
  });
});

describe('with-documents (ConfigPlugin)', () => {
  const baseConfig: ExpoConfig = {
    name: 'test-app',
    slug: 'test-app',
    ios: { bundleIdentifier: 'com.test.app' },
  };

  it('default-exports a function of (config) => config', () => {
    expect(typeof withDocuments).toBe('function');
    const result = withDocuments(baseConfig);
    expect(result).toBeDefined();
    expect(result.name).toBe('test-app');
  });

  it('mod-chain runs without throwing alongside prior Info.plist plugins (025/030/031)', () => {
    let config: ExpoConfig = baseConfig;
    expect(() => {
      config = withCoreLocation(config);
      config = withBackgroundTasks(config);
      config = withSpotlight(config);
      config = withDocuments(config);
    }).not.toThrow();
    expect(config).toBeDefined();
  });

  it('coexists with 029 (focus-filters Swift sources) at the config-shape level', () => {
    expect(typeof withFocusFilters).toBe('function');
  });

  it('emits no console.warn calls on a baseline config', () => {
    const spy = jest.spyOn(console, 'warn').mockImplementation();
    withDocuments(baseConfig);
    expect(spy).toHaveBeenCalledTimes(0);
    spy.mockRestore();
  });
});
