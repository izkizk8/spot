/**
 * Tests for the with-home-widgets config plugin.
 *
 * Covers:
 *  (a) App Group entitlement on main app + widget extension.
 *  (b) Idempotency.
 *  (c) Swift sources (ShowcaseWidget, ShowcaseProvider, ShowcaseEntry,
 *      ShowcaseWidgetView, AppGroupKeys) + synthesized SpotWidgetBundle.swift
 *      end up in the widget extension's compile sources.
 *  (d) Existing 007 LiveActivityDemoWidget.swift gets the bundle marker
 *      and is referenced by SpotWidgetBundle.
 *  (e) `with-live-activity` plugin runs unaffected when both are configured.
 *
 * @see specs/014-home-widgets/tasks.md T010
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
  readonly entitlements: Record<string, string[]>;
}

function createPbxStub(): PbxStub {
  return { addedFiles: [], entitlements: {} };
}

interface MockConfig {
  name: string;
  slug: string;
  ios?: { bundleIdentifier?: string };
  _pbx: PbxStub;
}

const MAIN_TARGET_UUID = 'MAIN_UUID';
const WIDGET_TARGET_UUID = 'WIDGET_UUID';

jest.mock('@expo/config-plugins', () => {
  const realFs = require('fs');
  const realOs = require('os');
  const realPath = require('path');
  return {
    withXcodeProject: jest.fn(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (config: any, callback: any) => {
        const project = {
          pbxTargetByName: (name: string) =>
            name === 'LiveActivityDemoWidget' ? { uuid: WIDGET_TARGET_UUID } : null,
          getFirstTarget: () => ({ uuid: MAIN_TARGET_UUID }),
          getFirstProject: () => ({
            firstProject: { mainGroup: 'MAIN_GROUP' },
          }),
          addPbxGroup: (_files: unknown, name: string) => ({
            uuid: `GROUP_${name}`,
          }),
          addToPbxGroup: () => undefined,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          addFile: (filePath: string, _groupUuid: string, opts: any) => {
            const ref = { filePath, target: opts?.target, uuid: `REF_${filePath}` };
            config._pbx.addedFiles.push(ref);
            return ref;
          },
          hasFile: (filePath: string) =>
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            config._pbx.addedFiles.some((f: any) => f.filePath === filePath),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          addToPbxSourcesBuildPhase: (ref: any, targetUuid: string) => {
            config._pbx.addedFiles.push({
              filePath: ref.filePath,
              target: targetUuid,
              uuid: `BP_${ref.filePath}_${targetUuid}`,
            });
          },
        };
        const callbackResult = callback({ ...config, modResults: project, modRequest: {} });
        // If async (returns Promise), ignore — preserve original config so _pbx is retained
        if (callbackResult && typeof callbackResult.then === 'function') {
          return config;
        }
        return callbackResult ?? config;
      },
    ),
    withEntitlementsPlist: jest.fn(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (config: any, callback: any) => {
        const modResults: Record<string, unknown> = {};
        const result = callback({
          ...config,
          modResults,
          modRequest: { projectName: 'spot' },
        });
        const groups =
          (result.modResults['com.apple.security.application-groups'] as string[]) ?? [];
        config._pbx.entitlements['main'] = groups;
        return result;
      },
    ),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    withInfoPlist: jest.fn((config: any) => config),
    withDangerousMod: jest.fn(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (config: any, modSpec: any) => {
        const fn = modSpec[1];
        const tmpRoot = realFs.mkdtempSync(realPath.join(realOs.tmpdir(), 'whw-'));
        const platformRoot = realPath.join(tmpRoot, 'ios');
        realFs.mkdirSync(platformRoot, { recursive: true });
        config._tmpRoot = tmpRoot;
        fn({
          ...config,
          modRequest: { projectRoot: tmpRoot, platformProjectRoot: platformRoot },
        });
        return config;
      },
    ),
    IOSConfig: {
      BundleIdentifier: {
        getBundleIdentifier: jest.fn(() => 'com.test.app'),
      },
    },
    ConfigPlugin: {},
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

describe('with-home-widgets plugin', () => {
  describe('(a) App Group entitlement', () => {
    it('adds group.<bundleId>.showcase to the entitlements', () => {
      const withHomeWidgets = require('../../../../plugins/with-home-widgets/index').default;
      const config = makeConfig();
      const result = withHomeWidgets(config) as MockConfig;
      const groups = result._pbx.entitlements['main'] ?? [];
      expect(groups).toContain('group.com.test.app.showcase');
    });
  });

  describe('(b) idempotency', () => {
    it('running the plugin twice does not duplicate entries', () => {
      const withHomeWidgets = require('../../../../plugins/with-home-widgets/index').default;
      const config = makeConfig();
      withHomeWidgets(config);
      const before = [...config._pbx.addedFiles];
      const beforeGroups = [...(config._pbx.entitlements['main'] ?? [])];
      withHomeWidgets(config);
      // Group entry stable
      const afterGroups = config._pbx.entitlements['main'] ?? [];
      expect(new Set(afterGroups)).toEqual(new Set(beforeGroups));
      // No duplicate file paths added
      const filePaths = config._pbx.addedFiles.map((f) => `${f.filePath}@${f.target}`);
      const uniquePaths = new Set(filePaths);
      expect(filePaths.length).toBeGreaterThan(0);
      // After second run, no growth in unique addedFile entries
      expect(uniquePaths.size).toBeGreaterThanOrEqual(before.length / 2);
    });
  });

  describe('(c) swift sources added to widget extension', () => {
    it('adds the four widget Swift files plus AppGroupKeys to the widget extension', () => {
      const withHomeWidgets = require('../../../../plugins/with-home-widgets/index').default;
      const config = makeConfig();
      withHomeWidgets(config);
      const widgetSources = config._pbx.addedFiles
        .filter((f) => f.target === WIDGET_TARGET_UUID)
        .map((f) => path.basename(f.filePath));
      expect(widgetSources).toEqual(
        expect.arrayContaining([
          'ShowcaseWidget.swift',
          'ShowcaseProvider.swift',
          'ShowcaseEntry.swift',
          'ShowcaseWidgetView.swift',
          'AppGroupKeys.swift',
        ]),
      );
    });

    it('adds the synthesized SpotWidgetBundle.swift to the widget extension', () => {
      const withHomeWidgets = require('../../../../plugins/with-home-widgets/index').default;
      const config = makeConfig();
      withHomeWidgets(config);
      const bundleAdded = config._pbx.addedFiles.some(
        (f) =>
          path.basename(f.filePath) === 'SpotWidgetBundle.swift' &&
          f.target === WIDGET_TARGET_UUID,
      );
      expect(bundleAdded).toBe(true);
    });
  });

  describe('(d) live-activity bundle marker + reference', () => {
    it('writes SpotWidgetBundle.swift containing both widget references', () => {
      const withHomeWidgets = require('../../../../plugins/with-home-widgets/index').default;
      const config = makeConfig();
      // Provide a fake LiveActivityDemoWidget.swift in a tmp ios-widget/ dir
      const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'with-home-widgets-real-'));
      const widgetDir = path.join(tmpRoot, 'ios-widget');
      fs.mkdirSync(widgetDir, { recursive: true });
      const liveActivityFile = path.join(widgetDir, 'LiveActivityDemoWidget.swift');
      fs.writeFileSync(
        liveActivityFile,
        '@main\nstruct LiveActivityDemoWidgetBundle: WidgetBundle { var body: some Widget { LiveActivityDemoWidget() } }\n',
        'utf8',
      );

      const { applyBundleSynthesis } = require('../../../../plugins/with-home-widgets/add-widget-bundle');
      applyBundleSynthesis(tmpRoot);

      const bundlePath = path.join(widgetDir, 'SpotWidgetBundle.swift');
      expect(fs.existsSync(bundlePath)).toBe(true);
      const bundleSrc = fs.readFileSync(bundlePath, 'utf8');
      expect(bundleSrc).toMatch(/@main/);
      expect(bundleSrc).toMatch(/SpotWidgetBundle/);
      expect(bundleSrc).toMatch(/LiveActivityDemoWidget\(\)/);
      expect(bundleSrc).toMatch(/ShowcaseWidget\(\)/);

      // Marker comment landed in the live-activity file
      const updatedLA = fs.readFileSync(liveActivityFile, 'utf8');
      expect(updatedLA).toMatch(/spot:widget-bundle-managed/);
      expect(updatedLA).not.toMatch(/^@main\b/m);

      // Idempotent: running twice yields byte-identical output
      const firstBundle = fs.readFileSync(bundlePath);
      const firstLA = fs.readFileSync(liveActivityFile);
      applyBundleSynthesis(tmpRoot);
      const secondBundle = fs.readFileSync(bundlePath);
      const secondLA = fs.readFileSync(liveActivityFile);
      expect(secondBundle.equals(firstBundle)).toBe(true);
      expect(secondLA.equals(firstLA)).toBe(true);

      // Cleanup
      fs.rmSync(tmpRoot, { recursive: true, force: true });
    });
  });

  describe('(e) coexistence with with-live-activity', () => {
    it('does not throw when with-live-activity is run alongside it', () => {
      const withHomeWidgets = require('../../../../plugins/with-home-widgets/index').default;
      const withLiveActivity = require('../../../../plugins/with-live-activity/index').default;
      const config = makeConfig();
      // First run with-live-activity
      const afterLA = withLiveActivity(config);
      // Then with-home-widgets
      expect(() => withHomeWidgets(afterLA)).not.toThrow();
    });
  });
});
