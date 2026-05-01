/**
 * with-standby-widget/add-swift-sources.ts
 *
 * Adds the four StandBy WidgetKit Swift sources to 014's existing
 * LiveActivityDemoWidget extension target.
 *
 * Idempotent — skips paths already known to the project.
 *
 * @see specs/028-standby-mode/tasks.md T044, T047
 */

import { ConfigPlugin, withXcodeProject } from '@expo/config-plugins';
import * as path from 'path';

const WIDGET_TARGET_NAME = 'LiveActivityDemoWidget';
const SOURCE_DIR_REL = '../native/ios/widgets/standby';

const STANDBY_FILES: readonly string[] = [
  'StandByWidget.swift',
  'StandByProvider.swift',
  'StandByEntry.swift',
  'StandByViews.swift',
];

export const withStandByWidgetSwiftSources: ConfigPlugin = (config) => {
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

    const widgetTarget = project.pbxTargetByName(WIDGET_TARGET_NAME);
    if (!widgetTarget) {
      throw new Error(
        `with-standby-widget: Widget extension target '${WIDGET_TARGET_NAME}' not found. ` +
          `Ensure with-home-widgets plugin runs before with-standby-widget.`,
      );
    }

    const groupName = 'SpotStandByWidget';
    const standbyGroup = project.addPbxGroup([], groupName, SOURCE_DIR_REL);
    const mainGroupUuid = project.getFirstProject().firstProject.mainGroup;
    project.addToPbxGroup(standbyGroup.uuid, mainGroupUuid);

    for (const fileName of STANDBY_FILES) {
      const filePath = path.posix.join(SOURCE_DIR_REL, fileName);
      if (project.hasFile(filePath)) {
        continue;
      }
      const fileRef = project.addFile(filePath, standbyGroup.uuid, {
        target: widgetTarget.uuid,
        sourceTree: '"<group>"',
      });
      if (fileRef) {
        project.addToPbxSourcesBuildPhase(fileRef, widgetTarget.uuid);
      }
    }

    return cfg;
  });
};
