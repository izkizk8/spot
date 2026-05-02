/**
 * Config plugin to add the LiveActivityDemoWidget extension target to
 * the iOS Xcode project.
 *
 * MUST be idempotent — running twice MUST NOT duplicate targets or file refs.
 *
 * @see specs/007-live-activities-dynamic-island/tasks.md T010
 */

import * as _cp from '@expo/config-plugins';
import type { ConfigPlugin } from '@expo/config-plugins';
const configPlugins = (_cp as { default?: typeof _cp }).default ?? _cp;
const { withXcodeProject, IOSConfig } = configPlugins;
import * as path from 'path';
import * as fs from 'fs';
import { findTargetByName } from '../_shared/find-target.ts';
import { addSwiftSourceFile } from '../_shared/add-source-file.ts';

const WIDGET_TARGET_NAME = 'LiveActivityDemoWidget';
const WIDGET_BUNDLE_ID_SUFFIX = '.LiveActivityDemoWidget';
const IOS_WIDGET_SRC_DIR = 'ios-widget';

// Files for the Widget Extension target
const WIDGET_FILES = ['LiveActivityDemoWidget.swift', 'Info.plist'];

// Files shared between main app and widget extension (referenced by both)
const SHARED_FILES = ['LiveActivityDemoAttributes.swift'];

// Files only in the main app target (the Expo native module)
const MAIN_APP_FILES = ['LiveActivityDemoModule.swift'];

/**
 * Adds the Widget Extension target to the Xcode project.
 */
