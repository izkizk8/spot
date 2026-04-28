/**
 * Tests for with-standby-widget pipeline composition.
 *
 * The transform invariants (idempotency, commutativity with 027 / 014,
 * fail-loud propagation, three-way ordering) are exhaustively covered by
 * `insert-bundle-entry.test.ts` against the pure transform function.
 * This file focuses on plugin composition: that the default export
 * chains its two sub-plugins, declares zero dependencies, and emits no
 * console warnings on a baseline config.
 *
 * @see specs/028-standby-mode/tasks.md T045
 */

import { insertBundleEntry as standbyInsertBundleEntry } from '../../../../plugins/with-standby-widget/insert-bundle-entry';
import { insertBundleEntry as lockInsertBundleEntry } from '../../../../plugins/with-lock-widgets/insert-bundle-entry';

interface AddedFile {
  readonly filePath: string;
  readonly target: string | undefined;
}

const WIDGET_TARGET_UUID = 'WIDGET_UUID';
const MAIN_TARGET_UUID = 'MAIN_UUID';

const dangerousModInvocations: Array<{ platform: string }> = [];

jest.mock('@expo/config-plugins', () => {
  return {
    withXcodeProject: jest.fn((config: any, callback: any) => {
      const project = {
        pbxTargetByName: (name: string) =>
          name === 'LiveActivityDemoWidget' ? { uuid: WIDGET_TARGET_UUID } : null,
        getFirstTarget: () => ({ uuid: MAIN_TARGET_UUID }),
        getFirstProject: () => ({ firstProject: { mainGroup: 'MAIN_GROUP' } }),
        addPbxGroup: (_files: unknown, name: string) => ({ uuid: `GROUP_${name}` }),
        addToPbxGroup: () => undefined,
        addFile: (filePath: string, _groupUuid: string, opts: any) => {
          const ref = { filePath, target: opts?.target, uuid: `REF_${filePath}` };
          config._pbx.addedFiles.push(ref);
          return ref;
        },
        hasFile: (filePath: string) =>
          config._pbx.addedFiles.some((f: AddedFile) => f.filePath === filePath),
        addToPbxSourcesBuildPhase: (ref: any, targetUuid: string) => {
          config._pbx.addedFiles.push({
            filePath: ref.filePath,
            target: targetUuid,
            uuid: `BP_${ref.filePath}_${targetUuid}`,
          });
        },
      };
      const result = callback({ ...config, modResults: project, modRequest: {} });
      if (result && typeof result.then === 'function') return config;
      return result ?? config;
    }),
    withDangerousMod: jest.fn((config: any, modSpec: any) => {
      dangerousModInvocations.push({ platform: modSpec[0] });
      return config;
    }),
    withEntitlementsPlist: jest.fn((config: any) => config),
    withInfoPlist: jest.fn((config: any) => config),
    IOSConfig: {
      BundleIdentifier: { getBundleIdentifier: jest.fn(() => 'com.test.app') },
    },
    ConfigPlugin: {},
  };
});

function makeConfig(): any {
  return {
    name: 'spot',
    slug: 'spot',
    ios: { bundleIdentifier: 'com.test.app' },
    _pbx: { addedFiles: [] },
  };
}

function getStandBy() {
  return require('../../../../plugins/with-standby-widget/index').default;
}

beforeEach(() => {
  dangerousModInvocations.length = 0;
});

