/**
 * with-home-widgets/add-widget-bundle.ts
 *
 * Promotes the existing 007 widget extension into a `WidgetBundle` that
 * hosts BOTH `LiveActivityDemoWidget` and the new `ShowcaseWidget`.
 *
 * Steps (all idempotent):
 *   1. In `ios-widget/LiveActivityDemoWidget.swift`, replace any `@main`
 *      attribute with the marker comment `// @main // spot:widget-bundle-managed`.
 *      Also drop the original `LiveActivityDemoWidgetBundle` struct that
 *      previously held @main (no longer needed; SpotWidgetBundle replaces it).
 *   2. Write `ios-widget/SpotWidgetBundle.swift` containing:
 *        @main struct SpotWidgetBundle: WidgetBundle {
 *          var body: some Widget { LiveActivityDemoWidget(); ShowcaseWidget() }
 *        }
 *   3. Add `SpotWidgetBundle.swift` to the widget extension target's
 *      compile sources (via withXcodeProject mod).
 *
 * Both filesystem mutation and Xcode project mutation are idempotent.
 *
 * NOTE: This is the ONE permitted edit to feature 007 files, performed via
 * the marker-comment technique. Removing this plugin and re-adding `@main`
 * + SpotWidgetBundle.swift restores 007's original behaviour.
 *
 * @see specs/014-home-widgets/tasks.md T019
 */

import * as _cp from '@expo/config-plugins';
import type { ConfigPlugin } from '@expo/config-plugins';
const configPlugins = (_cp as { default?: typeof _cp }).default ?? _cp;
const { withDangerousMod, withXcodeProject } = configPlugins;
import * as fs from 'fs';
import * as path from 'path';
import { findTargetByName } from '../_shared/find-target.ts';

const WIDGET_TARGET_NAME = 'LiveActivityDemoWidget';
const IOS_WIDGET_DIR = 'ios-widget';
const LIVE_ACTIVITY_FILE = 'LiveActivityDemoWidget.swift';
const BUNDLE_FILE = 'SpotWidgetBundle.swift';
const BUNDLE_REL = `../${IOS_WIDGET_DIR}/${BUNDLE_FILE}`;

const MARKER = '// @main // spot:widget-bundle-managed';

const BUNDLE_SOURCE = `// SpotWidgetBundle.swift
// Synthesised by plugins/with-home-widgets/add-widget-bundle.ts.
// Do not edit by hand — re-running expo prebuild rewrites this file.

import SwiftUI
import WidgetKit

@available(iOS 16.1, *)
@main
struct SpotWidgetBundle: WidgetBundle {
    var body: some Widget {
        LiveActivityDemoWidget()
        if #available(iOS 14.0, *) {
            ShowcaseWidget()
        }
        // MARK: spot-widgets:bundle:additional-widgets:start
        // MARK: spot-widgets:bundle:additional-widgets:end
    }
}
`;

/**
 * Pure filesystem mutation — exposed for unit tests so they can verify
 * idempotency without invoking the full ConfigPlugin pipeline.
 *
 * @param projectRoot The Expo project root (the directory containing
 *                    `ios-widget/`).
 */
export function applyBundleSynthesis(projectRoot: string): void {
  const widgetDir = path.join(projectRoot, IOS_WIDGET_DIR);
  if (!fs.existsSync(widgetDir)) {
    fs.mkdirSync(widgetDir, { recursive: true });
  }

  // Step 1: rewrite LiveActivityDemoWidget.swift to strip @main.
  const liveActivityPath = path.join(widgetDir, LIVE_ACTIVITY_FILE);
  if (fs.existsSync(liveActivityPath)) {
    const original = fs.readFileSync(liveActivityPath, 'utf8');
    let updated = original;

    // Replace any leading @main line with the marker comment.
    // Match `@main` at the start of a line (allowing trailing whitespace).
    updated = updated.replace(/^@main\s*$/m, MARKER);

    // Strip the now-orphaned LiveActivityDemoWidgetBundle struct (and its
    // surrounding @available attribute) if present. The struct is multi-line
    // but always matches a fixed shape from feature 007.
    updated = updated.replace(
      /\n*\/\/\/[^\n]*?Bundle entry point[^\n]*\n@available\([^)]+\)\n(?:\/\/ @main \/\/ spot:widget-bundle-managed\n)?struct LiveActivityDemoWidgetBundle: WidgetBundle \{[\s\S]*?\n\}\n?/,
      '\n',
    );

    if (updated !== original) {
      fs.writeFileSync(liveActivityPath, updated, 'utf8');
    }
  }

  // Step 2: write SpotWidgetBundle.swift (idempotent — same bytes every run).
  const bundlePath = path.join(widgetDir, BUNDLE_FILE);
  const existing = fs.existsSync(bundlePath) ? fs.readFileSync(bundlePath, 'utf8') : null;
  if (existing !== BUNDLE_SOURCE) {
    fs.writeFileSync(bundlePath, BUNDLE_SOURCE, 'utf8');
  }
}

const withFsMutation: ConfigPlugin = (config) => {
  return withDangerousMod(config, [
    'ios',
    (cfg) => {
      applyBundleSynthesis(cfg.modRequest.projectRoot);
      return cfg;
    },
  ]);
};

const withBundleInXcode: ConfigPlugin = (config) => {
  return withXcodeProject(config, (cfg) => {
    const project = cfg.modResults as unknown as {
      pbxTargetByName: (name: string) => { uuid: string } | null;
      addPbxGroup: (files: unknown[], name: string, path: string) => { uuid: string };
      addToPbxGroup: (childUuid: string, parentUuid: string) => void;
      addFile: (
        filePath: string,
        groupUuid: string,
        opts: { target?: string; sourceTree?: string },
      ) => { uuid: string; filePath: string } | null;
      hasFile: (filePath: string) => unknown;
      addToPbxSourcesBuildPhase: (
        ref: { uuid: string; filePath: string },
        targetUuid: string,
      ) => void;
      getFirstProject: () => { firstProject: { mainGroup: string } };
    };

    const widgetTarget = findTargetByName(project, WIDGET_TARGET_NAME);
    if (!widgetTarget) return cfg;
    if (project.hasFile(BUNDLE_REL)) return cfg;

    const groupName = 'SpotWidgetBundle';
    const bundleGroup = project.addPbxGroup([], groupName, `../${IOS_WIDGET_DIR}`);
    const mainGroupUuid = project.getFirstProject().firstProject.mainGroup;
    project.addToPbxGroup(bundleGroup.uuid, mainGroupUuid);

    const fileRef = project.addFile(BUNDLE_REL, bundleGroup.uuid, {
      target: widgetTarget.uuid,
      sourceTree: 'SOURCE_ROOT',
    });
    if (fileRef) {
      project.addToPbxSourcesBuildPhase(fileRef, widgetTarget.uuid);
    }
    return cfg;
  });
};

export const withHomeWidgetsBundle: ConfigPlugin = (config) => {
  config = withFsMutation(config);
  config = withBundleInXcode(config);
  return config;
};

export default withHomeWidgetsBundle;
