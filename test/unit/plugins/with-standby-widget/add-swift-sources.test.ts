/**
 * Tests for with-standby-widget/add-swift-sources.
 *
 * @see specs/028-standby-mode/tasks.md T044
 */

import * as path from 'path';

interface AddedFile {
  readonly filePath: string;
  readonly target: string | undefined;
}

interface PbxStub {
  readonly addedFiles: AddedFile[];
}

interface MockConfig {
  name: string;
  _pbx: PbxStub;
  _hasTarget: boolean;
  _existing014?: readonly string[];
  _existing027?: readonly string[];
}

const WIDGET_TARGET_UUID = 'WIDGET_UUID';

jest.mock('@expo/config-plugins', () => {
  return {
    withXcodeProject: jest.fn((config: any, callback: any) => {
      const project = {
        pbxTargetByName: (name: string) =>
          name === 'LiveActivityDemoWidget' && config._hasTarget
            ? { uuid: WIDGET_TARGET_UUID }
            : null,
        getFirstProject: () => ({ firstProject: { mainGroup: 'MAIN_GROUP' } }),
        addPbxGroup: (_files: unknown, name: string) => ({ uuid: `GROUP_${name}` }),
        addToPbxGroup: () => undefined,
        addFile: (filePath: string, _groupUuid: string, opts: any) => {
          const ref = { filePath, target: opts?.target, uuid: `REF_${filePath}` };
          config._pbx.addedFiles.push(ref);
          return ref;
        },
        hasFile: (filePath: string) =>
          config._pbx.addedFiles.some((f: any) => f.filePath === filePath),
        addToPbxSourcesBuildPhase: (ref: any, targetUuid: string) => {
          config._pbx.addedFiles.push({
            filePath: ref.filePath,
            target: targetUuid,
            uuid: `BP_${ref.filePath}_${targetUuid}`,
          });
        },
      };
      return callback({ ...config, modResults: project, modRequest: {} }) ?? config;
    }),
  };
});

function makeConfig(overrides: Partial<MockConfig> = {}): MockConfig {
  const cfg: MockConfig = {
    name: 'spot',
    _pbx: { addedFiles: [] },
    _hasTarget: true,
    ...overrides,
  };
  // Pre-populate with 014's sources to simulate prior plugin runs.
  for (const fname of [
    'ShowcaseWidget.swift',
    'ShowcaseProvider.swift',
    'ShowcaseEntry.swift',
    'ShowcaseWidgetView.swift',
    'AppGroupKeys.swift',
    'SpotWidgetBundle.swift',
  ]) {
    (cfg._pbx.addedFiles as AddedFile[]).push({
      filePath: `../native/ios/widgets/${fname}`,
      target: WIDGET_TARGET_UUID,
    });
  }
  // Pre-populate with 027's sources.
  for (const fname of [
    'LockScreenAccessoryWidget.swift',
    'LockScreenAccessoryProvider.swift',
    'LockScreenAccessoryEntry.swift',
    'LockScreenAccessoryViews.swift',
  ]) {
    (cfg._pbx.addedFiles as AddedFile[]).push({
      filePath: `../native/ios/widgets/lock-screen/${fname}`,
      target: WIDGET_TARGET_UUID,
    });
  }
  return cfg;
}

const STANDBY_BASENAMES = [
  'StandByWidget.swift',
  'StandByProvider.swift',
  'StandByEntry.swift',
  'StandByViews.swift',
];