describe('with-standby-widget plugin pipeline', () => {
  it('default export is a function (ConfigPlugin)', () => {
    expect(typeof getStandBy()).toBe('function');
  });

  it('chains the two sub-plugins (Swift sources + bundle entry insert)', () => {
    const cfg = makeConfig();
    getStandBy()(cfg);
    // After running, Swift sources have been added (via withXcodeProject) AND
    // a withDangerousMod has been queued for the iOS platform (bundle insert).
    const standbyAdded = cfg._pbx.addedFiles.filter((f: AddedFile) =>
      /StandBy.*\.swift$/.test(f.filePath),
    );
    expect(standbyAdded.length).toBeGreaterThan(0);
    const iosMods = dangerousModInvocations.filter((i) => i.platform === 'ios');
    expect(iosMods.length).toBeGreaterThanOrEqual(1);
  });

  it('plugin chain is idempotent at the Swift-sources level (no duplicate file refs)', () => {
    const cfg = makeConfig();
    getStandBy()(cfg);
    const firstSnapshot = cfg._pbx.addedFiles
      .filter((f: AddedFile) => /StandBy.*\.swift$/.test(f.filePath))
      .map((f: AddedFile) => f.filePath)
      .toSorted();
    getStandBy()(cfg);
    const secondSnapshot = cfg._pbx.addedFiles
      .filter((f: AddedFile) => /StandBy.*\.swift$/.test(f.filePath))
      .map((f: AddedFile) => f.filePath)
      .toSorted();
    expect(secondSnapshot).toEqual(firstSnapshot);
  });

  it('028 + 027 marker-region invariance via the pure transforms (R-A)', () => {
    const baseline = [
      '@main',
      'struct B: WidgetBundle {',
      '    var body: some Widget {',
      '        ShowcaseWidget()',
      '        // MARK: spot-widgets:bundle:additional-widgets:start',
      '        // MARK: spot-widgets:bundle:additional-widgets:end',
      '    }',
      '}',
      '',
    ].join('\n');
    // 027 then 028: 027 inserts Lock, 028 detects Lock + adds StandBy in canonical order.
    const a = standbyInsertBundleEntry(lockInsertBundleEntry(baseline));
    expect(a).toContain('LockScreenAccessoryWidget()');
    expect(a).toContain('StandByWidget()');
    expect(a.indexOf('LockScreenAccessoryWidget()')).toBeLessThan(a.indexOf('StandByWidget()'));
  });

  it('028 alone produces a deterministic bundle (idempotent over the baseline)', () => {
    const baseline = [
      '@main',
      'struct B: WidgetBundle {',
      '    var body: some Widget {',
      '        ShowcaseWidget()',
      '        // MARK: spot-widgets:bundle:additional-widgets:start',
      '        // MARK: spot-widgets:bundle:additional-widgets:end',
      '    }',
      '}',
      '',
    ].join('\n');
    const once = standbyInsertBundleEntry(baseline);
    const twice = standbyInsertBundleEntry(once);
    expect(twice).toBe(once);
  });

  it('fail-loud propagation: insertBundleEntry throws on missing markers', () => {
    expect(() => standbyInsertBundleEntry('@main\nstruct B {}\n')).toThrow(/with-standby-widget/);
  });

  it('no console.warn on a baseline config', () => {
    const cfg = makeConfig();
    const spy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    getStandBy()(cfg);
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it('plugin package.json declares zero runtime + zero dev dependencies (NFR-SB-003)', () => {
    const pkg = require('../../../../plugins/with-standby-widget/package.json');
    expect(Object.keys(pkg.dependencies ?? {}).length).toBe(0);
    expect(Object.keys(pkg.devDependencies ?? {}).length).toBe(0);
  });

  it('plugin throws if LiveActivityDemoWidget target is missing', () => {
    const config = {
      name: 'spot',
      slug: 'spot',
      ios: { bundleIdentifier: 'com.test.app' },
      _pbx: { addedFiles: [] },
    };
    // Swap the target lookup mock so the target appears missing.
    const cp = require('@expo/config-plugins');
    const realImpl = cp.withXcodeProject.getMockImplementation();
    cp.withXcodeProject.mockImplementationOnce((cfg: any, cb: any) => {
      const project = {
        pbxTargetByName: () => null,
        getFirstProject: () => ({ firstProject: { mainGroup: 'MAIN_GROUP' } }),
        addPbxGroup: () => ({ uuid: 'X' }),
        addToPbxGroup: () => undefined,
        addFile: () => null,
        hasFile: () => false,
        addToPbxSourcesBuildPhase: () => undefined,
      };
      return cb({ ...cfg, modResults: project, modRequest: {} }) ?? cfg;
    });
    expect(() => getStandBy()(config)).toThrow(/LiveActivityDemoWidget.*not found/);
    cp.withXcodeProject.mockImplementation(realImpl);
  });

  it('028 does NOT register a parallel reload symbol (FR-SB-024 cross-cut)', () => {
    // The plugin only emits Swift sources + bundle insertion. There is no
    // reloadStandByTimelines symbol introduced. This is a static check on
    // plugin source as a guard.
    const fs = require('fs');
    const path = require('path');
    const root = path.join(__dirname, '..', '..', '..', '..', 'plugins', 'with-standby-widget');
    for (const file of ['index.ts', 'add-swift-sources.ts', 'insert-bundle-entry.ts']) {
      const src = fs.readFileSync(path.join(root, file), 'utf8');
      expect(src.includes('reloadStandByTimelines')).toBe(false);
    }
  });
});
