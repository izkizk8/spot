/**
 * @file T008 — Tests for the with-screentime config plugin.
 *
 * Asserts:
 *   (a) Adds `com.apple.developer.family-controls` entitlement to the
 *       main iOS target.
 *   (b) Adds a `SpotScreenTimeMonitor` `DeviceActivityMonitorExtension`
 *       target with bundle-ID suffix `.screentimemonitor`.
 *   (c) Coexists with feature 007's `LiveActivityDemoWidget` target and
 *       feature 014's widget target without colliding.
 *   (d) Reads (does NOT modify) feature 014's App Group bundle marker
 *       (`native/ios/widgets/AppGroupKeys.swift`) and attaches the same
 *       App Group entitlement to the new monitor extension only.
 *   (e) Idempotent: a second run produces the same result.
 *   (f) Gracefully handles a missing marker (warns + continues).
 *
 * @see specs/015-screentime-api/tasks.md T008
 */

import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

interface AddedFile {
  readonly filePath: string;
  readonly target: string | undefined;
}

interface PbxStub {
  readonly addedFiles: AddedFile[];
  readonly targetsAdded: { uuid: string; name: string; bundleId: string }[];
  readonly entitlements: Record<string, Record<string, unknown>>;
}

const MAIN_TARGET_UUID = 'MAIN_UUID';
const LIVE_ACTIVITY_UUID = 'LA_UUID';
const HOME_WIDGET_UUID = 'HW_UUID';

interface MockConfig {
  name: string;
  slug: string;
  ios?: { bundleIdentifier?: string };
  _pbx: PbxStub;
  _projectRoot?: string;
}

function createPbxStub(): PbxStub {
  return {
    addedFiles: [],
    targetsAdded: [
      {
        uuid: LIVE_ACTIVITY_UUID,
        name: 'LiveActivityDemoWidget',
        bundleId: 'com.test.app.LiveActivityDemoWidget',
      },
      { uuid: HOME_WIDGET_UUID, name: 'HomeWidget', bundleId: 'com.test.app.HomeWidget' },
    ],
    entitlements: {},
  };
}

let mockConfig: MockConfig | null = null;
void mockConfig;

jest.mock('@expo/config-plugins', () => {
  const realFs = require('fs');
  const realOs = require('os');
  const realPath = require('path');
  return {
    withXcodeProject: jest.fn((config: any, callback: any) => {
      const project = {
        pbxTargetByName: (name: string) => {
          const t = config._pbx.targetsAdded.find((x: any) => x.name === name);
          return t ? { uuid: t.uuid } : null;
        },
        getFirstTarget: () => ({ uuid: MAIN_TARGET_UUID }),
        addTarget: (name: string, _type: string, _subfolder: string, bundleId: string) => {
          const uuid = `T_${name}`;
          config._pbx.targetsAdded.push({ uuid, name, bundleId });
          return { uuid };
        },
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
      const result = callback({ ...config, modResults: project, modRequest: {} });
      return result ?? config;
    }),
    withEntitlementsPlist: jest.fn((config: any, callback: any) => {
      const modResults: Record<string, unknown> = config._pbx.entitlements['main'] ?? {};
      const result = callback({
        ...config,
        modResults,
        modRequest: { projectName: 'spot' },
      });
      config._pbx.entitlements['main'] = result.modResults as Record<string, unknown>;
      return result;
    }),
    withDangerousMod: jest.fn((config: any, modSpec: any) => {
      const fn = modSpec[1];
      const projectRoot =
        config._projectRoot ?? realFs.mkdtempSync(realPath.join(realOs.tmpdir(), 'wst-'));
      config._projectRoot = projectRoot;
      fn({
        ...config,
        modRequest: { projectRoot, platformProjectRoot: realPath.join(projectRoot, 'ios') },
      });
      return config;
    }),
    IOSConfig: {
      BundleIdentifier: {
        getBundleIdentifier: jest.fn(() => 'com.test.app'),
      },
    },
  };
});

function makeConfig(): MockConfig {
  return {
    name: 'spot',
    slug: 'spot',
    ios: { bundleIdentifier: 'com.test.app' },
    _pbx: createPbxStub(),
  };
}

function plantMarker(projectRoot: string): void {
  const dir = path.join(projectRoot, 'native', 'ios', 'widgets');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'AppGroupKeys.swift'), '// marker', 'utf8');
}