export const withLiveActivityWidgetExtension: ConfigPlugin = (config) => {
  return withXcodeProject(config, async (cfg) => {
    const project = cfg.modResults;
    const projectRoot = cfg.modRequest.projectRoot;
    const appName = cfg.modRequest.projectName ?? 'spot';
    const mainBundleId =
      IOSConfig.BundleIdentifier.getBundleIdentifier(cfg) ?? `com.example.${appName}`;

    // Check if target already exists (idempotency).
    // Use findTargetByName instead of pbxTargetByName: the xcode npm package
    // stores added-target names with surrounding quotes, which pbxTargetByName
    // cannot match (see plugins/_shared/find-target.ts).
    const existingTarget = findTargetByName(project, WIDGET_TARGET_NAME);
    if (existingTarget) {
      // Target already exists, nothing to do
      return cfg;
    }

    const widgetBundleId = `${mainBundleId}${WIDGET_BUNDLE_ID_SUFFIX}`;
    const widgetSrcPath = path.join(projectRoot, IOS_WIDGET_SRC_DIR);

    // Verify source files exist
    const allFiles = [...WIDGET_FILES, ...SHARED_FILES, ...MAIN_APP_FILES];
    for (const file of allFiles) {
      const filePath = path.join(widgetSrcPath, file);
      if (!fs.existsSync(filePath)) {
        throw new Error(`Missing required file: ${filePath}`);
      }
    }

    // Add Widget Extension target
    const widgetTarget = project.addTarget(
      WIDGET_TARGET_NAME,
      'app_extension',
      WIDGET_TARGET_NAME,
      widgetBundleId,
    );

    // Get the target's native target object for adding build phases
    const _widgetNativeTarget = project.pbxNativeTargetSection()[widgetTarget.uuid];

    // Create a group for the widget files
    const widgetGroupName = WIDGET_TARGET_NAME;
    const widgetGroup = project.addPbxGroup([], widgetGroupName, `../${IOS_WIDGET_SRC_DIR}`);

    // Get the main group to add the widget group to
    const mainGroupUuid = project.getFirstProject().firstProject.mainGroup;
    project.addToPbxGroup(widgetGroup.uuid, mainGroupUuid);

    // Add source files to the widget target
    const _widgetSourcesBuildPhase = project.addBuildPhase(
      [],
      'PBXSourcesBuildPhase',
      'Sources',
      widgetTarget.uuid,
    );

    // Add widget-specific Swift files
    for (const file of WIDGET_FILES.filter((f) => f.endsWith('.swift'))) {
      const filePath = path.join(`../${IOS_WIDGET_SRC_DIR}`, file);
      addSwiftSourceFile(project, filePath, widgetGroup.uuid, {
        target: widgetTarget.uuid,
        sourceTree: 'SOURCE_ROOT',
      });
    }

    // Add shared files to widget target
    for (const file of SHARED_FILES) {
      const filePath = path.join(`../${IOS_WIDGET_SRC_DIR}`, file);
      addSwiftSourceFile(project, filePath, widgetGroup.uuid, {
        target: widgetTarget.uuid,
        sourceTree: 'SOURCE_ROOT',
      });
    }

    // Add shared files to main app target's compile sources
    const mainTarget = project.getFirstTarget();
    if (mainTarget) {
      for (const file of SHARED_FILES) {
        const filePath = path.join(`../${IOS_WIDGET_SRC_DIR}`, file);
        // Check if file already added to main target
        const existingFile = project.hasFile(filePath);
        if (!existingFile) {
          addSwiftSourceFile(project, filePath, widgetGroup.uuid, {
            sourceTree: 'SOURCE_ROOT',
            target: mainTarget.uuid,
          });
        }
      }

      // Add the Expo native module file to main app target only
      for (const file of MAIN_APP_FILES) {
        const filePath = path.join(`../${IOS_WIDGET_SRC_DIR}`, file);
        const existingFile = project.hasFile(filePath);
        if (!existingFile) {
          addSwiftSourceFile(project, filePath, widgetGroup.uuid, {
            sourceTree: 'SOURCE_ROOT',
            target: mainTarget.uuid,
          });
        }
      }
    }

    // Add the Info.plist to the widget target (not as source, just reference)
    const infoPlistPath = path.join(`../${IOS_WIDGET_SRC_DIR}`, 'Info.plist');
    project.addFile(infoPlistPath, widgetGroup.uuid, {
      sourceTree: 'SOURCE_ROOT',
    });

    // Set build settings for the widget target
    const widgetBuildConfigs = project.pbxXCBuildConfigurationSection();
    for (const key of Object.keys(widgetBuildConfigs)) {
      const buildConfig = widgetBuildConfigs[key];
      if (buildConfig && typeof buildConfig === 'object' && 'buildSettings' in buildConfig) {
        const buildSettings = buildConfig.buildSettings;
        if (buildSettings && buildSettings.PRODUCT_NAME === `"${WIDGET_TARGET_NAME}"`) {
          buildSettings.INFOPLIST_FILE = `"../${IOS_WIDGET_SRC_DIR}/Info.plist"`;
          buildSettings.CODE_SIGN_STYLE = '"Automatic"';
          buildSettings.PRODUCT_BUNDLE_IDENTIFIER = `"${widgetBundleId}"`;
          buildSettings.SWIFT_VERSION = '"5.0"';
          buildSettings.TARGETED_DEVICE_FAMILY = '"1,2"';
          buildSettings.IPHONEOS_DEPLOYMENT_TARGET = '"16.1"';
          buildSettings.GENERATE_INFOPLIST_FILE = 'NO';
          buildSettings.CURRENT_PROJECT_VERSION = '"1"';
          buildSettings.MARKETING_VERSION = '"1.0"';
          buildSettings.SKIP_INSTALL = 'YES';
        }
      }
    }

    // NOTE: We intentionally do NOT call `project.addBuildPhase(...,
    // 'PBXCopyFilesBuildPhase', 'Embed App Extensions', ...)` here.
    //
    // `project.addTarget(name, 'app_extension', ...)` already creates a
    // `PBXCopyFilesBuildPhase` (with `dstSubfolderSpec = 13`, the
    // `app_extensions` folder) on the first/main target and pushes the
    // widget's productFile into it (xcode npm pbxProject.js: addTarget
    // → addBuildPhase('Copy Files') → addToPbxCopyfilesBuildPhase).
    //
    // Functionally this IS the "Embed App Extensions" phase Xcode shows in
    // the UI — `dstSubfolderSpec = 13` is what makes it embed extensions.
    // Adding a second phase here would put the same PBXBuildFile into two
    // PBXBuildPhases, which CocoaPods' xcodeproj gem rejects with:
    //   [Xcodeproj] Consistency issue: no parent for object
    //   `<name>.appex`: `Copy Files`, `Embed App Extensions`

    // Add target dependency from main app to widget. addTarget also calls
    // this internally, but only if PBXTargetDependency / PBXContainerItemProxy
    // sections already exist in the pbxproj. In a fresh Expo prebuild they
    // typically don't, so we re-call here to make sure the dependency is
    // recorded once those sections appear later in the mod chain. The xcode
    // npm helper bails out cleanly when sections are missing.
    if (mainTarget) {
      project.addTargetDependency(mainTarget.uuid, [widgetTarget.uuid]);
    }

    return cfg;
  });
};

export default withLiveActivityWidgetExtension;
