/**
 * Shared helper: add a Swift/Objective-C source file to a target's compile
 * sources, registering all three pbx sections correctly.
 *
 * Why this exists:
 *   The xcode npm package exposes two related APIs:
 *     - `addFile(path, group, opts)` -- creates a PBXFileReference (sets
 *       `file.fileRef`) and adds it to a PBXGroup, but does NOT create the
 *       PBXBuildFile entry and does NOT set `file.uuid`.
 *     - `addSourceFile(path, opts, group)` -- internally calls `addFile`,
 *       then sets `file.uuid = generateUuid()`, registers the PBXBuildFile,
 *       and pushes onto the target's PBXSourcesBuildPhase.
 *
 *   The widget/extension plugins were calling `addFile` followed by
 *   `addToPbxSourcesBuildPhase(file, target.uuid)` directly. Because
 *   `file.uuid` is undefined after `addFile`, the entries pushed into the
 *   sources phase had `value: undefined`. CocoaPods' `xcodeproj` Ruby gem
 *   warns and discards these on save: `<PBXSourcesBuildPhase
 *   UUID=13B07F871A680F5B00A75B9A> attempted to initialize an object with
 *   an unknown UUID. undefined for attribute: files.` 24+ warnings caused
 *   the post-install hook (`fix_library_search_paths`) to fail.
 *
 *   This helper prefers `addSourceFile` (correct on real xcode projects).
 *   For unit-test stubs that only mock `addFile` + `addToPbxSourcesBuildPhase`,
 *   we fall back to that pair so existing tests continue to pass.
 */

interface XcodeFileLike {
  fileRef?: string;
  uuid?: string;
  target?: string;
  path?: string;
  [key: string]: unknown;
}

// Loose project shape -- callers each have their own narrower PbxProject
// interface, so we accept any object and probe at runtime.
type XcodeProjectLike = object;

interface AddSourceFileOpts {
  sourceTree: string;
  target: string;
}

type AddSourceFileFn = (
  path: string,
  opts: { sourceTree?: string; target?: string },
  group?: string,
) => XcodeFileLike | false | null;

type AddFileFn = (
  path: string,
  group: string | undefined,
  opts: { sourceTree?: string; target?: string },
) => XcodeFileLike | false | null;

type AddToPbxSourcesBuildPhaseFn = (file: XcodeFileLike, targetUuid?: string) => void;

export function addSwiftSourceFile(
  project: XcodeProjectLike,
  filePath: string,
  groupUuid: string | undefined,
  opts: AddSourceFileOpts,
): XcodeFileLike | null {
  const addSourceFile = (project as { addSourceFile?: AddSourceFileFn }).addSourceFile;
  // Preferred path: real xcode npm package -- registers PBXFileReference,
  // PBXBuildFile, and PBXSourcesBuildPhase entries with matching UUIDs.
  if (typeof addSourceFile === 'function') {
    const file = addSourceFile.call(project, filePath, opts, groupUuid);
    return file === false || file == null ? null : file;
  }

  // Fallback path: unit-test stubs that don't implement addSourceFile.
  const addFile = (project as { addFile?: AddFileFn }).addFile;
  if (typeof addFile !== 'function') {
    return null;
  }
  const fileRef = addFile.call(project, filePath, groupUuid, opts);
  if (!fileRef) {
    return null;
  }
  const addToPbxSourcesBuildPhase = (
    project as { addToPbxSourcesBuildPhase?: AddToPbxSourcesBuildPhaseFn }
  ).addToPbxSourcesBuildPhase;
  addToPbxSourcesBuildPhase?.call(project, fileRef, opts.target);
  return fileRef;
}