function withTempRoot<T>(fn: (root: string) => T): T {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'with-screentime-test-'));
  try {
    return fn(tmp);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

function uniqueFiles(a: { filePath: string; target: string | undefined }[]): Set<string> {
  return new Set(a.map((x) => `${x.filePath}@${x.target ?? ''}`));
}

describe('with-screentime plugin', () => {
  beforeEach(() => {
    mockConfig = null;
  });

  describe('(a) FamilyControls entitlement', () => {
    it('adds com.apple.developer.family-controls = true to main entitlements', () => {
      const withScreenTime = require('../../../../plugins/with-screentime/index').default;
      const config = makeConfig();
      withTempRoot((root) => {
        config._projectRoot = root;
        plantMarker(root);
        withScreenTime(config);
      });
      expect(config._pbx.entitlements['main']?.['com.apple.developer.family-controls']).toBe(true);
    });
  });

  describe('(b) DeviceActivityMonitor extension target', () => {
    it('adds a SpotScreenTimeMonitor target with .screentimemonitor bundle-ID suffix', () => {
      const withScreenTime = require('../../../../plugins/with-screentime/index').default;
      const config = makeConfig();
      withTempRoot((root) => {
        config._projectRoot = root;
        plantMarker(root);
        withScreenTime(config);
      });
      const monitor = config._pbx.targetsAdded.find((t) => t.name === 'SpotScreenTimeMonitor');
      expect(monitor).toBeDefined();
      expect(monitor!.bundleId).toBe('com.test.app.screentimemonitor');
    });

    it('attaches DeviceActivityMonitorExtension.swift to the monitor target', () => {
      const withScreenTime = require('../../../../plugins/with-screentime/index').default;
      const config = makeConfig();
      withTempRoot((root) => {
        config._projectRoot = root;
        plantMarker(root);
        withScreenTime(config);
      });
      const monitor = config._pbx.targetsAdded.find((t) => t.name === 'SpotScreenTimeMonitor');
      expect(monitor).toBeDefined();
      const monitorSources = config._pbx.addedFiles.filter((f) => f.target === monitor!.uuid);
      const names = monitorSources.map((f) => path.basename(f.filePath));
      expect(names).toEqual(expect.arrayContaining(['DeviceActivityMonitorExtension.swift']));
    });
  });

  describe('(c) coexistence with feature 007 + 014 widget targets', () => {
    it('does not modify the LiveActivityDemoWidget target list entry', () => {
      const withScreenTime = require('../../../../plugins/with-screentime/index').default;
      const config = makeConfig();
      const beforeLA = config._pbx.targetsAdded.find((t) => t.name === 'LiveActivityDemoWidget');
      withTempRoot((root) => {
        config._projectRoot = root;
        plantMarker(root);
        withScreenTime(config);
      });
      const afterLA = config._pbx.targetsAdded.find((t) => t.name === 'LiveActivityDemoWidget');
      expect(afterLA).toEqual(beforeLA);
    });

    it('does not attach any files to the existing widget targets', () => {
      const withScreenTime = require('../../../../plugins/with-screentime/index').default;
      const config = makeConfig();
      withTempRoot((root) => {
        config._projectRoot = root;
        plantMarker(root);
        withScreenTime(config);
      });
      const haystack = config._pbx.addedFiles.filter(
        (f) => f.target === LIVE_ACTIVITY_UUID || f.target === HOME_WIDGET_UUID,
      );
      expect(haystack).toHaveLength(0);
    });

    it('does not collide with .LiveActivityDemoWidget or .HomeWidget bundle IDs', () => {
      const withScreenTime = require('../../../../plugins/with-screentime/index').default;
      const config = makeConfig();
      withTempRoot((root) => {
        config._projectRoot = root;
        plantMarker(root);
        withScreenTime(config);
      });
      const monitor = config._pbx.targetsAdded.find((t) => t.name === 'SpotScreenTimeMonitor')!;
      expect(monitor.bundleId).not.toBe('com.test.app.LiveActivityDemoWidget');
      expect(monitor.bundleId).not.toBe('com.test.app.HomeWidget');
    });
  });

  describe('(d) feature 014 App Group consumption', () => {
    it('detects the marker file and writes the monitor entitlements with the same suite', () => {
      const withScreenTime = require('../../../../plugins/with-screentime/index').default;
      const config = makeConfig();
      let entFile: string | null = null;
      withTempRoot((root) => {
        config._projectRoot = root;
        plantMarker(root);
        withScreenTime(config);
        entFile = path.join(
          root,
          'native',
          'ios',
          'screentime',
          'SpotScreenTimeMonitor.entitlements',
        );
        const text = fs.readFileSync(entFile, 'utf8');
        expect(text).toMatch(/group\.com\.test\.app\.showcase/);
        expect(text).toMatch(/com\.apple\.security\.application-groups/);
      });
    });

    it('does not modify the marker file or any feature 014 file', () => {
      const withScreenTime = require('../../../../plugins/with-screentime/index').default;
      const config = makeConfig();
      withTempRoot((root) => {
        config._projectRoot = root;
        plantMarker(root);
        const markerPath = path.join(root, 'native', 'ios', 'widgets', 'AppGroupKeys.swift');
        const before = fs.readFileSync(markerPath, 'utf8');
        withScreenTime(config);
        const after = fs.readFileSync(markerPath, 'utf8');
        expect(after).toBe(before);
      });
    });
  });

  describe('(e) idempotency', () => {
    it('running the plugin twice produces deep-equal targets and files', () => {
      const withScreenTime = require('../../../../plugins/with-screentime/index').default;
      const config = makeConfig();
      withTempRoot((root) => {
        config._projectRoot = root;
        plantMarker(root);
        withScreenTime(config);
        const targetsAfterFirst = config._pbx.targetsAdded.map((t) => ({ ...t }));
        const filesAfterFirst = config._pbx.addedFiles.map((f) => ({ ...f }));
        withScreenTime(config);
        expect(config._pbx.targetsAdded).toEqual(targetsAfterFirst);
        // The build-phase entries dedupe on filePath + target tuple — make
        // sure the unique set is unchanged.
        expect(uniqueFiles(config._pbx.addedFiles)).toEqual(uniqueFiles(filesAfterFirst));
      });
    });
  });

  describe('(f) graceful handling of missing marker', () => {
    it('does not throw and does not write the monitor entitlements file when the marker is absent', () => {
      const withScreenTime = require('../../../../plugins/with-screentime/index').default;
      const config = makeConfig();
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      withTempRoot((root) => {
        config._projectRoot = root;
        // No plantMarker(root)
        expect(() => withScreenTime(config)).not.toThrow();
        const entFile = path.join(
          root,
          'native',
          'ios',
          'screentime',
          'SpotScreenTimeMonitor.entitlements',
        );
        expect(fs.existsSync(entFile)).toBe(false);
      });
      expect(warnSpy).toHaveBeenCalled();
      warnSpy.mockRestore();
    });
  });
});
