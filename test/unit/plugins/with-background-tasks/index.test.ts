/**
 * Tests for with-background-tasks Expo config plugin — feature 030 / T042.
 *
 * @jest-environment node
 */

import withBackgroundTasks, {
  applyBackgroundTasksInfoPlist,
  TASK_IDENTIFIER_REFRESH,
  TASK_IDENTIFIER_PROCESSING,
} from '../../../../plugins/with-background-tasks';
import withCoreLocation from '../../../../plugins/with-core-location';
import withFocusFilters from '../../../../plugins/with-focus-filters';
import withAppIntents from '../../../../plugins/with-app-intents';
import withHomeWidgets from '../../../../plugins/with-home-widgets';
import withRichNotifications from '../../../../plugins/with-rich-notifications';
import withLockWidgets from '../../../../plugins/with-lock-widgets';
import withStandbyWidget from '../../../../plugins/with-standby-widget';
import type { ExpoConfig } from '@expo/config-types';

const PERMITTED_IDS_KEY = 'BGTaskSchedulerPermittedIdentifiers';
const BACKGROUND_MODES_KEY = 'UIBackgroundModes';

describe('with-background-tasks (pure mutation)', () => {
  it('on a fresh Info.plist, BGTaskSchedulerPermittedIdentifiers === [refresh, processing] (FR-090)', () => {
    const out = applyBackgroundTasksInfoPlist({});
    expect(out[PERMITTED_IDS_KEY]).toEqual([
      TASK_IDENTIFIER_REFRESH,
      TASK_IDENTIFIER_PROCESSING,
    ]);
  });

  it('preserves prior identifiers (union, FR-090 / EC-006)', () => {
    const out = applyBackgroundTasksInfoPlist({
      [PERMITTED_IDS_KEY]: ['com.example.other'],
    });
    expect(out[PERMITTED_IDS_KEY]).toEqual([
      'com.example.other',
      TASK_IDENTIFIER_REFRESH,
      TASK_IDENTIFIER_PROCESSING,
    ]);
  });

  it('UIBackgroundModes ⊇ [fetch, processing] on a fresh plist (FR-091)', () => {
    const out = applyBackgroundTasksInfoPlist({});
    const modes = out[BACKGROUND_MODES_KEY] as string[];
    expect(modes).toEqual(expect.arrayContaining(['fetch', 'processing']));
  });

  it('preserves feature 025 "location" entry at its original index (FR-091 / EC-007 / SC-008)', () => {
    const out = applyBackgroundTasksInfoPlist({
      [BACKGROUND_MODES_KEY]: ['location'],
    });
    expect(out[BACKGROUND_MODES_KEY]).toEqual(['location', 'fetch', 'processing']);
  });

  it('idempotent — second application is a no-op (FR-092 / SC-005)', () => {
    const once = applyBackgroundTasksInfoPlist({
      [BACKGROUND_MODES_KEY]: ['location'],
    });
    const twice = applyBackgroundTasksInfoPlist(once);
    // byte-identical: stringify both and compare
    expect(JSON.stringify(twice)).toBe(JSON.stringify(once));
    expect(twice[BACKGROUND_MODES_KEY]).toEqual(once[BACKGROUND_MODES_KEY]);
    expect(twice[PERMITTED_IDS_KEY]).toEqual(once[PERMITTED_IDS_KEY]);
  });

  it('idempotent when both new ids already present (defensive)', () => {
    const input = {
      [PERMITTED_IDS_KEY]: [TASK_IDENTIFIER_REFRESH, TASK_IDENTIFIER_PROCESSING],
      [BACKGROUND_MODES_KEY]: ['fetch', 'processing'],
    };
    const out = applyBackgroundTasksInfoPlist(input);
    expect(JSON.stringify(out)).toBe(JSON.stringify(input));
  });

  it('coexists with feature 025 location: prior order preserved verbatim', () => {
    const input = {
      [BACKGROUND_MODES_KEY]: ['location'],
      [PERMITTED_IDS_KEY]: ['com.example.legacy'],
    };
    const out = applyBackgroundTasksInfoPlist(input);
    const modes = out[BACKGROUND_MODES_KEY] as string[];
    const ids = out[PERMITTED_IDS_KEY] as string[];
    // toEqual asserts prior ordering preserved + new entries appended
    expect(modes).toEqual(['location', 'fetch', 'processing']);
    expect(ids).toEqual(['com.example.legacy', TASK_IDENTIFIER_REFRESH, TASK_IDENTIFIER_PROCESSING]);
  });

  it('commutativity across {025, 029, 030} mutations (FR-093)', () => {
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
    const apply029: Mut = (i) => i; // 029 only adds Swift sources, no Info.plist keys.
    const apply030: Mut = applyBackgroundTasksInfoPlist;

    const orderings = [
      [apply025, apply029, apply030],
      [apply025, apply030, apply029],
      [apply030, apply025, apply029],
      [apply029, apply030, apply025],
    ];

    const results = orderings.map((muts) =>
      muts.reduce<Record<string, unknown>>((acc, m) => m(acc), {}),
    );
    // Compare semantic equivalence (set-equality of the two arrays)
    for (let i = 1; i < results.length; i++) {
      const a = results[0];
      const b = results[i];
      const sortStr = (xs: unknown) =>
        Array.isArray(xs) ? [...xs].sort().join(',') : '';
      expect(sortStr(a[BACKGROUND_MODES_KEY])).toBe(sortStr(b[BACKGROUND_MODES_KEY]));
      expect(sortStr(a[PERMITTED_IDS_KEY])).toBe(sortStr(b[PERMITTED_IDS_KEY]));
    }
  });

  it('plugin source has no eslint-disable directives (FR-100)', () => {
    const fs = require('fs');
    const path = require('path');
    const filePath = path.resolve(__dirname, '../../../../plugins/with-background-tasks/index.ts');
    const src = fs.readFileSync(filePath, 'utf8');
    expect(src).not.toMatch(/eslint-disable/);
  });
});

describe('with-background-tasks (ConfigPlugin)', () => {
  const baseConfig: ExpoConfig = {
    name: 'test-app',
    slug: 'test-app',
    ios: { bundleIdentifier: 'com.test.app' },
  };

  it('default-exports a function of (config) => config', () => {
    expect(typeof withBackgroundTasks).toBe('function');
    const result = withBackgroundTasks(baseConfig);
    expect(result).toBeDefined();
    expect(result.name).toBe('test-app');
  });

  it('mod-chain runs without throwing alongside Info.plist-pure plugins (025/030)', () => {
    let config: ExpoConfig = baseConfig;
    expect(() => {
      config = withCoreLocation(config);
      config = withBackgroundTasks(config);
    }).not.toThrow();
    expect(config).toBeDefined();
  });

  it('coexists with 029 (focus-filters Swift sources) at the config-shape level', () => {
    // We can't actually invoke withFocusFilters here because it touches the
    // Xcode project mod-runner; we only verify the symbols can be required
    // without crashing.
    expect(typeof withFocusFilters).toBe('function');
    expect(typeof withAppIntents).toBe('function');
    expect(typeof withHomeWidgets).toBe('function');
    expect(typeof withRichNotifications).toBe('function');
    expect(typeof withLockWidgets).toBe('function');
    expect(typeof withStandbyWidget).toBe('function');
  });

  it('emits no console.warn calls on a baseline config', () => {
    const spy = jest.spyOn(console, 'warn').mockImplementation();
    withBackgroundTasks(baseConfig);
    expect(spy).toHaveBeenCalledTimes(0);
    spy.mockRestore();
  });
});