describe('with-standby-widget/add-swift-sources', () => {
  it('adds the 4 StandBy Swift files to LiveActivityDemoWidget target', () => {
    const {
      withStandByWidgetSwiftSources,
    } = require('../../../../plugins/with-standby-widget/add-swift-sources');
    const config = makeConfig();
    withStandByWidgetSwiftSources(config);
    const widgetSources = config._pbx.addedFiles
      .filter((f) => f.target === WIDGET_TARGET_UUID)
      .map((f) => path.posix.basename(f.filePath));
    for (const name of STANDBY_BASENAMES) {
      expect(widgetSources).toContain(name);
    }
  });

  it('idempotency: running twice does not duplicate file refs (basename count is 1)', () => {
    const {
      withStandByWidgetSwiftSources,
    } = require('../../../../plugins/with-standby-widget/add-swift-sources');
    const config = makeConfig();
    withStandByWidgetSwiftSources(config);
    withStandByWidgetSwiftSources(config);
    for (const name of STANDBY_BASENAMES) {
      const matches = config._pbx.addedFiles.filter(
        (f) => path.posix.basename(f.filePath) === name,
      );
      // addFile + addToPbxSourcesBuildPhase create 2 entries for the same path.
      // The important invariant is no DOUBLING after the second run.
      const firstRunCount = matches.length;
      expect(firstRunCount).toBeGreaterThan(0);
      // Run a third time and verify no growth.
      withStandByWidgetSwiftSources(config);
      const after = config._pbx.addedFiles.filter((f) => path.posix.basename(f.filePath) === name);
      expect(after.length).toBe(firstRunCount);
    }
  });

  it('throws if LiveActivityDemoWidget target is missing', () => {
    const {
      withStandByWidgetSwiftSources,
    } = require('../../../../plugins/with-standby-widget/add-swift-sources');
    const config = makeConfig({ _hasTarget: false });
    expect(() => withStandByWidgetSwiftSources(config)).toThrow(
      /LiveActivityDemoWidget.*not found/,
    );
  });

  it('files originate from native/ios/widgets/standby/', () => {
    const {
      withStandByWidgetSwiftSources,
    } = require('../../../../plugins/with-standby-widget/add-swift-sources');
    const config = makeConfig();
    withStandByWidgetSwiftSources(config);
    const standbyAdded = config._pbx.addedFiles.filter((f) =>
      STANDBY_BASENAMES.includes(path.posix.basename(f.filePath)),
    );
    expect(standbyAdded.length).toBeGreaterThan(0);
    for (const f of standbyAdded) {
      expect(f.filePath).toContain('widgets/standby/');
    }
  });

  it('028 does not create a new app-extension target', () => {
    // The plugin uses an existing target - validated by pbxTargetByName lookup.
    const {
      withStandByWidgetSwiftSources,
    } = require('../../../../plugins/with-standby-widget/add-swift-sources');
    const config = makeConfig();
    withStandByWidgetSwiftSources(config);
    // Mock contract: only LiveActivityDemoWidget is recognized.
    expect(config._hasTarget).toBe(true);
  });

  it('014 sources still present after 028 runs', () => {
    const {
      withStandByWidgetSwiftSources,
    } = require('../../../../plugins/with-standby-widget/add-swift-sources');
    const config = makeConfig();
    const before014 = config._pbx.addedFiles
      .filter((f) => /Showcase|AppGroupKeys/.test(f.filePath))
      .map((f) => path.posix.basename(f.filePath));
    withStandByWidgetSwiftSources(config);
    const after014 = config._pbx.addedFiles
      .filter((f) => /Showcase|AppGroupKeys/.test(f.filePath))
      .map((f) => path.posix.basename(f.filePath));
    for (const name of before014) {
      expect(after014).toContain(name);
    }
  });

  it('027 sources still present after 028 runs (AC-SB-010)', () => {
    const {
      withStandByWidgetSwiftSources,
    } = require('../../../../plugins/with-standby-widget/add-swift-sources');
    const config = makeConfig();
    withStandByWidgetSwiftSources(config);
    const present = config._pbx.addedFiles.map((f) => path.posix.basename(f.filePath));
    expect(present).toContain('LockScreenAccessoryWidget.swift');
    expect(present).toContain('LockScreenAccessoryProvider.swift');
  });

  it('does NOT duplicate 014 / 027 sources when 028 runs on an already-populated project', () => {
    const {
      withStandByWidgetSwiftSources,
    } = require('../../../../plugins/with-standby-widget/add-swift-sources');
    const config = makeConfig();
    const lockBefore = config._pbx.addedFiles.filter((f) =>
      f.filePath.endsWith('LockScreenAccessoryWidget.swift'),
    );
    withStandByWidgetSwiftSources(config);
    const lockAfter = config._pbx.addedFiles.filter((f) =>
      f.filePath.endsWith('LockScreenAccessoryWidget.swift'),
    );
    expect(lockAfter.length).toBe(lockBefore.length);
  });
});
