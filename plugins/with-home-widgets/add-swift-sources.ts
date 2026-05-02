/**
 * with-home-widgets/add-swift-sources.ts
 *
 * Adds the SpotShowcaseWidget Swift sources (and the AppGroupKeys helper)
 * to the existing 007 LiveActivityDemoWidget extension target's compile
 * sources. Idempotent — skips paths already known to the project.
 *
 * @see specs/014-home-widgets/tasks.md T018
 */

import * as _cp from '@expo/config-plugins';
import type { ConfigPlugin } from '@expo/config-plugins';
const configPlugins = (_cp as { default?: typeof _cp }).default ?? _cp;
const { withXcodeProject } = configPlugins;
import * as path from 'path';
import { findTargetByName } from '../_shared/find-target.ts';
import { addSwiftSourceFile } from '../_shared/add-source-file.ts';

const WIDGET_TARGET_NAME = 'LiveActivityDemoWidget';
const SOURCE_DIR_REL = '../native/ios/widgets';

const SHOWCASE_FILES: readonly string[] = [
  'AppGroupKeys.swift',
  'ShowcaseEntry.swift',
  'ShowcaseProvider.swift',
  'ShowcaseWidgetView.swift',
  'ShowcaseWidget.swift',
];

export const withHomeWidgetsSwiftSources: ConfigPlugin = (config) => {
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
    if (!widgetTarget) {
      // Extension target not yet created (with-live-activity not run).
      // Nothing to do — the live-activity plugin will run first in the
      // composed plugin order, so this should only happen during isolated
      // tests; bail out cleanly.
      return cfg;
    }

    // Reuse / create a group for the showcase sources.
    const groupName = 'SpotShowcaseWidget';
    const showcaseGroup = project.addPbxGroup([], groupName, SOURCE_DIR_REL);
    const mainGroupUuid = project.getFirstProject().firstProject.mainGroup;
    project.addToPbxGroup(showcaseGroup.uuid, mainGroupUuid);

    for (const fileName of SHOWCASE_FILES) {
      const filePath = path.posix.join(SOURCE_DIR_REL, fileName);
      if (project.hasFile(filePath)) {
        continue;
      }
      addSwiftSourceFile(project, filePath, showcaseGroup.uuid, {
        target: widgetTarget.uuid,
        sourceTree: 'SOURCE_ROOT',
      });
    }

    return cfg;
  });
};

export default withHomeWidgetsSwiftSources;
